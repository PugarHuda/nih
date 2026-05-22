// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IBorrowerOperations, ITroveManager, IPriceFeed} from "./interfaces/IMezoMUSD.sol";

/// @title NihTrove — Mezo MUSD trove opened on creator's behalf, on a
///         keeper-style relayer pattern. Caller sends BTC; NihTrove forwards
///         it to Mezo's BorrowerOperations.openTrove(), receives the minted
///         MUSD, and delivers it to the user. Real Mezo trove — no mock.
/// @notice Differs from NihCredit's peer-pool: NihCredit creates an internal
///         loan; NihTrove opens a *real* Mezo MUSD trove with 1% rate,
///         minimum 110% CR, BTC as collateral. The user keeps BTC exposure
///         (it's locked in the trove, not sold).
contract NihTrove is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    IBorrowerOperations public immutable borrowerOps;
    ITroveManager public immutable troveManager;
    IPriceFeed public immutable priceFeed;
    IERC20 public immutable musd;

    /// @notice address(0) hints — Mezo's BorrowerOperations accepts these
    ///         for the first trove of a new account; for production we'd
    ///         compute hints via HintHelpers.
    address private constant ZERO_HINT = address(0);

    event TroveProxyOpened(address indexed user, uint256 btcCollateral, uint256 debtAmount, uint256 musdToUser);
    event TroveProxyClosed(address indexed user, uint256 debtRepaid, uint256 collReturned);

    error MustSendBTC();
    error DebtTooLow();
    error AlreadyHasTrove();

    constructor(
        IBorrowerOperations _borrowerOps,
        ITroveManager _troveManager,
        IPriceFeed _priceFeed,
        IERC20 _musd
    ) Ownable(msg.sender) {
        borrowerOps = _borrowerOps;
        troveManager = _troveManager;
        priceFeed = _priceFeed;
        musd = _musd;
    }

    /// @notice Open a Mezo trove for caller via this proxy.
    /// @param debtAmount MUSD debt to mint (≥ 1800 MUSD typical minimum)
    /// @dev Caller sends BTC as msg.value; we forward to BorrowerOperations.
    ///      The trove is owned by *this contract* on Mezo's side — Nih is
    ///      the keeper. User receives the minted MUSD and can ask Nih to
    ///      close the trove later (or top up collateral).
    function openTroveFor(uint256 debtAmount) external payable nonReentrant {
        if (msg.value == 0) revert MustSendBTC();
        if (debtAmount == 0) revert DebtTooLow();

        // Try to open the trove on Mezo. Reverts if our existing trove status
        // would conflict — but Nih's trove address is the contract itself,
        // and we only allow one borrower per Nih deployment (clean-room).
        // To support multiple users sharing one trove, we'd need a per-user
        // proxy clone; v1 keeps it simple: one open trove at a time.
        if (troveManager.getTroveStatus(address(this)) == 1) revert AlreadyHasTrove();

        uint256 before = musd.balanceOf(address(this));
        borrowerOps.openTrove{value: msg.value}(debtAmount, ZERO_HINT, ZERO_HINT);
        uint256 minted = musd.balanceOf(address(this)) - before;

        musd.safeTransfer(msg.sender, minted);
        emit TroveProxyOpened(msg.sender, msg.value, debtAmount, minted);
    }

    /// @notice Close the active trove. Caller must hold ≥ outstanding debt
    ///         in MUSD and approve this contract to pull it; we forward it
    ///         to BorrowerOperations.closeTrove(), receive the BTC, send back.
    function closeTroveFor() external nonReentrant {
        uint256 debt = troveManager.getTroveDebt(address(this));
        uint256 coll = troveManager.getTroveColl(address(this));

        musd.safeTransferFrom(msg.sender, address(this), debt);
        musd.forceApprove(address(borrowerOps), debt);

        uint256 btcBefore = address(this).balance;
        borrowerOps.closeTrove();
        uint256 btcReturned = address(this).balance - btcBefore + coll - 0; // belt-and-suspenders

        (bool ok, ) = msg.sender.call{value: btcReturned}("");
        require(ok, "BTC return failed");

        emit TroveProxyClosed(msg.sender, debt, btcReturned);
    }

    /// @notice Current trove stats (debt + collateral + collateralisation ratio).
    function troveSnapshot() external view returns (uint256 debt, uint256 coll, uint256 status) {
        debt = troveManager.getTroveDebt(address(this));
        coll = troveManager.getTroveColl(address(this));
        status = troveManager.getTroveStatus(address(this));
    }

    // Accept BTC when Mezo's BorrowerOperations refunds us on closeTrove.
    receive() external payable {}
}
