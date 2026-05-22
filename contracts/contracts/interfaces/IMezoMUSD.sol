// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.28;

/// @dev Subset of Mezo's BorrowerOperations.sol that Nih needs.
interface IBorrowerOperations {
    function openTrove(uint256 _debtAmount, address _upperHint, address _lowerHint) external payable;
    function addColl(address _upperHint, address _lowerHint) external payable;
    function withdrawColl(uint256 _collWithdrawal, address _upperHint, address _lowerHint) external;
    function withdrawMUSD(uint256 _debtAmount, address _upperHint, address _lowerHint) external;
    function repayMUSD(uint256 _debtAmount, address _upperHint, address _lowerHint) external;
    function closeTrove() external;
}

/// @dev Subset of Mezo's TroveManager.sol read methods.
interface ITroveManager {
    function getTroveDebt(address _borrower) external view returns (uint256);
    function getTroveColl(address _borrower) external view returns (uint256);
    function getTroveStatus(address _borrower) external view returns (uint256);
    function getCurrentICR(address _borrower, uint256 _price) external view returns (uint256);
}

/// @dev Subset of Mezo's StabilityPool.sol — the real "Mezo Earn" surface.
interface IStabilityPool {
    function provideToSP(uint256 _amount) external;
    function withdrawFromSP(uint256 _amount) external;
    function getCompoundedMUSDDeposit(address _depositor) external view returns (uint256);
    function getDepositorBTCGain(address _depositor) external view returns (uint256);
}

/// @dev Subset of Mezo's PriceFeed.sol — BTC/USD oracle.
interface IPriceFeed {
    function fetchPrice() external returns (uint256);
    function lastGoodPrice() external view returns (uint256);
}
