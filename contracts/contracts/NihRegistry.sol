// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/// @title NihRegistry — social handle ↔ Mezo address registry with verification tiers.
/// @notice Maps "platform:username" → address. Tiered to mitigate impersonation.
contract NihRegistry is Ownable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    enum Tier {
        Unverified,
        Signature,
        OAuth,
        Manual
    }

    struct Identity {
        address wallet;
        Tier tier;
        uint64 verifiedAt;
    }

    /// @notice handleId = keccak256(abi.encodePacked(platform, ":", username))
    mapping(bytes32 handleId => Identity) public identities;
    mapping(address wallet => bytes32[]) public walletHandles;

    /// @notice Trusted signer for Tier.Signature & Tier.OAuth claims. Set to backend pubkey.
    address public verifier;

    event Registered(bytes32 indexed handleId, address indexed wallet, Tier tier);
    event VerifierUpdated(address indexed newVerifier);

    error InvalidSignature();
    error AlreadyRegistered();
    error NotOwner();

    constructor(address _verifier) Ownable(msg.sender) {
        verifier = _verifier;
    }

    function setVerifier(address _verifier) external onlyOwner {
        verifier = _verifier;
        emit VerifierUpdated(_verifier);
    }

    /// @notice Compute handleId from platform + username off-chain or on-chain.
    function handleId(string calldata platform, string calldata username) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(platform, ":", username));
    }

    /// @notice Register a handle via verifier-signed attestation.
    /// @dev Verifier signs (handleId, wallet, tier, deadline).
    function registerWithSignature(
        bytes32 _handleId,
        Tier tier,
        uint256 deadline,
        bytes calldata signature
    ) external {
        require(block.timestamp <= deadline, "Expired");
        require(tier != Tier.Unverified, "Tier 0 invalid");

        bytes32 digest = keccak256(abi.encodePacked(_handleId, msg.sender, tier, deadline, block.chainid))
            .toEthSignedMessageHash();
        address signer = digest.recover(signature);
        if (signer != verifier) revert InvalidSignature();

        _register(_handleId, msg.sender, tier);
    }

    /// @notice Manual whitelist by owner — for Tier.Manual (high-profile accounts via DAO).
    function manualRegister(bytes32 _handleId, address wallet) external onlyOwner {
        _register(_handleId, wallet, Tier.Manual);
    }

    function _register(bytes32 _handleId, address wallet, Tier tier) internal {
        Identity storage id = identities[_handleId];
        // Allow re-registration only if upgrading tier or same wallet
        if (id.wallet != address(0) && id.wallet != wallet) {
            revert AlreadyRegistered();
        }
        id.wallet = wallet;
        id.tier = tier;
        id.verifiedAt = uint64(block.timestamp);

        // Track handles per wallet (avoid dup)
        bytes32[] storage handles = walletHandles[wallet];
        bool exists;
        for (uint256 i; i < handles.length; ++i) {
            if (handles[i] == _handleId) {
                exists = true;
                break;
            }
        }
        if (!exists) handles.push(_handleId);

        emit Registered(_handleId, wallet, tier);
    }

    /// @notice Resolve handle to wallet. Returns address(0) if unregistered.
    function resolve(string calldata platform, string calldata username) external view returns (address wallet, Tier tier) {
        bytes32 id = handleId(platform, username);
        Identity memory identity = identities[id];
        return (identity.wallet, identity.tier);
    }

    function resolveById(bytes32 _handleId) external view returns (address wallet, Tier tier) {
        Identity memory identity = identities[_handleId];
        return (identity.wallet, identity.tier);
    }

    function handlesOf(address wallet) external view returns (bytes32[] memory) {
        return walletHandles[wallet];
    }
}
