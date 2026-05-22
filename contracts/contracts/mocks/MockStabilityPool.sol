// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IStabilityPool} from "../interfaces/IMezoMUSD.sol";

/// @dev Test double for Mezo's MUSD Stability Pool.
///      Stores the MUSD deposit balance per caller and lets us simulate
///      liquidations by sending BTC directly to a depositor address.
contract MockStabilityPool is IStabilityPool {
    using SafeERC20 for IERC20;

    IERC20 public immutable musd;
    mapping(address => uint256) public deposits;
    mapping(address => uint256) public btcGains;

    constructor(IERC20 _musd) {
        musd = _musd;
    }

    function provideToSP(uint256 amount) external override {
        if (amount > 0) {
            musd.safeTransferFrom(msg.sender, address(this), amount);
            deposits[msg.sender] += amount;
        }
        _payoutBtcGain(msg.sender);
    }

    function withdrawFromSP(uint256 amount) external override {
        require(deposits[msg.sender] >= amount, "Insufficient deposit");
        deposits[msg.sender] -= amount;
        if (amount > 0) musd.safeTransfer(msg.sender, amount);
        _payoutBtcGain(msg.sender);
    }

    function getCompoundedMUSDDeposit(address depositor) external view override returns (uint256) {
        return deposits[depositor];
    }

    function getDepositorBTCGain(address depositor) external view override returns (uint256) {
        return btcGains[depositor];
    }

    /// @dev Test helper — simulate a liquidation crediting BTC to a depositor.
    function creditBtcGain(address depositor) external payable {
        btcGains[depositor] += msg.value;
    }

    function _payoutBtcGain(address depositor) internal {
        uint256 gain = btcGains[depositor];
        if (gain == 0) return;
        btcGains[depositor] = 0;
        (bool ok, ) = depositor.call{value: gain}("");
        require(ok, "BTC payout failed");
    }

    receive() external payable {}
}
