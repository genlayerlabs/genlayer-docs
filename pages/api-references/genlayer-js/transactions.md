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
name in your SDK version (for example `14`) has been observed as a transient
state rather than an error: keep polling rather than treating it as a failure.

### A generic EVM receipt helper will not find the transaction

`getTransactionReceipt` from a generic EVM client (for example Viem's) returns
"not found" for GenLayer transactions. Use genlayer-js's `getTransaction`. This
note is about the EVM client's method, not about genlayer-js's own
`waitForTransactionReceipt`, which is supported.

### A write fired right after a deploy may revert

Calling a write method seconds after a successful deploy can revert at the EVM
level against the consensus contract, even when the deploy itself returned a
unanimous AGREE. We observed this ~2.2s after a deploy, with the identical call
to the identical address succeeding after a wait.

Treat it as a flake to retry through rather than something a delay reliably
prevents: we have also seen this revert occur with a 25 second post-deploy
delay. The practical point is that a revert here may have nothing to do with
your contract logic, so it is not the first place to look.

---
