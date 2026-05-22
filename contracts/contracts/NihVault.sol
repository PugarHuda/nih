// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {NihRegistry} from "./NihRegistry.sol";

/// @title NihVault — escrow holding tips for unregistered handles, plus credit-line collateral.
/// @notice Tips to unknown handles park here until recipient registers & claims.
/// @dev After TTL, anyone can refund to sender minus keeper bounty.
contract NihVault is ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct PendingTip {
        address sender;
        uint128 amount;
        uint64 timestamp;
        bool refunded;
        bool claimed;
    }

    uint256 public constant CLAIM_TTL = 180 days;
    uint256 public constant KEEPER_BOUNTY_BPS = 10; // 0.1%

    IERC20 public immutable musd;
    NihRegistry public immutable registry;
    address public router;

    /// @notice tipId → PendingTip
    mapping(uint256 tipId => PendingTip) public pendingTips;
    /// @notice handleId → list of tipIds awaiting claim
    mapping(bytes32 handleId => uint256[]) public handleTips;
    /// @notice handleId → claimable amount (sum of unclaimed)
    mapping(bytes32 handleId => uint256) public unclaimedAmount;
    /// @notice wallet → locked tip balance available as credit collateral
    mapping(address wallet => uint256) public lockedBalance;

    uint256 public nextTipId;

    event TipParked(uint256 indexed tipId, bytes32 indexed handleId, address indexed sender, uint256 amount);
    event TipClaimed(bytes32 indexed handleId, address indexed claimer, uint256 amount);
    event TipRefunded(uint256 indexed tipId, address indexed sender, uint256 amount, address keeper);
    event CollateralLocked(address indexed wallet, uint256 amount);
    event CollateralReleased(address indexed wallet, uint256 amount);
    event RouterSet(address indexed router);

    error OnlyRouter();
    error NotRegistered();
    error NothingToClaim();
    error NotExpired();
    error AlreadyResolved();
    error InsufficientLockable();

    modifier onlyRouter() {
        if (msg.sender != router) revert OnlyRouter();
        _;
    }

    constructor(IERC20 _musd, NihRegistry _registry) {
        musd = _musd;
        registry = _registry;
    }

    function setRouter(address _router) external {
        require(router == address(0), "Router set");
        router = _router;
        emit RouterSet(_router);
    }

    /// @notice Park a tip for unregistered handle. Called by router after pulling MUSD.
    function park(bytes32 handleId, address sender, uint256 amount) external onlyRouter {
        uint256 tipId = nextTipId++;
        pendingTips[tipId] = PendingTip({
            sender: sender,
            amount: uint128(amount),
            timestamp: uint64(block.timestamp),
            refunded: false,
            claimed: false
        });
        handleTips[handleId].push(tipId);
        unclaimedAmount[handleId] += amount;
        emit TipParked(tipId, handleId, sender, amount);
    }

    /// @notice Claim accumulated tips for caller's verified handle.
    function claim(bytes32 handleId) external nonReentrant {
        (address wallet, NihRegistry.Tier tier) = registry.resolveById(handleId);
        if (wallet != msg.sender || tier == NihRegistry.Tier.Unverified) revert NotRegistered();

        uint256 total = _sweep(handleId);
        if (total == 0) revert NothingToClaim();

        unclaimedAmount[handleId] = 0;
        musd.safeTransfer(msg.sender, total);
        emit TipClaimed(handleId, msg.sender, total);
    }

    /// @notice Refund expired tip. Anyone can call; caller gets keeper bounty.
    function refundExpired(uint256 tipId) external nonReentrant {
        PendingTip storage tip = pendingTips[tipId];
        if (tip.refunded || tip.claimed) revert AlreadyResolved();
        if (block.timestamp < tip.timestamp + CLAIM_TTL) revert NotExpired();

        tip.refunded = true;
        uint256 amount = tip.amount;
        uint256 bounty = (amount * KEEPER_BOUNTY_BPS) / 10_000;
        uint256 toSender = amount - bounty;

        musd.safeTransfer(tip.sender, toSender);
        if (bounty > 0) musd.safeTransfer(msg.sender, bounty);

        emit TipRefunded(tipId, tip.sender, toSender, msg.sender);
    }

    /// @notice Sweep all unclaimed for a handle, mark them claimed, return total.
    function _sweep(bytes32 handleId) internal returns (uint256 total) {
        uint256[] storage tips = handleTips[handleId];
        for (uint256 i; i < tips.length; ++i) {
            PendingTip storage tip = pendingTips[tips[i]];
            if (!tip.claimed && !tip.refunded) {
                tip.claimed = true;
                total += tip.amount;
            }
        }
    }

    /// @notice Lock claimed funds as credit collateral. Called by NihCredit.
    function lockCollateral(address wallet, uint256 amount) external onlyRouter {
        lockedBalance[wallet] += amount;
        emit CollateralLocked(wallet, amount);
    }

    function releaseCollateral(address wallet, uint256 amount) external onlyRouter {
        if (lockedBalance[wallet] < amount) revert InsufficientLockable();
        lockedBalance[wallet] -= amount;
        emit CollateralReleased(wallet, amount);
    }

    /// @notice View helper: unclaimed amount for a handle.
    function pendingFor(bytes32 handleId) external view returns (uint256) {
        return unclaimedAmount[handleId];
    }
}
