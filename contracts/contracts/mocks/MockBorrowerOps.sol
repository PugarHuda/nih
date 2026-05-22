// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {MockMUSD} from "./MockMUSD.sol";
import {IBorrowerOperations, ITroveManager} from "../interfaces/IMezoMUSD.sol";

/// @dev Combined mock for Mezo's BorrowerOperations + TroveManager.
///      Implements the minimum interface needed by NihTroveProxy.
contract MockBorrowerOps is IBorrowerOperations, ITroveManager {
    using SafeERC20 for IERC20;

    MockMUSD public immutable musd;

    struct Trove {
        uint256 debt;
        uint256 coll;
        uint256 status; // 1 = active
    }
    mapping(address => Trove) public troves;

    constructor(MockMUSD _musd) {
        musd = _musd;
    }

    function openTrove(uint256 debt, address, address) external payable override {
        require(troves[msg.sender].status != 1, "Already open");
        require(msg.value > 0, "Need BTC");
        require(debt > 0, "Need debt");
        // 110% CR check: collateral_value_in_musd >= 110% * debt. We
        // assume 1 BTC = 100,000 MUSD for the mock to keep things simple.
        uint256 collateralInMusd = (msg.value * 100_000);  // simplified price
        require(collateralInMusd >= (debt * 110) / 100, "CR < 110%");

        troves[msg.sender] = Trove({debt: debt, coll: msg.value, status: 1});
        musd.mint(msg.sender, debt);
    }

    function closeTrove() external override {
        Trove storage t = troves[msg.sender];
        require(t.status == 1, "Not open");
        uint256 debt = t.debt;
        uint256 coll = t.coll;
        // Mock burns by transferring debt to itself then ignoring it.
        musd.transferFrom(msg.sender, address(this), debt);
        delete troves[msg.sender];
        (bool ok, ) = msg.sender.call{value: coll}("");
        require(ok, "BTC refund failed");
    }

    function addColl(address, address) external payable override {
        troves[msg.sender].coll += msg.value;
    }

    function withdrawColl(uint256, address, address) external pure override {
        revert("Not supported in mock");
    }

    function withdrawMUSD(uint256 amount, address, address) external override {
        troves[msg.sender].debt += amount;
        musd.mint(msg.sender, amount);
    }

    function repayMUSD(uint256 amount, address, address) external override {
        troves[msg.sender].debt -= amount;
        musd.transferFrom(msg.sender, address(this), amount);
    }

    function getTroveDebt(address borrower) external view override returns (uint256) {
        return troves[borrower].debt;
    }

    function getTroveColl(address borrower) external view override returns (uint256) {
        return troves[borrower].coll;
    }

    function getTroveStatus(address borrower) external view override returns (uint256) {
        return troves[borrower].status;
    }

    function getCurrentICR(address, uint256) external pure override returns (uint256) {
        return 11_000; // mock 110% ICR
    }

    receive() external payable {}
}
