// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {NihVault} from "./NihVault.sol";

/// @title NihCredit — borrow MUSD against accumulated Nih tip balance.
/// @notice Creator stakes a portion of their received tips as collateral; mints credit at 60% LTV.
/// @dev Simplified for hackathon. Production would integrate Mezo trove + variable interest.
contract NihCredit is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    uint256 public constant LTV_BPS = 6000;         // 60% loan-to-value
    uint256 public constant LIQUIDATION_BPS = 9000; // 90% — if outstanding > 90% of collateral, liquidatable
    uint256 public constant INTEREST_BPS = 100;     // 1% flat (matches MUSD trove rate)

    IERC20 public immutable musd;
    NihVault public immutable vault;

    /// @notice Lender pool — anyone can deposit MUSD; earns interest from borrowers.
    /// @dev `totalOutstanding` tracks principal lent out so share accounting includes loans-in-flight.
    uint256 public totalOutstanding;
    mapping(address lender => uint256) public lenderShares;
    uint256 public totalShares;

    struct Loan {
        uint128 principal;     // MUSD borrowed
        uint128 collateral;    // MUSD locked from creator's tip balance
        uint64 openedAt;
    }
    mapping(address borrower => Loan) public loans;

    event LiquidityAdded(address indexed lender, uint256 amount, uint256 sharesMinted);
    event LiquidityRemoved(address indexed lender, uint256 amount, uint256 sharesBurned);
    event LoanOpened(address indexed borrower, uint256 collateral, uint256 borrowed);
    event LoanRepaid(address indexed borrower, uint256 repaid, uint256 interest);
    event LoanLiquidated(address indexed borrower, address keeper, uint256 seized);

    error InsufficientCollateral();
    error LoanAlreadyOpen();
    error NoLoan();
    error NotLiquidatable();
    error InsufficientLiquidity();

    constructor(IERC20 _musd, NihVault _vault) Ownable(msg.sender) {
        musd = _musd;
        vault = _vault;
    }

    // ──────────────────────────────────────────────────────────
    // Lender side — provide liquidity, earn interest
    // ──────────────────────────────────────────────────────────

    /// @notice Total assets = cash on hand + outstanding loan principal.
    function totalAssets() public view returns (uint256) {
        return musd.balanceOf(address(this)) + totalOutstanding;
    }

    function deposit(uint256 amount) external nonReentrant {
        // Snapshot BEFORE pulling tokens so share math reflects pre-deposit state.
        uint256 assetsBefore = totalAssets();
        musd.safeTransferFrom(msg.sender, address(this), amount);
        uint256 shares;
        if (totalShares == 0 || assetsBefore == 0) {
            shares = amount;
        } else {
            shares = (amount * totalShares) / assetsBefore;
        }
        totalShares += shares;
        lenderShares[msg.sender] += shares;
        emit LiquidityAdded(msg.sender, amount, shares);
    }

    function withdraw(uint256 shares) external nonReentrant {
        uint256 userShares = lenderShares[msg.sender];
        require(shares <= userShares, "Insufficient shares");
        // Withdrawals come from cash balance; if assets are illiquid (lent out), revert.
        uint256 assets = totalAssets();
        uint256 amount = (shares * assets) / totalShares;
        if (musd.balanceOf(address(this)) < amount) revert InsufficientLiquidity();

        lenderShares[msg.sender] -= shares;
        totalShares -= shares;

        musd.safeTransfer(msg.sender, amount);
        emit LiquidityRemoved(msg.sender, amount, shares);
    }

    // ──────────────────────────────────────────────────────────
    // Borrower side — open loan against locked tip balance
    // ──────────────────────────────────────────────────────────

    /// @notice Open a credit line. Locks `collateral` from borrower's tip-balance held in vault.
    /// @dev Borrower must already have claimed tips into their wallet AND approved this contract.
    function open(uint256 collateral) external nonReentrant {
        if (loans[msg.sender].principal != 0) revert LoanAlreadyOpen();

        // Borrower transfers MUSD (claimed tips) here to back the loan.
        musd.safeTransferFrom(msg.sender, address(this), collateral);

        uint256 borrowable = (collateral * LTV_BPS) / 10_000;
        if (musd.balanceOf(address(this)) < borrowable + collateral) revert InsufficientLiquidity();

        loans[msg.sender] = Loan({
            principal: uint128(borrowable),
            collateral: uint128(collateral),
            openedAt: uint64(block.timestamp)
        });
        totalOutstanding += borrowable;

        musd.safeTransfer(msg.sender, borrowable);
        emit LoanOpened(msg.sender, collateral, borrowable);
    }

    /// @notice Repay loan + interest. Releases collateral.
    function repay() external nonReentrant {
        Loan memory loan = loans[msg.sender];
        if (loan.principal == 0) revert NoLoan();

        uint256 owed = _owedAmount(loan);
        musd.safeTransferFrom(msg.sender, address(this), owed);

        delete loans[msg.sender];
        totalOutstanding -= loan.principal;

        // Return collateral to borrower
        musd.safeTransfer(msg.sender, loan.collateral);
        emit LoanRepaid(msg.sender, owed, owed - loan.principal);
    }

    /// @notice Liquidate an underwater loan. Keeper takes 0.5% bounty.
    function liquidate(address borrower) external nonReentrant {
        Loan memory loan = loans[borrower];
        if (loan.principal == 0) revert NoLoan();

        uint256 owed = _owedAmount(loan);
        // Liquidatable if owed > 90% of collateral (e.g. interest accumulated).
        if (owed * 10_000 < uint256(loan.collateral) * LIQUIDATION_BPS) revert NotLiquidatable();

        delete loans[borrower];
        totalOutstanding -= loan.principal;

        uint256 bounty = (uint256(loan.collateral) * 50) / 10_000; // 0.5%
        if (bounty > 0) musd.safeTransfer(msg.sender, bounty);

        emit LoanLiquidated(borrower, msg.sender, loan.collateral);
    }

    // ──────────────────────────────────────────────────────────
    // Views
    // ──────────────────────────────────────────────────────────

    function _owedAmount(Loan memory loan) internal view returns (uint256) {
        uint256 elapsed = block.timestamp - loan.openedAt;
        // Simple interest: principal * INTEREST_BPS * elapsed / (year * 10_000)
        uint256 interest = (uint256(loan.principal) * INTEREST_BPS * elapsed) / (365 days * 10_000);
        return loan.principal + interest;
    }

    function owedAmount(address borrower) external view returns (uint256) {
        return _owedAmount(loans[borrower]);
    }

    function maxBorrowable(uint256 tipBalance) external pure returns (uint256) {
        return (tipBalance * LTV_BPS) / 10_000;
    }
}
