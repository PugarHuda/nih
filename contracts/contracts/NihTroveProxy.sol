// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {IBorrowerOperations, ITroveManager} from "./interfaces/IMezoMUSD.sol";

/// @title NihTroveProxy — minimal per-user trove holder.
/// @notice One deployment per user via the OZ Clones library. Each clone
///         owns its own Mezo trove independently. The factory (NihTrove)
///         is the only authority that can open/close on behalf of the
///         user (via `owner` set at init).
contract NihTroveProxy is Initializable {
    using SafeERC20 for IERC20;

    address public owner;     // the end-user
    address public factory;   // NihTrove that cloned this
    IBorrowerOperations public borrowerOps;
    ITroveManager public troveManager;
    IERC20 public musd;

    event TroveOpened(uint256 btc, uint256 debt, uint256 mintedMusd);
    event TroveClosed(uint256 debtRepaid, uint256 btcReturned);

    error NotOwner();
    error NotFactory();
    error MustSendBTC();
    error ZeroDebt();
    error TroveAlreadyOpen();

    modifier onlyOwnerOrFactory() {
        if (msg.sender != owner && msg.sender != factory) revert NotOwner();
        _;
    }

    /// @notice Called once by the factory immediately after deploying the clone.
    function initialize(
        address _owner,
        address _factory,
        IBorrowerOperations _ops,
        ITroveManager _tm,
        IERC20 _musd
    ) external initializer {
        owner = _owner;
        factory = _factory;
        borrowerOps = _ops;
        troveManager = _tm;
        musd = _musd;
    }

    /// @notice Open the user's trove. Caller forwards BTC (msg.value) and
    ///         requests `debt` MUSD. Minted MUSD goes to the owner.
    function openTrove(uint256 debt) external payable onlyOwnerOrFactory {
        if (msg.value == 0) revert MustSendBTC();
        if (debt == 0) revert ZeroDebt();
        if (troveManager.getTroveStatus(address(this)) == 1) revert TroveAlreadyOpen();

        uint256 before = musd.balanceOf(address(this));
        borrowerOps.openTrove{value: msg.value}(debt, address(0), address(0));
        uint256 minted = musd.balanceOf(address(this)) - before;
        musd.safeTransfer(owner, minted);
        emit TroveOpened(msg.value, debt, minted);
    }

    /// @notice Close the trove. Owner must approve this clone for `debt`
    ///         MUSD up front. BTC collateral refunds straight to owner.
    function closeTrove() external onlyOwnerOrFactory {
        uint256 debt = troveManager.getTroveDebt(address(this));
        musd.safeTransferFrom(owner, address(this), debt);
        musd.forceApprove(address(borrowerOps), debt);

        uint256 btcBefore = address(this).balance;
        borrowerOps.closeTrove();
        uint256 btcReturned = address(this).balance - btcBefore;
        (bool ok, ) = owner.call{value: btcReturned}("");
        require(ok, "BTC return failed");
        emit TroveClosed(debt, btcReturned);
    }

    /// @notice View — snapshot of the user's trove state.
    function snapshot() external view returns (uint256 debt, uint256 coll, uint256 status) {
        debt = troveManager.getTroveDebt(address(this));
        coll = troveManager.getTroveColl(address(this));
        status = troveManager.getTroveStatus(address(this));
    }

    receive() external payable {}
}
