// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {IStabilityPool} from "./interfaces/IMezoMUSD.sol";

/// @title NihEarn v2 — wraps Mezo's MUSD Stability Pool with multi-user
///        reward-index accounting for fair BTC distribution.
/// @notice Creators auto-deposit tip income into Mezo's real Stability
///         Pool, earning compounded MUSD (rebalanced internally by the
///         pool during liquidations) plus BTC gains from liquidations.
///
/// @dev BTC distribution uses the classic accumulator pattern:
///        - globalRewardIndex grows by (newBTC * 1e18 / totalShares)
///          whenever BTC gain is harvested into this contract.
///        - Each user snapshots `userIndex` at deposit; on withdraw they
///          owe `userShares * (globalIndex - userIndex) / 1e18` in BTC.
///        This means a user can deposit AFTER a liquidation and not
///        collect rewards they didn't accrue — correct time-weighting.
contract NihEarn is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable musd;
    IStabilityPool public immutable stabilityPool;

    // ── MUSD share accounting ────────────────────────────────────────
    mapping(address user => uint256) public userShares;
    mapping(address user => uint256) public depositedPrincipal;
    mapping(address user => uint256) public withdrawnPrincipal;
    uint256 public totalShares;

    // ── BTC reward accumulator ───────────────────────────────────────
    uint256 public globalRewardIndex;      // 1e18-scaled
    /// @notice Last observed BTC balance after indexing. Anything above
    ///         this is a fresh reward; reward payouts subtract from it too.
    uint256 public lastBtcBalance;
    mapping(address user => uint256) public userRewardIndex;
    mapping(address user => uint256) public pendingReward;

    uint256 private constant _PRECISION = 1e18;

    event Deposited(address indexed user, uint256 amount, uint256 sharesMinted);
    event Withdrawn(address indexed user, uint256 amount, uint256 sharesBurned);
    event BTCYieldHarvested(uint256 newBTC, uint256 newGlobalIndex);
    event BTCClaimed(address indexed user, uint256 amount);

    error ZeroAmount();
    error InsufficientShares();
    error BTCTransferFailed();

    constructor(IERC20 _musd, IStabilityPool _pool) Ownable(msg.sender) {
        musd = _musd;
        stabilityPool = _pool;
        _musd.forceApprove(address(_pool), type(uint256).max);
    }

    /// @notice Current compounded MUSD position from the Stability Pool.
    function totalAssets() public view returns (uint256) {
        return stabilityPool.getCompoundedMUSDDeposit(address(this));
    }

    /// @notice MUSD value owed to `user` (excluding BTC rewards).
    function balanceOf(address user) external view returns (uint256) {
        if (totalShares == 0) return 0;
        return (userShares[user] * totalAssets()) / totalShares;
    }

    /// @notice BTC reward owed to `user` if they withdraw right now.
    function pendingBTCReward(address user) external view returns (uint256) {
        uint256 shares = userShares[user];
        if (shares == 0) return pendingReward[user];
        uint256 delta = globalRewardIndex - userRewardIndex[user];
        return pendingReward[user] + (shares * delta) / _PRECISION;
    }

    /// @notice Roll any NEW BTC sitting in this contract into the index.
    /// @dev `lastBtcBalance` lets us index only the delta since the
    ///      previous harvest, so post-payout residual isn't double-counted.
    function _harvestPendingBTC() internal {
        if (totalShares == 0) return;
        uint256 bal = address(this).balance;
        if (bal <= lastBtcBalance) {
            lastBtcBalance = bal;
            return;
        }
        uint256 newReward = bal - lastBtcBalance;
        globalRewardIndex += (newReward * _PRECISION) / totalShares;
        lastBtcBalance = bal;
        emit BTCYieldHarvested(newReward, globalRewardIndex);
    }

    function _accrue(address user) internal {
        uint256 shares = userShares[user];
        if (shares > 0) {
            uint256 delta = globalRewardIndex - userRewardIndex[user];
            if (delta > 0) {
                pendingReward[user] += (shares * delta) / _PRECISION;
            }
        }
        userRewardIndex[user] = globalRewardIndex;
    }

    /// @notice Deposit MUSD into Mezo Stability Pool through Nih.
    function deposit(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();

        // Settle any rewards that arrived as native BTC before this op
        // so depositors after a liquidation don't dilute existing claims.
        _harvestPendingBTC();
        _accrue(msg.sender);

        uint256 assetsBefore = totalAssets();
        musd.safeTransferFrom(msg.sender, address(this), amount);
        stabilityPool.provideToSP(amount);

        uint256 minted = (totalShares == 0 || assetsBefore == 0)
            ? amount
            : (amount * totalShares) / assetsBefore;

        userShares[msg.sender] += minted;
        totalShares += minted;
        depositedPrincipal[msg.sender] += amount;
        emit Deposited(msg.sender, amount, minted);
    }

    /// @notice Withdraw shares back to MUSD + auto-claim BTC reward.
    function withdraw(uint256 shares) external nonReentrant {
        if (shares == 0) revert ZeroAmount();
        uint256 owned = userShares[msg.sender];
        if (shares > owned) revert InsufficientShares();

        // Roll any BTC sitting in the contract (from prior liquidations or
        // direct transfers) into the global index BEFORE we burn shares.
        _harvestPendingBTC();

        uint256 btcBefore = address(this).balance;

        uint256 assets = totalAssets();
        uint256 amount = (shares * assets) / totalShares;
        uint256 totalSharesBefore = totalShares;

        userShares[msg.sender] = owned - shares;
        totalShares -= shares;
        withdrawnPrincipal[msg.sender] += amount;

        stabilityPool.withdrawFromSP(amount);
        uint256 btcGained = address(this).balance - btcBefore;
        if (btcGained > 0 && totalSharesBefore > 0) {
            globalRewardIndex += (btcGained * _PRECISION) / totalSharesBefore;
            emit BTCYieldHarvested(btcGained, globalRewardIndex);
        }

        // Withdrawing user's pending reward is what they earned on the
        // shares they HAD before this withdraw — accrue against the new
        // index using the original share count.
        if (owned > 0) {
            uint256 delta = globalRewardIndex - userRewardIndex[msg.sender];
            if (delta > 0) {
                pendingReward[msg.sender] += (owned * delta) / _PRECISION;
            }
        }
        userRewardIndex[msg.sender] = globalRewardIndex;

        uint256 reward = pendingReward[msg.sender];
        if (reward > 0) {
            pendingReward[msg.sender] = 0;
            // Update lastBtcBalance to reflect the impending outflow
            // so the next harvest doesn't see the residual as new reward.
            uint256 balNow = address(this).balance;
            lastBtcBalance = balNow >= reward ? balNow - reward : 0;
            Address.sendValue(payable(msg.sender), reward);
            emit BTCClaimed(msg.sender, reward);
        }

        musd.safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount, shares);
    }

    /// @notice Claim accumulated BTC reward without burning MUSD shares.
    function claimReward() external nonReentrant {
        _harvestPendingBTC();
        _accrue(msg.sender);
        uint256 reward = pendingReward[msg.sender];
        if (reward == 0) revert ZeroAmount();
        pendingReward[msg.sender] = 0;
        (bool ok, ) = msg.sender.call{value: reward}("");
        if (!ok) revert BTCTransferFailed();
        emit BTCClaimed(msg.sender, reward);
    }

    receive() external payable {}
}
