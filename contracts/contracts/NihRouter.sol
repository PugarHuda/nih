// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {NihRegistry} from "./NihRegistry.sol";
import {NihVault} from "./NihVault.sol";

/// @title NihRouter — single entry point for all tipping flows.
/// @notice User calls tip(); router resolves handle, routes to wallet or vault, charges fee.
///         Fee paid in MUSD by default; opt-in MEZO discount cuts protocol fee 50%.
contract NihRouter is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    uint256 public constant MIN_TIP = 0.5 ether;          // 0.5 MUSD
    uint256 public constant MAX_TIP_TIER0 = 10 ether;     // Unverified handle cap (lifetime claim)
    uint256 public constant FEE_BPS_MUSD = 50;            // 0.5%
    uint256 public constant FEE_BPS_MEZO = 25;            // 0.25% (50% discount)
    uint256 public constant BPS_DIVISOR = 10_000;

    /// @notice MEZO/MUSD exchange rate used to convert the MUSD-denominated fee into MEZO units.
    /// @dev Hackathon simplification: owner-set fixed rate. Production should pull from a TWAP oracle.
    ///      Stored as 1e18-scaled — e.g. 1e17 means 1 MUSD = 0.1 MEZO.
    uint256 public mezoPerMusd = 1e18; // default 1:1, can be tuned for matsnet demo

    IERC20 public immutable musd;
    IERC20 public immutable mezo;
    NihRegistry public immutable registry;
    NihVault public immutable vault;

    /// @notice Where protocol fees flow. Settable by owner — start with multisig, migrate to DAO.
    address public treasury;
    /// @notice Cumulative MUSD tipped per sender (analytics + leaderboards).
    mapping(address sender => uint256) public totalSent;
    /// @notice Cumulative MUSD received per recipient.
    mapping(address recipient => uint256) public totalReceived;

    event Tipped(
        address indexed sender,
        bytes32 indexed handleId,
        address indexed recipient,
        uint256 amount,
        uint256 fee,
        bool feePaidInMezo,
        bytes32 context
    );
    event TreasurySet(address indexed treasury);

    error TipTooSmall();
    error ZeroAddress();
    error TransferFailed();

    constructor(
        IERC20 _musd,
        IERC20 _mezo,
        NihRegistry _registry,
        NihVault _vault,
        address _treasury
    ) Ownable(msg.sender) {
        musd = _musd;
        mezo = _mezo;
        registry = _registry;
        vault = _vault;
        treasury = _treasury;
    }

    function setTreasury(address _treasury) external onlyOwner {
        if (_treasury == address(0)) revert ZeroAddress();
        treasury = _treasury;
        emit TreasurySet(_treasury);
    }

    function setMezoPerMusd(uint256 rate) external onlyOwner {
        require(rate > 0, "Invalid rate");
        mezoPerMusd = rate;
    }

    /// @notice Tip a social handle. Routes to wallet if registered, else parks in vault.
    /// @param platform e.g. "twitter", "youtube", "github"
    /// @param username handle without @
    /// @param amount MUSD amount (18 decimals)
    /// @param payFeeInMezo if true, fee in MEZO at 50% discount (caller must approve MEZO too)
    /// @param context optional bytes32 — tweet ID hash, video ID, etc. (for analytics)
    function tip(
        string calldata platform,
        string calldata username,
        uint256 amount,
        bool payFeeInMezo,
        bytes32 context
    ) external nonReentrant {
        if (amount < MIN_TIP) revert TipTooSmall();

        bytes32 handleId = registry.handleId(platform, username);
        (address recipient, NihRegistry.Tier tier) = registry.resolveById(handleId);

        // Pull principal from sender → router
        musd.safeTransferFrom(msg.sender, address(this), amount);

        // Compute fee. When paid in MEZO, convert the MUSD-denominated fee through
        // the owner-set exchange rate. (Production should swap to a TWAP oracle.)
        uint256 musdFee;
        uint256 mezoFee;
        if (payFeeInMezo) {
            uint256 musdEquivFee = (amount * FEE_BPS_MEZO) / BPS_DIVISOR;
            mezoFee = (musdEquivFee * mezoPerMusd) / 1e18;
        } else {
            musdFee = (amount * FEE_BPS_MUSD) / BPS_DIVISOR;
        }
        uint256 netAmount = amount - musdFee;

        // Settle MUSD fee
        if (musdFee > 0) {
            musd.safeTransfer(treasury, musdFee);
        }

        // Pull & forward MEZO fee if opted in
        if (mezoFee > 0) {
            mezo.safeTransferFrom(msg.sender, treasury, mezoFee);
        }

        // Route principal
        if (recipient != address(0) && tier != NihRegistry.Tier.Unverified) {
            musd.safeTransfer(recipient, netAmount);
            totalReceived[recipient] += netAmount;
            emit Tipped(msg.sender, handleId, recipient, netAmount, musdFee + mezoFee, payFeeInMezo, context);
        } else {
            // Park in vault
            musd.safeTransfer(address(vault), netAmount);
            vault.park(handleId, msg.sender, netAmount);
            emit Tipped(msg.sender, handleId, address(0), netAmount, musdFee + mezoFee, payFeeInMezo, context);
        }

        totalSent[msg.sender] += amount;
    }
}
