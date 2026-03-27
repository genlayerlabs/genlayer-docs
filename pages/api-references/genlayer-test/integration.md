# Integration Testing

Test contracts against a running GenLayer network (localnet, studionet, or testnet).

## Setup Functions

### `get_contract_factory`

Get a ContractFactory instance for a contract.

Args:
    contract_name: Name of the contract to load from artifacts
    contract_file_path: Path to the contract file to load directly

Note: Exactly one of contract_name or contract_file_path must be provided.

```python
get_contract_factory(contract_name: Optional = None, contract_file_path: Union = None)
```

**Parameters:**

| Parameter | Type | Required | Default |
|-----------|------|----------|---------|
| `contract_name` | `Optional` | No | `None` |
| `contract_file_path` | `Union` | No | `None` |

**Returns:** `ContractFactory`

---
### `get_default_account`

Returns the default account for the current network.

**Returns:** `LocalAccount`

---
### `get_accounts`

Returns all configured accounts for the current network.

**Returns:** `List`

---
### `create_accounts`

Creates n new accounts with random private keys.

```python
create_accounts(n_accounts: int)
```

**Parameters:**

| Parameter | Type | Required | Default |
|-----------|------|----------|---------|
| `n_accounts` | `int` | Yes |  |

---
### `get_gl_client`

Get the GenLayer client instance.

---
### `get_validator_factory`



**Returns:** `ValidatorFactory`

---
## ContractFactory

A factory for deploying contracts.

### `factory.deploy`

Deploy the contract and return a Contract instance (convenience method).

This is a convenience method that handles receipt validation
and contract instantiation automatically.

```python
factory.deploy(args: Optional = None, account: Optional = None, consensus_max_rotations: Optional = None, wait_interval: Optional = None, wait_retries: Optional = None, wait_transaction_status: TransactionStatus = <TransactionStatus.ACCEPTED: 'ACCEPTED'>, wait_triggered_transactions: bool = False, wait_triggered_transactions_status: TransactionStatus = <TransactionStatus.ACCEPTED: 'ACCEPTED'>, transaction_context: Optional = None)
```

**Parameters:**

| Parameter | Type | Required | Default |
|-----------|------|----------|---------|
| `args` | `Optional` | No | `None` |
| `account` | `Optional` | No | `None` |
| `consensus_max_rotations` | `Optional` | No | `None` |
| `wait_interval` | `Optional` | No | `None` |
| `wait_retries` | `Optional` | No | `None` |
| `wait_transaction_status` | `TransactionStatus` | No | `<TransactionStatus.ACCEPTED: 'ACCEPTED'>` |
| `wait_triggered_transactions` | `bool` | No | `False` |
| `wait_triggered_transactions_status` | `TransactionStatus` | No | `<TransactionStatus.ACCEPTED: 'ACCEPTED'>` |
| `transaction_context` | `Optional` | No | `None` |

**Returns:** `Contract`

---

### `factory.deploy_contract_tx`

Deploy the contract and return the transaction receipt.

```python
factory.deploy_contract_tx(args: Optional = None, account: Optional = None, consensus_max_rotations: Optional = None, wait_interval: Optional = None, wait_retries: Optional = None, wait_transaction_status: TransactionStatus = <TransactionStatus.ACCEPTED: 'ACCEPTED'>, wait_triggered_transactions: bool = False, wait_triggered_transactions_status: TransactionStatus = <TransactionStatus.ACCEPTED: 'ACCEPTED'>, transaction_context: Optional = None)
```

**Parameters:**

| Parameter | Type | Required | Default |
|-----------|------|----------|---------|
| `args` | `Optional` | No | `None` |
| `account` | `Optional` | No | `None` |
| `consensus_max_rotations` | `Optional` | No | `None` |
| `wait_interval` | `Optional` | No | `None` |
| `wait_retries` | `Optional` | No | `None` |
| `wait_transaction_status` | `TransactionStatus` | No | `<TransactionStatus.ACCEPTED: 'ACCEPTED'>` |
| `wait_triggered_transactions` | `bool` | No | `False` |
| `wait_triggered_transactions_status` | `TransactionStatus` | No | `<TransactionStatus.ACCEPTED: 'ACCEPTED'>` |
| `transaction_context` | `Optional` | No | `None` |

**Returns:** `GenLayerTransaction`

---

### `factory.build_contract`

Build contract from address

```python
factory.build_contract(contract_address: Union, account: Optional = None)
```

**Parameters:**

| Parameter | Type | Required | Default |
|-----------|------|----------|---------|
| `contract_address` | `Union` | Yes |  |
| `account` | `Optional` | No | `None` |

**Returns:** `Contract`

---
## ContractFunction

ContractFunction(method_name: str, read_only: bool, call_method: Optional[Callable] = None, analyze_method: Optional[Callable] = None, transact_method: Optional[Callable] = None)

### `contract.method_name.call`

Executes a read-only contract method call.

```python
contract.method_name.call(transaction_hash_variant: TransactionHashVariant = <TransactionHashVariant.LATEST_NONFINAL: 'latest-nonfinal'>, transaction_context: Optional = None)
```

**Parameters:**

| Parameter | Type | Required | Default |
|-----------|------|----------|---------|
| `transaction_hash_variant` | `TransactionHashVariant` | No | `<TransactionHashVariant.LATEST_NONFINAL: 'latest-nonfinal'>` |
| `transaction_context` | `Optional` | No | `None` |

---

### `contract.method_name.transact`

Executes a state-changing contract method through consensus. Returns the transaction receipt.

```python
contract.method_name.transact(value: int = 0, consensus_max_rotations: Optional = None, wait_transaction_status: TransactionStatus = <TransactionStatus.ACCEPTED: 'ACCEPTED'>, wait_interval: Optional = None, wait_retries: Optional = None, wait_triggered_transactions: bool = False, wait_triggered_transactions_status: TransactionStatus = <TransactionStatus.ACCEPTED: 'ACCEPTED'>, transaction_context: Optional = None)
```

**Parameters:**

| Parameter | Type | Required | Default |
|-----------|------|----------|---------|
| `value` | `int` | No | `0` |
| `consensus_max_rotations` | `Optional` | No | `None` |
| `wait_transaction_status` | `TransactionStatus` | No | `<TransactionStatus.ACCEPTED: 'ACCEPTED'>` |
| `wait_interval` | `Optional` | No | `None` |
| `wait_retries` | `Optional` | No | `None` |
| `wait_triggered_transactions` | `bool` | No | `False` |
| `wait_triggered_transactions_status` | `TransactionStatus` | No | `<TransactionStatus.ACCEPTED: 'ACCEPTED'>` |
| `transaction_context` | `Optional` | No | `None` |

---

### `contract.method_name.analyze`

Runs statistical analysis of method behavior across multiple executions.

```python
contract.method_name.analyze(provider: str, model: str, config: Optional = None, plugin: Optional = None, plugin_config: Optional = None, runs: int = 100, genvm_datetime: Optional = None)
```

**Parameters:**

| Parameter | Type | Required | Default |
|-----------|------|----------|---------|
| `provider` | `str` | Yes |  |
| `model` | `str` | Yes |  |
| `config` | `Optional` | No | `None` |
| `plugin` | `Optional` | No | `None` |
| `plugin_config` | `Optional` | No | `None` |
| `runs` | `int` | No | `100` |
| `genvm_datetime` | `Optional` | No | `None` |

---
## ValidatorFactory



### `validator_factory.create_validator`



```python
validator_factory.create_validator(stake: int, provider: str, model: str, config: Dict, plugin: str, plugin_config: Dict)
```

**Parameters:**

| Parameter | Type | Required | Default |
|-----------|------|----------|---------|
| `stake` | `int` | Yes |  |
| `provider` | `str` | Yes |  |
| `model` | `str` | Yes |  |
| `config` | `Dict` | Yes |  |
| `plugin` | `str` | Yes |  |
| `plugin_config` | `Dict` | Yes |  |

**Returns:** `Validator`

---

### `validator_factory.batch_create_validators`



```python
validator_factory.batch_create_validators(count: int, stake: int, provider: str, model: str, config: Dict, plugin: str, plugin_config: Dict)
```

**Parameters:**

| Parameter | Type | Required | Default |
|-----------|------|----------|---------|
| `count` | `int` | Yes |  |
| `stake` | `int` | Yes |  |
| `provider` | `str` | Yes |  |
| `model` | `str` | Yes |  |
| `config` | `Dict` | Yes |  |
| `plugin` | `str` | Yes |  |
| `plugin_config` | `Dict` | Yes |  |

**Returns:** `List`

---

### `validator_factory.create_mock_validator`



```python
validator_factory.create_mock_validator(mock_llm_response: Optional = None, mock_web_response: Optional = None)
```

**Parameters:**

| Parameter | Type | Required | Default |
|-----------|------|----------|---------|
| `mock_llm_response` | `Optional` | No | `None` |
| `mock_web_response` | `Optional` | No | `None` |

**Returns:** `Validator`

---

### `validator_factory.batch_create_mock_validators`



```python
validator_factory.batch_create_mock_validators(count: int, mock_llm_response: Optional = None, mock_web_response: Optional = None)
```

**Parameters:**

| Parameter | Type | Required | Default |
|-----------|------|----------|---------|
| `count` | `int` | Yes |  |
| `mock_llm_response` | `Optional` | No | `None` |
| `mock_web_response` | `Optional` | No | `None` |

**Returns:** `List`

---
## Validator

Validator(stake: int, provider: str, model: str, config: Dict[str, Any], plugin: str, plugin_config: Dict[str, Any], mock_enabled: bool, mock_llm_response: Optional[gltest.types.MockedLLMResponse], mock_web_response: Optional[gltest.types.MockedWebResponse])

### `validator.to_dict`



**Returns:** `Dict`

---

### `validator.clone`



**Returns:** `Validator`

---

### `validator.batch_clone`



```python
validator.batch_clone(count: int)
```

**Parameters:**

| Parameter | Type | Required | Default |
|-----------|------|----------|---------|
| `count` | `int` | Yes |  |

**Returns:** `List`

---
