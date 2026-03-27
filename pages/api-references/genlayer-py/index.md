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

**Parameters:**

- **address** (`Union`) — required
- **amount** (`int`) — required

**Returns:** `HexBytes`

---

### get_current_nonce

Returns the current nonce (transaction count) for an account.

```python
client.get_current_nonce(address: Union = None, block_identifier: Union = None)
```

**Parameters:**

- **address** (`Union`) — optional = None
- **block_identifier** (`Union`) — optional = None

**Returns:** `Nonce`

---

### initialize_consensus_smart_contract

Initializes the consensus contract configuration from the network.

```python
client.initialize_consensus_smart_contract(force_reset: bool = False)
```

**Parameters:**

- **force_reset** (`bool`) — optional = False

**Returns:** `None`

---

### read_contract

Executes a read-only contract call without modifying state.

```python
client.read_contract(address: Union, function_name: str, args: Optional = None, kwargs: Optional = None, account: Optional = None, raw_return: bool = False, transaction_hash_variant: TransactionHashVariant = <TransactionHashVariant.LATEST_NONFINAL: 'latest-nonfinal'>, sim_config: Optional = None)
```

**Parameters:**

- **address** (`Union`) — required
- **function_name** (`str`) — required
- **args** (`Optional`) — optional = None
- **kwargs** (`Optional`) — optional = None
- **account** (`Optional`) — optional = None
- **raw_return** (`bool`) — optional = False
- **transaction_hash_variant** (`TransactionHashVariant`) — optional = <TransactionHashVariant.LATEST_NONFINAL: 'latest-nonfinal'>
- **sim_config** (`Optional`) — optional = None

---

### write_contract

Executes a state-modifying function on a contract through consensus. Returns the transaction hash.

```python
client.write_contract(address: Union, function_name: str, account: Optional = None, consensus_max_rotations: Optional = None, value: int = 0, leader_only: bool = False, args: Optional = None, kwargs: Optional = None, sim_config: Optional = None)
```

**Parameters:**

- **address** (`Union`) — required
- **function_name** (`str`) — required
- **account** (`Optional`) — optional = None
- **consensus_max_rotations** (`Optional`) — optional = None
- **value** (`int`) — optional = 0
- **leader_only** (`bool`) — optional = False
- **args** (`Optional`) — optional = None
- **kwargs** (`Optional`) — optional = None
- **sim_config** (`Optional`) — optional = None

---

### simulate_write_contract

Simulates a state-modifying contract call without executing on-chain. Localnet only.

```python
client.simulate_write_contract(address: Union, function_name: str, account: Optional = None, args: Optional = None, kwargs: Optional = None, sim_config: Optional = None, transaction_hash_variant: TransactionHashVariant = <TransactionHashVariant.LATEST_NONFINAL: 'latest-nonfinal'>)
```

**Parameters:**

- **address** (`Union`) — required
- **function_name** (`str`) — required
- **account** (`Optional`) — optional = None
- **args** (`Optional`) — optional = None
- **kwargs** (`Optional`) — optional = None
- **sim_config** (`Optional`) — optional = None
- **transaction_hash_variant** (`TransactionHashVariant`) — optional = <TransactionHashVariant.LATEST_NONFINAL: 'latest-nonfinal'>

---

### deploy_contract

Deploys a new intelligent contract to GenLayer. Returns the transaction hash.

```python
client.deploy_contract(code: Union, account: Optional = None, args: Optional = None, kwargs: Optional = None, consensus_max_rotations: Optional = None, leader_only: bool = False, sim_config: Optional = None)
```

**Parameters:**

- **code** (`Union`) — required
- **account** (`Optional`) — optional = None
- **args** (`Optional`) — optional = None
- **kwargs** (`Optional`) — optional = None
- **consensus_max_rotations** (`Optional`) — optional = None
- **leader_only** (`bool`) — optional = False
- **sim_config** (`Optional`) — optional = None

---

### get_contract_schema

Gets the schema (methods and constructor) of a deployed contract. Localnet only.

```python
client.get_contract_schema(address: Union)
```

**Parameters:**

- **address** (`Union`) — required

**Returns:** `ContractSchema`

---

### get_contract_schema_for_code

Generates a schema for contract code without deploying it. Localnet only.

```python
client.get_contract_schema_for_code(contract_code: AnyStr)
```

**Parameters:**

- **contract_code** (`AnyStr`) — required

**Returns:** `ContractSchema`

---

### appeal_transaction

Appeals a consensus transaction to trigger a new round of validation.

```python
client.appeal_transaction(transaction_id: HexStr, account: Optional = None, value: int = 0)
```

**Parameters:**

- **transaction_id** (`HexStr`) — required
- **account** (`Optional`) — optional = None
- **value** (`int`) — optional = 0

---

### wait_for_transaction_receipt

Polls until a transaction reaches the specified status. Returns the transaction receipt.

```python
client.wait_for_transaction_receipt(transaction_hash: Union, status: TransactionStatus = <TransactionStatus.ACCEPTED: 'ACCEPTED'>, interval: int = 3000, retries: int = 10, full_transaction: bool = False)
```

**Parameters:**

- **transaction_hash** (`Union`) — required
- **status** (`TransactionStatus`) — optional = <TransactionStatus.ACCEPTED: 'ACCEPTED'>
- **interval** (`int`) — optional = 3000
- **retries** (`int`) — optional = 10
- **full_transaction** (`bool`) — optional = False

**Returns:** `GenLayerTransaction`

---

### get_transaction

Fetches transaction data including status, execution result, and consensus details.

```python
client.get_transaction(transaction_hash: Union)
```

**Parameters:**

- **transaction_hash** (`Union`) — required

**Returns:** `GenLayerTransaction`

---

### get_triggered_transaction_ids

Returns transaction IDs of child transactions created from emitted messages.

```python
client.get_triggered_transaction_ids(transaction_hash: Union)
```

**Parameters:**

- **transaction_hash** (`Union`) — required

**Returns:** `list`

---

### debug_trace_transaction

Fetches the full execution trace including return data, stdout, stderr, and GenVM logs.

```python
client.debug_trace_transaction(transaction_hash: Union, round: int = 0)
```

**Parameters:**

- **transaction_hash** (`Union`) — required
- **round** (`int`) — optional = 0

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
