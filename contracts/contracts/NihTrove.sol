// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IBorrowerOperations, ITroveManager, IPriceFeed} from "./interfaces/IMezoMUSD.sol";
import {NihTroveProxy} from "./NihTroveProxy.sol";

/// @title NihTrove v2 — factory for per-user trove proxies on Mezo MUSD.
/// @notice Each end-user gets their own NihTroveProxy clone (EIP-1167)
///         that owns a real Mezo trove. The factory is just a registry
///         and helper for opening/inspecting the user's clone.
/// @dev Why a factory instead of one shared contract: Mezo's
///      BorrowerOperations identifies a trove by msg.sender. To support
///      multiple concurrent users we need distinct addresses. Minimal
///      proxies cost ~5k gas each at deploy + ~700 gas per delegatecall.
contract NihTrove is ReentrancyGuard, Ownable {
    using Clones for address;

    address public immutable implementation;
    IBorrowerOperations public immutable borrowerOps;
    ITroveManager public immutable troveManager;
    IPriceFeed public immutable priceFeed;
    IERC20 public immutable musd;

    mapping(address user => address proxy) public proxyOf;

    event ProxyCreated(address indexed user, address proxy);
    event TroveOpened(address indexed user, address indexed proxy, uint256 btc, uint256 debt);
    event TroveClosed(address indexed user, address indexed proxy);

    error NoProxy();

    constructor(
        IBorrowerOperations _ops,
        ITroveManager _tm,
        IPriceFeed _pf,
        IERC20 _musd
    ) Ownable(msg.sender) {
        borrowerOps = _ops;
        troveManager = _tm;
        priceFeed = _pf;
        musd = _musd;

        // Deploy a single implementation that all clones delegate to.
        implementation = address(new NihTroveProxy());
    }

    /// @notice Returns the user's proxy, deploying one on first use.
    function ensureProxy(address user) public returns (address proxy) {
        proxy = proxyOf[user];
        if (proxy == address(0)) {
            proxy = implementation.cloneDeterministic(keccak256(abi.encodePacked(user)));
            NihTroveProxy(payable(proxy)).initialize(user, address(this), borrowerOps, troveManager, musd);
            proxyOf[user] = proxy;
            emit ProxyCreated(user, proxy);
        }
    }

    /// @notice Predict the proxy address for a user (CREATE2).
    function predictProxy(address user) external view returns (address) {
        return implementation.predictDeterministicAddress(keccak256(abi.encodePacked(user)));
    }

    /// @notice Open the caller's trove. BTC sent here is forwarded to the
    ///         user's proxy clone which calls Mezo BorrowerOperations.
    function openTroveFor(uint256 debt) external payable nonReentrant {
        address proxy = ensureProxy(msg.sender);
        NihTroveProxy(payable(proxy)).openTrove{value: msg.value}(debt);
        emit TroveOpened(msg.sender, proxy, msg.value, debt);
    }

    /// @notice Close the caller's trove via their proxy.
    function closeTroveFor() external nonReentrant {
        address proxy = proxyOf[msg.sender];
        if (proxy == address(0)) revert NoProxy();
        NihTroveProxy(payable(proxy)).closeTrove();
        emit TroveClosed(msg.sender, proxy);
    }

    /// @notice Read-through helper — snapshot the caller's trove state.
    function snapshotOf(address user) external view returns (uint256 debt, uint256 coll, uint256 status) {
        address proxy = proxyOf[user];
        if (proxy == address(0)) return (0, 0, 0);
        return NihTroveProxy(payable(proxy)).snapshot();
    }
}
