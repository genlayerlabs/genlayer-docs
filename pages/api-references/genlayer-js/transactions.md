# Transaction Methods

Methods for fetching transactions, waiting for receipts, estimating gas, and debugging execution traces.

### waitForTransactionReceipt

Polls until a transaction reaches the specified status. Returns the transaction receipt.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| hash | `TransactionHash` | yes |  |
| status | `TransactionStatus` | yes |  |
| interval | `number` | no |  |
| retries | `number` | no |  |
| fullTransaction | `boolean` | no |  |

**Returns:** `GenLayerTransaction`

---

### getTransaction

Fetches transaction data including status, execution result, and consensus details.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| hash | `TransactionHash` | yes |  |

**Returns:** `GenLayerTransaction`

---

### getTriggeredTransactionIds

Returns transaction IDs of child transactions created from emitted messages.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| hash | `TransactionHash` | yes |  |

**Returns:** `TransactionHash[]`

---

### debugTraceTransaction

Fetches the full execution trace including return data, stdout, stderr, and GenVM logs.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| hash | `TransactionHash` | yes |  |
| round | `number` | no |  |

**Returns:** `DebugTraceResult`

---

### cancelTransaction

Cancels a pending transaction. Studio networks only.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| hash | `TransactionHash` | yes |  |

**Returns:** `{transaction_hash: string; status: string}`

---

### getTransactionQueuePosition

Returns the queue slot position of a transaction in the pending queue.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| hash | `TransactionHash` | yes |  |

**Returns:** `number`

---

### estimateTransactionGas

Estimates gas required for a transaction.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| from | `Address` | no |  |
| to | `Address` | yes |  |
| data | ``0x${string}`` | no |  |
| value | `bigint` | no |  |

**Returns:** `bigint`

---


## Reading consensus results

`getTransaction` returns consensus details, but the fields most people need are
nested and easy to miss. On a decided transaction:

| Field | Meaning |
|-------|---------|
| `resultName` | The consensus verdict, e.g. `AGREE`. |
| `txExecutionResultName` | What the code did, e.g. `FINISHED_WITH_RETURN`, `FINISHED_WITH_ERROR`. |
| `lastRound.validatorVotes` | Per-validator vote vector, e.g. `[1, 1, 1, 1, 1]`. |
| `lastRound.validatorVotesName` | The same votes as labels, e.g. `AGREE` / `DISAGREE`. |
| `lastRound.votesCommitted` / `lastRound.votesRevealed` | Vote counts for the round. |
| `lastRound.validatorResultHash` | Per-validator result hashes; compare them to detect a split. |
| `txDataDecoded.contractAddress` | Contract address after a deploy. |

Reading `resultName` alone is not enough to know a run was healthy. A
transaction can be `ACCEPTED` while validators split underneath, and it can be
`ACCEPTED` with every validator agreeing that the contract *raised*. Inspect the
vote vector and `txExecutionResultName` together.

### Statuses seen while polling

`COMMITTING` and `REVEALING` are in-flight. `ACCEPTED`, `FINALIZED`,
`UNDETERMINED` and `CANCELED` are decided. A numeric `status` value that has no
name in your SDK version (for example `14`) is a transient state, not an error:
keep polling rather than treating it as a failure.

### Do not reach for an EVM receipt helper

`getTransactionReceipt` from a generic EVM client returns "not found" for
GenLayer transactions. Use `getTransaction`.

### Allow a deploy to settle before calling a write method

Calling a write method immediately after a successful deploy can revert at the
EVM level against the consensus contract, even when the deploy itself returned a
unanimous AGREE. The same call to the same contract address succeeds once the
deploy has settled. If you are scripting deploy-then-write cycles, insert a
short wait between the two rather than chaining them directly.

---
