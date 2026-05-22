import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts";
import { Tipped } from "../generated/NihRouter/NihRouter";
import { LoanOpened, LoanRepaid } from "../generated/NihCredit/NihCredit";
import { StreamCreated, StreamWithdrawn, StreamCancelled } from "../generated/NihStream/NihStream";
import { Tip, Account, HandleStat, Loan, StreamRecord } from "../generated/schema";

const ZERO_ADDRESS = Address.zero();

function loadAccount(addr: Bytes): Account {
  let acc = Account.load(addr);
  if (!acc) {
    acc = new Account(addr);
    acc.address = addr;
    acc.totalSent = BigInt.zero();
    acc.totalReceived = BigInt.zero();
    acc.tipCount = BigInt.zero();
  }
  return acc;
}

function loadHandleStat(id: Bytes): HandleStat {
  let h = HandleStat.load(id);
  if (!h) {
    h = new HandleStat(id);
    h.handleId = id;
    h.totalReceived = BigInt.zero();
    h.tipCount = BigInt.zero();
  }
  return h;
}

export function handleTipped(event: Tipped): void {
  const tip = new Tip(event.transaction.hash.concatI32(event.logIndex.toI32()));
  const sender = loadAccount(event.params.sender);
  tip.sender = sender.id;
  if (event.params.recipient.notEqual(ZERO_ADDRESS)) {
    const recipient = loadAccount(event.params.recipient);
    recipient.totalReceived = recipient.totalReceived.plus(event.params.amount);
    recipient.tipCount = recipient.tipCount.plus(BigInt.fromI32(1));
    recipient.save();
    tip.recipient = recipient.id;
  }
  tip.handleId = event.params.handleId;
  tip.amount = event.params.amount;
  tip.fee = event.params.fee;
  tip.paidInMezo = event.params.feePaidInMezo;
  tip.context = event.params.context;
  tip.txHash = event.transaction.hash;
  tip.blockNumber = event.block.number;
  tip.timestamp = event.block.timestamp;
  tip.save();

  sender.totalSent = sender.totalSent.plus(event.params.amount);
  sender.tipCount = sender.tipCount.plus(BigInt.fromI32(1));
  sender.save();

  const stat = loadHandleStat(event.params.handleId);
  stat.totalReceived = stat.totalReceived.plus(event.params.amount);
  stat.tipCount = stat.tipCount.plus(BigInt.fromI32(1));
  stat.save();
}

// One active loan per borrower; key loans by borrower address so repay can find them.
export function handleLoanOpened(event: LoanOpened): void {
  const loan = new Loan(event.params.borrower);
  const borrower = loadAccount(event.params.borrower);
  loan.borrower = borrower.id;
  loan.collateral = event.params.collateral;
  loan.principal = event.params.borrowed;
  loan.openedAt = event.block.timestamp;
  loan.save();
  borrower.save();
}

export function handleLoanRepaid(event: LoanRepaid): void {
  const loan = Loan.load(event.params.borrower);
  if (!loan) return;
  loan.closedAt = event.block.timestamp;
  loan.repaidAmount = event.params.repaid;
  loan.save();
}

// ──────────────────────────────────────────────────────────────────
// Streams
// ──────────────────────────────────────────────────────────────────

function streamKey(streamId: BigInt): Bytes {
  // BigInt → padded hex → Bytes (graph-ts needs an explicit conversion)
  let hex = streamId.toHexString();
  if (hex.length % 2 !== 0) hex = "0x0" + hex.slice(2);
  return Bytes.fromHexString(hex);
}

export function handleStreamCreated(event: StreamCreated): void {
  const rec = new StreamRecord(streamKey(event.params.streamId));
  rec.streamId = event.params.streamId;
  rec.sender = event.params.sender;
  rec.recipient = event.params.recipient;
  rec.deposit = event.params.deposit;
  // graph-ts maps uint64 → BigInt directly; no conversion needed.
  rec.startTime = event.params.startTime;
  rec.stopTime = event.params.stopTime;
  rec.withdrawn = BigInt.zero();
  rec.cancelled = false;
  rec.save();
}

export function handleStreamWithdrawn(event: StreamWithdrawn): void {
  const rec = StreamRecord.load(streamKey(event.params.streamId));
  if (!rec) return;
  rec.withdrawn = rec.withdrawn.plus(event.params.amount);
  rec.save();
}

export function handleStreamCancelled(event: StreamCancelled): void {
  const rec = StreamRecord.load(streamKey(event.params.streamId));
  if (!rec) return;
  rec.cancelled = true;
  rec.cancelledAt = event.block.timestamp;
  rec.save();
}
