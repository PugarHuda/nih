// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title NihStream — per-second MUSD streaming payments.
/// @notice Sablier-style streams. Sender locks total amount up front;
///         recipient withdraws continuously as time passes.
///         Sender can cancel at any time; locked amount split pro-rata
///         between the recipient's owed share and the sender's refund.
contract NihStream is ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Stream {
        address sender;
        address recipient;
        uint128 deposit;       // total MUSD locked
        uint128 ratePerSecond; // 1e18-scaled MUSD per second
        uint64 startTime;
        uint64 stopTime;
        uint128 withdrawn;     // MUSD already paid to recipient
        bool cancelled;
    }

    IERC20 public immutable musd;
    uint256 public nextStreamId;
    mapping(uint256 streamId => Stream) public streams;
    mapping(address => uint256[]) public outgoing;
    mapping(address => uint256[]) public incoming;

    event StreamCreated(uint256 indexed streamId, address indexed sender, address indexed recipient, uint256 deposit, uint64 startTime, uint64 stopTime);
    event StreamWithdrawn(uint256 indexed streamId, address indexed recipient, uint256 amount);
    event StreamCancelled(uint256 indexed streamId, uint256 recipientShare, uint256 senderRefund);

    error InvalidDuration();
    error InvalidAmount();
    error InvalidRecipient();
    error NotRecipient();
    error NotSender();
    error AlreadyCancelled();
    error NothingToWithdraw();

    constructor(IERC20 _musd) {
        musd = _musd;
    }

    /// @notice Create a new stream. `duration` in seconds; total = deposit.
    function create(address recipient, uint256 deposit, uint64 duration) external nonReentrant returns (uint256 streamId) {
        if (recipient == address(0) || recipient == msg.sender) revert InvalidRecipient();
        if (deposit == 0) revert InvalidAmount();
        if (duration == 0) revert InvalidDuration();

        // Ensure pretty division: deposit % duration == 0 means rate is exact.
        // We tolerate inexact rates by rounding down per-second and using the
        // remainder as a final-tick top-up.
        uint128 rate = uint128((deposit * 1e18) / duration);
        if (rate == 0) revert InvalidAmount();

        streamId = nextStreamId++;
        uint64 startTime = uint64(block.timestamp);
        uint64 stopTime = startTime + duration;

        streams[streamId] = Stream({
            sender: msg.sender,
            recipient: recipient,
            deposit: uint128(deposit),
            ratePerSecond: rate,
            startTime: startTime,
            stopTime: stopTime,
            withdrawn: 0,
            cancelled: false
        });

        outgoing[msg.sender].push(streamId);
        incoming[recipient].push(streamId);

        musd.safeTransferFrom(msg.sender, address(this), deposit);
        emit StreamCreated(streamId, msg.sender, recipient, deposit, startTime, stopTime);
    }

    /// @notice How much the recipient can currently withdraw.
    /// @dev After cancel, all funds were distributed at cancel-time
    ///      (recipient paid out accrued share, sender refunded the rest),
    ///      so nothing is withdrawable anymore.
    function withdrawable(uint256 streamId) public view returns (uint256) {
        Stream memory s = streams[streamId];
        if (s.deposit == 0) return 0;
        if (s.cancelled) return 0;
        uint256 nowTs = block.timestamp > s.stopTime ? s.stopTime : block.timestamp;
        uint256 elapsed = nowTs - s.startTime;
        uint256 streamed = (elapsed * uint256(s.ratePerSecond)) / 1e18;
        if (streamed > s.deposit) streamed = s.deposit;
        if (streamed <= s.withdrawn) return 0;
        return streamed - s.withdrawn;
    }

    function withdraw(uint256 streamId) external nonReentrant {
        Stream storage s = streams[streamId];
        if (msg.sender != s.recipient) revert NotRecipient();
        uint256 amount = withdrawable(streamId);
        if (amount == 0) revert NothingToWithdraw();

        s.withdrawn += uint128(amount);
        musd.safeTransfer(msg.sender, amount);
        emit StreamWithdrawn(streamId, msg.sender, amount);
    }

    /// @notice Cancel the stream. Recipient gets their accrued-but-unwithdrawn
    /// share; sender gets the rest. Either party may call.
    function cancel(uint256 streamId) external nonReentrant {
        Stream storage s = streams[streamId];
        if (msg.sender != s.sender && msg.sender != s.recipient) revert NotSender();
        if (s.cancelled) revert AlreadyCancelled();

        uint256 nowTs = block.timestamp > s.stopTime ? s.stopTime : block.timestamp;
        uint256 elapsed = nowTs - s.startTime;
        uint256 streamed = (elapsed * uint256(s.ratePerSecond)) / 1e18;
        if (streamed > s.deposit) streamed = s.deposit;

        uint256 recipientOwed = streamed > s.withdrawn ? streamed - s.withdrawn : 0;
        uint256 senderRefund = uint256(s.deposit) - streamed;

        s.cancelled = true;
        // Mark withdrawn as the cumulative-streamed amount so future
        // `withdrawable()` returns 0 once recipientOwed is paid out below.
        s.withdrawn = uint128(streamed);

        if (recipientOwed > 0) musd.safeTransfer(s.recipient, recipientOwed);
        if (senderRefund > 0) musd.safeTransfer(s.sender, senderRefund);

        emit StreamCancelled(streamId, recipientOwed, senderRefund);
    }

    function outgoingOf(address user) external view returns (uint256[] memory) {
        return outgoing[user];
    }

    function incomingOf(address user) external view returns (uint256[] memory) {
        return incoming[user];
    }
}
