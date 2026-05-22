// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IStabilityPool} from "./interfaces/IMezoMUSD.sol";

/// @title NihEarn — wraps Mezo's MUSD Stability Pool.
/// @notice Creators auto-deposit their tip income into the real Mezo Stability
///         Pool, earning yield from liquidations + redemption fees. Withdrawals
///         return the compounded MUSD share. Pure pass-through — Nih takes no fee.
///
/// @dev Uses Liquity-v2 style share accounting on top of the Stability Pool.
///      The pool itself rebalances depositor shares as liquidations occur, so
///      our internal accounting just tracks "principal contributed" per user
///      and reads `getCompoundedMUSDDeposit` for the current entitlement.
contract NihEarn is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable musd;
    IStabilityPool public immutable stabilityPool;

    /// @notice Cumulative MUSD principal each user has deposited (for analytics).
    mapping(address user => uint256) public depositedPrincipal;
    /// @notice Cumulative MUSD principal users have withdrawn.
    mapping(address user => uint256) public withdrawnPrincipal;
    /// @notice Each user's pro-rata claim on the pool, scaled by `_PRECISION`.
    mapping(address user => uint256) public userShares;
    uint256 public totalShares;

    uint256 private constant _PRECISION = 1e18;

    event Deposited(address indexed user, uint256 amount, uint256 sharesMinted);
    event Withdrawn(address indexed user, uint256 amount, uint256 sharesBurned);
    event BTCYieldHarvested(address indexed user, uint256 btcAmount);

    error ZeroAmount();
    error InsufficientShares();

    constructor(IERC20 _musd, IStabilityPool _pool) Ownable(msg.sender) {
        musd = _musd;
        stabilityPool = _pool;
        // Pre-approve max so we never need to re-approve on each deposit.
        _musd.forceApprove(address(_pool), type(uint256).max);
    }

    /// @notice Total MUSD value managed by this contract — equals our
    ///         compounded position in the Mezo Stability Pool.
    function totalAssets() public view returns (uint256) {
        return stabilityPool.getCompoundedMUSDDeposit(address(this));
    }

    /// @notice Quote share value in MUSD for a given user.
    function balanceOf(address user) external view returns (uint256) {
        if (totalShares == 0) return 0;
        return (userShares[user] * totalAssets()) / totalShares;
    }

    /// @notice Deposit MUSD into Mezo Stability Pool through Nih.
    function deposit(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();

        // Mint shares pro-rata to assets BEFORE this deposit.
        uint256 assetsBefore = totalAssets();
        musd.safeTransferFrom(msg.sender, address(this), amount);
        stabilityPool.provideToSP(amount);

        uint256 minted;
        if (totalShares == 0 || assetsBefore == 0) {
            minted = amount;
        } else {
            minted = (amount * totalShares) / assetsBefore;
        }
        userShares[msg.sender] += minted;
        totalShares += minted;
        depositedPrincipal[msg.sender] += amount;
        emit Deposited(msg.sender, amount, minted);
    }

    /// @notice Withdraw a slice of the user's share back to MUSD.
    /// @dev BTC gains accrued in the Stability Pool are paid out
    ///      proportional to the user's share of the burn.
    ///      Stability Pool flushes a portion of accumulated BTC on every
    ///      withdraw; we forward that BTC to the withdrawing user.
    ///      v1 limitation: BTC distribution is per-withdrawal (last writer
    ///      may take more than ideal); a v2 reward-index pattern fixes it.
    function withdraw(uint256 shares) external nonReentrant {
        if (shares == 0) revert ZeroAmount();
        uint256 owned = userShares[msg.sender];
        if (shares > owned) revert InsufficientShares();

        uint256 assets = totalAssets();
        uint256 amount = (shares * assets) / totalShares;

        userShares[msg.sender] = owned - shares;
        totalShares -= shares;
        withdrawnPrincipal[msg.sender] += amount;

        uint256 btcBefore = address(this).balance;
        stabilityPool.withdrawFromSP(amount);
        uint256 btcGained = address(this).balance - btcBefore;

        musd.safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount, shares);

        if (btcGained > 0) {
            (bool ok, ) = msg.sender.call{value: btcGained}("");
            require(ok, "BTC payout failed");
            emit BTCYieldHarvested(msg.sender, btcGained);
        }
    }

    /// @notice View the user's accrued BTC gain via the Stability Pool.
    function pendingBTCYield() external view returns (uint256) {
        return stabilityPool.getDepositorBTCGain(address(this));
    }

    // Accept BTC distributions from Stability Pool liquidations.
    receive() external payable {}
}
