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
client.read_contract(address: Union, function_name: str, args: Union = None, kwargs: Union = None, account: Union = None, raw_return: bool = False, transaction_hash_variant: TransactionHashVariant = <TransactionHashVariant.LATEST_NONFINAL: 'latest-nonfinal'>, sim_config: Union = None)
```

| Parameter | Type | Required | Default |
|-----------|------|----------|---------|
| address | `Union` | yes |  |
| function_name | `str` | yes |  |
| args | `Union` | no | None |
| kwargs | `Union` | no | None |
| account | `Union` | no | None |
| raw_return | `bool` | no | False |
| transaction_hash_variant | `TransactionHashVariant` | no | <TransactionHashVariant.LATEST_NONFINAL: 'latest-nonfinal'> |
| sim_config | `Union` | no | None |

---

### write_contract

Executes a state-modifying function on a contract through consensus. Returns the transaction hash.

```python
client.write_contract(address: Union, function_name: str, account: Union = None, consensus_max_rotations: Union = None, value: int = 0, leader_only: bool = False, args: Union = None, kwargs: Union = None, sim_config: Union = None, valid_until: Union = None, fees: Union = None)
```

| Parameter | Type | Required | Default |
|-----------|------|----------|---------|
| address | `Union` | yes |  |
| function_name | `str` | yes |  |
| account | `Union` | no | None |
| consensus_max_rotations | `Union` | no | None |
| value | `int` | no | 0 |
| leader_only | `bool` | no | False |
| args | `Union` | no | None |
| kwargs | `Union` | no | None |
| sim_config | `Union` | no | None |
| valid_until | `Union` | no | None |
| fees | `Union` | no | None |

---

### simulate_write_contract

Simulates a state-modifying contract call without executing on-chain. Localnet only.

```python
client.simulate_write_contract(address: Union, function_name: str, account: Union = None, args: Union = None, kwargs: Union = None, value: int = 0, leader_only: bool = False, fees: Union = None, sim_config: Union = None, transaction_hash_variant: TransactionHashVariant = <TransactionHashVariant.LATEST_NONFINAL: 'latest-nonfinal'>)
```

| Parameter | Type | Required | Default |
|-----------|------|----------|---------|
| address | `Union` | yes |  |
| function_name | `str` | yes |  |
| account | `Union` | no | None |
| args | `Union` | no | None |
| kwargs | `Union` | no | None |
| value | `int` | no | 0 |
| leader_only | `bool` | no | False |
| fees | `Union` | no | None |
| sim_config | `Union` | no | None |
| transaction_hash_variant | `TransactionHashVariant` | no | <TransactionHashVariant.LATEST_NONFINAL: 'latest-nonfinal'> |

---

### deploy_contract

Deploys a new intelligent contract to GenLayer. Returns the transaction hash.

```python
client.deploy_contract(code: Union, account: Union = None, args: Union = None, kwargs: Union = None, consensus_max_rotations: Union = None, leader_only: bool = False, sim_config: Union = None, valid_until: Union = None, fees: Union = None)
```

| Parameter | Type | Required | Default |
|-----------|------|----------|---------|
| code | `Union` | yes |  |
| account | `Union` | no | None |
| args | `Union` | no | None |
| kwargs | `Union` | no | None |
| consensus_max_rotations | `Union` | no | None |
| leader_only | `bool` | no | False |
| sim_config | `Union` | no | None |
| valid_until | `Union` | no | None |
| fees | `Union` | no | None |

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

### get_current_fee_policy

Returns the active fee price policy used to build user-side caps.

```python
client.get_current_fee_policy()
```

---

### estimate_fees_distribution

Builds a fee distribution with caps derived from the active fee policy.

```python
client.estimate_fees_distribution(options=None)
```

| Parameter | Type | Required | Default |
|-----------|------|----------|---------|
| options | `FeeEstimateOptions` | no | None |

---

### estimate_transaction_fees

Builds a complete transaction fees object, including `feeValue`.

```python
client.estimate_transaction_fees(options=None)
```

| Parameter | Type | Required | Default |
|-----------|------|----------|---------|
| options | `FeeEstimateOptions` | no | None |

---

### estimate_transaction_fees_from_simulation

Builds a complete transaction fees object from a representative Studio simulation.

```python
client.estimate_transaction_fees_from_simulation(options)
```

| Parameter | Type | Required | Default |
|-----------|------|----------|---------|
| options | `SimulationFeeEstimateOptions` | yes |  |

---

### estimate_transaction_fees_for_write

Simulates one concrete Studio write and returns a complete transaction fees object.

```python
client.estimate_transaction_fees_for_write(
    address,
    function_name,
    account=None,
    args=None,
    kwargs=None,
    value=0,
    leader_only=False,
    options=None,
    sim_config=None,
    transaction_hash_variant=TransactionHashVariant.LATEST_NONFINAL,
)
```

| Parameter | Type | Required | Default |
|-----------|------|----------|---------|
| address | `Address \| ChecksumAddress` | yes |  |
| function_name | `str` | yes |  |
| account | `LocalAccount` | no | None |
| args | `list[CalldataEncodable]` | no | None |
| kwargs | `dict[str, CalldataEncodable]` | no | None |
| value | `int` | no | 0 |
| leader_only | `bool` | no | False |
| options | `FeeEstimateOptions` | no | None |
| sim_config | `SimConfig` | no | None |
| transaction_hash_variant | `TransactionHashVariant` | no | `LATEST_NONFINAL` |

---

### appeal_transaction

Appeals a consensus transaction to trigger a new round of validation.
Returns the original transaction_id (appeals operate on the same tx).
Missing decision/value inputs are filled from the authoritative quote
on both Studio and deployed Consensus.

```python
client.appeal_transaction(transaction_id: HexStr, account: Union = None, value: Union = None, expected_decision_id: Union = None)
```

| Parameter | Type | Required | Default |
|-----------|------|----------|---------|
| transaction_id | `HexStr` | yes |  |
| account | `Union` | no | None |
| value | `Union` | no | None |
| expected_decision_id | `Union` | no | None |

---

### top_up_fees

Deposits additional fee budget for an existing consensus transaction.

```python
client.top_up_fees(transaction_id: HexStr, distribution: FeesDistributionInput, value: int, account: Union = None)
```

| Parameter | Type | Required | Default |
|-----------|------|----------|---------|
| transaction_id | `HexStr` | yes |  |
| distribution | `FeesDistributionInput` | yes |  |
| value | `int` | yes |  |
| account | `Union` | no | None |

**Returns:** `HexStr`

---

### top_up_and_submit_appeal

Deposits appeal funding and submits an appeal.

Omitted decision/value inputs are resolved from the authoritative
appeal quote on both Studio and deployed Consensus.

```python
client.top_up_and_submit_appeal(transaction_id: HexStr, distribution: FeesDistributionInput, account: Union = None, value: Union = None, expected_decision_id: Union = None)
```

| Parameter | Type | Required | Default |
|-----------|------|----------|---------|
| transaction_id | `HexStr` | yes |  |
| distribution | `FeesDistributionInput` | yes |  |
| account | `Union` | no | None |
| value | `Union` | no | None |
| expected_decision_id | `Union` | no | None |

**Returns:** `HexStr`

---

### can_appeal

Checks whether the exact active decision can be appealed.

```python
client.can_appeal(transaction_id: HexStr, expected_decision_id: Union = None)
```

| Parameter | Type | Required | Default |
|-----------|------|----------|---------|
| transaction_id | `HexStr` | yes |  |
| expected_decision_id | `Union` | no | None |

**Returns:** `bool`

---

### get_appeal_quote

Returns the latest decision id, appeal charges, and deadline.

```python
client.get_appeal_quote(transaction_id: HexStr)
```

| Parameter | Type | Required | Default |
|-----------|------|----------|---------|
| transaction_id | `HexStr` | yes |  |

**Returns:** `Dict`

---

### get_appeal_charge

Returns the full appeal payment (bond plus induced-work funding).

```python
client.get_appeal_charge(transaction_id: HexStr)
```

| Parameter | Type | Required | Default |
|-----------|------|----------|---------|
| transaction_id | `HexStr` | yes |  |

**Returns:** `int`

---

### get_min_appeal_bond

Deprecated alias for :meth:`get_appeal_charge`.

```python
client.get_min_appeal_bond(transaction_id: HexStr)
```

| Parameter | Type | Required | Default |
|-----------|------|----------|---------|
| transaction_id | `HexStr` | yes |  |

**Returns:** `int`

---

### wait_for_decision

Poll until the stored transaction state is decided or terminal.

```python
client.wait_for_decision(transaction_hash: Union, interval: int = 3000, retries: int = 10, full_transaction: bool = False)
```

| Parameter | Type | Required | Default |
|-----------|------|----------|---------|
| transaction_hash | `Union` | yes |  |
| interval | `int` | no | 3000 |
| retries | `int` | no | 10 |
| full_transaction | `bool` | no | False |

**Returns:** `GenLayerTransaction`

---

### wait_for_finalization

Poll until the stored transaction state is finalized.

```python
client.wait_for_finalization(transaction_hash: Union, interval: int = 3000, retries: int = 10, full_transaction: bool = False)
```

| Parameter | Type | Required | Default |
|-----------|------|----------|---------|
| transaction_hash | `Union` | yes |  |
| interval | `int` | no | 3000 |
| retries | `int` | no | 10 |
| full_transaction | `bool` | no | False |

**Returns:** `GenLayerTransaction`

---

### wait_for_transaction_receipt

Poll for a stored decision (default) or stored finalization.

```python
client.wait_for_transaction_receipt(transaction_hash: Union, wait_until: Literal = 'decided', interval: int = 3000, retries: int = 10, full_transaction: bool = False)
```

| Parameter | Type | Required | Default |
|-----------|------|----------|---------|
| transaction_hash | `Union` | yes |  |
| wait_until | `Literal` | no | 'decided' |
| interval | `int` | no | 3000 |
| retries | `int` | no | 10 |
| full_transaction | `bool` | no | False |

**Returns:** `GenLayerTransaction`

---

### get_transaction

Fetch transaction data with a stable stored-state ``lifecycle``.

The lifecycle's ``state`` is one of processing, decided, finalized, or
canceled. Processing carries ``phase`` and decided carries ``outcome``.
The train exposes ``tx_execution_hash``; legacy receipt bytes are
unavailable, so ``tx_receipt`` is ``None``.

```python
client.get_transaction(transaction_hash: Union)
```

| Parameter | Type | Required | Default |
|-----------|------|----------|---------|
| transaction_hash | `Union` | yes |  |

**Returns:** `GenLayerTransaction`

---

### get_transaction_lifecycle

Return advanced stored/projected/action protocol lifecycle data.

If current Studio does not expose the advanced RPC, only its provable
stored status is returned: projection repeats it, resolution is
NoOp/Unspecified, and decision identity is inactive.

```python
client.get_transaction_lifecycle(transaction_hash: Union, timestamp: Union = None)
```

| Parameter | Type | Required | Default |
|-----------|------|----------|---------|
| transaction_hash | `Union` | yes |  |
| timestamp | `Union` | no | None |

**Returns:** `ProtocolTransactionLifecycle`

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
TransactionResult.MAJORITY_TIMEOUT = "MAJORITY_TIMEOUT"
```

---

### ExecutionResult

Result of contract execution by the GenVM.

```python
ExecutionResult.NOT_VOTED = "NOT_VOTED"
ExecutionResult.FINISHED_WITH_RETURN = "FINISHED_WITH_RETURN"
ExecutionResult.FINISHED_WITH_ERROR = "FINISHED_WITH_ERROR"
ExecutionResult.TIMEOUT = "TIMEOUT"
ExecutionResult.NONDET_DISAGREE = "NONDET_DISAGREE"
ExecutionResult.DETERMINISTIC_VIOLATION = "DETERMINISTIC_VIOLATION"
```

---

### VoteType

Validator execution vote recorded for a consensus round.

```python
VoteType.NOT_VOTED = "NOT_VOTED"
VoteType.FINISHED_WITH_RETURN = "FINISHED_WITH_RETURN"
VoteType.FINISHED_WITH_ERROR = "FINISHED_WITH_ERROR"
VoteType.TIMEOUT = "TIMEOUT"
VoteType.NONDET_DISAGREE = "NONDET_DISAGREE"
VoteType.DETERMINISTIC_VIOLATION = "DETERMINISTIC_VIOLATION"
```

---
