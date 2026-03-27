# GenLayerPY SDK API Reference

Auto-generated from source docstrings.

## Client Methods

Client for interacting with the GenLayer network.

Provides methods for deploying and calling intelligent contracts,
managing transactions, and staking operations.

### fund_account

Funds an account with test tokens. Localnet only.

```python
client.fund_account(address: Union, amount: int)
```

| Parameter | Type | Required | Default |
|-----------|------|----------|---------|
| address | `Union` | yes |  |
| amount | `int` | yes |  |

**Returns:** `HexBytes`

---

### get_current_nonce

Returns the current nonce (transaction count) for an account.

```python
client.get_current_nonce(address: Union = None, block_identifier: Union = None)
```

| Parameter | Type | Required | Default |
|-----------|------|----------|---------|
| address | `Union` | no | None |
| block_identifier | `Union` | no | None |

**Returns:** `Nonce`

---

### initialize_consensus_smart_contract

Initializes the consensus contract configuration from the network.

```python
client.initialize_consensus_smart_contract(force_reset: bool = False)
```

| Parameter | Type | Required | Default |
|-----------|------|----------|---------|
| force_reset | `bool` | no | False |

**Returns:** `None`

---

### read_contract

Executes a read-only contract call without modifying state.

```python
client.read_contract(address: Union, function_name: str, args: Optional = None, kwargs: Optional = None, account: Optional = None, raw_return: bool = False, transaction_hash_variant: TransactionHashVariant = <TransactionHashVariant.LATEST_NONFINAL: 'latest-nonfinal'>, sim_config: Optional = None)
```

| Parameter | Type | Required | Default |
|-----------|------|----------|---------|
| address | `Union` | yes |  |
| function_name | `str` | yes |  |
| args | `Optional` | no | None |
| kwargs | `Optional` | no | None |
| account | `Optional` | no | None |
| raw_return | `bool` | no | False |
| transaction_hash_variant | `TransactionHashVariant` | no | <TransactionHashVariant.LATEST_NONFINAL: 'latest-nonfinal'> |
| sim_config | `Optional` | no | None |

---

### write_contract

Executes a state-modifying function on a contract through consensus. Returns the transaction hash.

```python
client.write_contract(address: Union, function_name: str, account: Optional = None, consensus_max_rotations: Optional = None, value: int = 0, leader_only: bool = False, args: Optional = None, kwargs: Optional = None, sim_config: Optional = None)
```

| Parameter | Type | Required | Default |
|-----------|------|----------|---------|
| address | `Union` | yes |  |
| function_name | `str` | yes |  |
| account | `Optional` | no | None |
| consensus_max_rotations | `Optional` | no | None |
| value | `int` | no | 0 |
| leader_only | `bool` | no | False |
| args | `Optional` | no | None |
| kwargs | `Optional` | no | None |
| sim_config | `Optional` | no | None |

---

### simulate_write_contract

Simulates a state-modifying contract call without executing on-chain. Localnet only.

```python
client.simulate_write_contract(address: Union, function_name: str, account: Optional = None, args: Optional = None, kwargs: Optional = None, sim_config: Optional = None, transaction_hash_variant: TransactionHashVariant = <TransactionHashVariant.LATEST_NONFINAL: 'latest-nonfinal'>)
```

| Parameter | Type | Required | Default |
|-----------|------|----------|---------|
| address | `Union` | yes |  |
| function_name | `str` | yes |  |
| account | `Optional` | no | None |
| args | `Optional` | no | None |
| kwargs | `Optional` | no | None |
| sim_config | `Optional` | no | None |
| transaction_hash_variant | `TransactionHashVariant` | no | <TransactionHashVariant.LATEST_NONFINAL: 'latest-nonfinal'> |

---

### deploy_contract

Deploys a new intelligent contract to GenLayer. Returns the transaction hash.

```python
client.deploy_contract(code: Union, account: Optional = None, args: Optional = None, kwargs: Optional = None, consensus_max_rotations: Optional = None, leader_only: bool = False, sim_config: Optional = None)
```

| Parameter | Type | Required | Default |
|-----------|------|----------|---------|
| code | `Union` | yes |  |
| account | `Optional` | no | None |
| args | `Optional` | no | None |
| kwargs | `Optional` | no | None |
| consensus_max_rotations | `Optional` | no | None |
| leader_only | `bool` | no | False |
| sim_config | `Optional` | no | None |

---

### get_contract_schema

Gets the schema (methods and constructor) of a deployed contract. Localnet only.

```python
client.get_contract_schema(address: Union)
```

| Parameter | Type | Required | Default |
|-----------|------|----------|---------|
| address | `Union` | yes |  |

**Returns:** `ContractSchema`

---

### get_contract_schema_for_code

Generates a schema for contract code without deploying it. Localnet only.

```python
client.get_contract_schema_for_code(contract_code: AnyStr)
```

| Parameter | Type | Required | Default |
|-----------|------|----------|---------|
| contract_code | `AnyStr` | yes |  |

**Returns:** `ContractSchema`

---

### appeal_transaction

Appeals a consensus transaction to trigger a new round of validation.

```python
client.appeal_transaction(transaction_id: HexStr, account: Optional = None, value: int = 0)
```

| Parameter | Type | Required | Default |
|-----------|------|----------|---------|
| transaction_id | `HexStr` | yes |  |
| account | `Optional` | no | None |
| value | `int` | no | 0 |

---

### wait_for_transaction_receipt

Polls until a transaction reaches the specified status. Returns the transaction receipt.

```python
client.wait_for_transaction_receipt(transaction_hash: Union, status: TransactionStatus = <TransactionStatus.ACCEPTED: 'ACCEPTED'>, interval: int = 3000, retries: int = 10, full_transaction: bool = False)
```

| Parameter | Type | Required | Default |
|-----------|------|----------|---------|
| transaction_hash | `Union` | yes |  |
| status | `TransactionStatus` | no | <TransactionStatus.ACCEPTED: 'ACCEPTED'> |
| interval | `int` | no | 3000 |
| retries | `int` | no | 10 |
| full_transaction | `bool` | no | False |

**Returns:** `GenLayerTransaction`

---

### get_transaction

Fetches transaction data including status, execution result, and consensus details.

```python
client.get_transaction(transaction_hash: Union)
```

| Parameter | Type | Required | Default |
|-----------|------|----------|---------|
| transaction_hash | `Union` | yes |  |

**Returns:** `GenLayerTransaction`

---

### get_triggered_transaction_ids

Returns transaction IDs of child transactions created from emitted messages.

```python
client.get_triggered_transaction_ids(transaction_hash: Union)
```

| Parameter | Type | Required | Default |
|-----------|------|----------|---------|
| transaction_hash | `Union` | yes |  |

**Returns:** `list`

---

### debug_trace_transaction

Fetches the full execution trace including return data, stdout, stderr, and GenVM logs.

```python
client.debug_trace_transaction(transaction_hash: Union, round: int = 0)
```

| Parameter | Type | Required | Default |
|-----------|------|----------|---------|
| transaction_hash | `Union` | yes |  |
| round | `int` | no | 0 |

**Returns:** `dict`

---

## Types and Enums

### TransactionStatus

Status of a GenLayer transaction in the consensus lifecycle.

```python
TransactionStatus.UNINITIALIZED = "UNINITIALIZED"
TransactionStatus.PENDING = "PENDING"
TransactionStatus.PROPOSING = "PROPOSING"
TransactionStatus.COMMITTING = "COMMITTING"
TransactionStatus.REVEALING = "REVEALING"
TransactionStatus.ACCEPTED = "ACCEPTED"
TransactionStatus.UNDETERMINED = "UNDETERMINED"
TransactionStatus.FINALIZED = "FINALIZED"
TransactionStatus.CANCELED = "CANCELED"
TransactionStatus.APPEAL_REVEALING = "APPEAL_REVEALING"
TransactionStatus.APPEAL_COMMITTING = "APPEAL_COMMITTING"
TransactionStatus.READY_TO_FINALIZE = "READY_TO_FINALIZE"
TransactionStatus.VALIDATORS_TIMEOUT = "VALIDATORS_TIMEOUT"
TransactionStatus.LEADER_TIMEOUT = "LEADER_TIMEOUT"
```

---

### TransactionResult

Consensus voting result across validators.

```python
TransactionResult.IDLE = "IDLE"
TransactionResult.AGREE = "AGREE"
TransactionResult.DISAGREE = "DISAGREE"
TransactionResult.TIMEOUT = "TIMEOUT"
TransactionResult.DETERMINISTIC_VIOLATION = "DETERMINISTIC_VIOLATION"
TransactionResult.NO_MAJORITY = "NO_MAJORITY"
TransactionResult.MAJORITY_AGREE = "MAJORITY_AGREE"
TransactionResult.MAJORITY_DISAGREE = "MAJORITY_DISAGREE"
```

---

### ExecutionResult

Result of contract execution by the GenVM.

```python
ExecutionResult.NOT_VOTED = "NOT_VOTED"
ExecutionResult.FINISHED_WITH_RETURN = "FINISHED_WITH_RETURN"
ExecutionResult.FINISHED_WITH_ERROR = "FINISHED_WITH_ERROR"
```

---

### VoteType

str(object='') -> str
str(bytes_or_buffer[, encoding[, errors]]) -> str

Create a new string object from the given object. If encoding or
errors is specified, then the object must expose a data buffer
that will be decoded using the given encoding and error handler.
Otherwise, returns the result of object.__str__() (if defined)
or repr(object).
encoding defaults to 'utf-8'.
errors defaults to 'strict'.

```python
VoteType.NOT_VOTED = "NOT_VOTED"
VoteType.AGREE = "AGREE"
VoteType.DISAGREE = "DISAGREE"
VoteType.TIMEOUT = "TIMEOUT"
VoteType.DETERMINISTIC_VIOLATION = "DETERMINISTIC_VIOLATION"
```

---
