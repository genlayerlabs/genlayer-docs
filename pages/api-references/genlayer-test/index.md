# GenLayer Testing Suite

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/license/mit/)
[![Discord](https://dcbadge.vercel.app/api/server/8Jm4v89VAu?compact=true&style=flat)](https://discord.gg/qjCU4AWnKE)
[![Twitter](https://img.shields.io/twitter/url/https/twitter.com/genlayerlabs.svg?style=social&label=Follow%20%40GenLayer)](https://x.com/GenLayer)
[![PyPI version](https://badge.fury.io/py/genlayer-test.svg)](https://badge.fury.io/py/genlayer-test)
[![Documentation](https://img.shields.io/badge/docs-genlayer-blue)](https://docs.genlayer.com/api-references/genlayer-test)
[![Code style: black](https://img.shields.io/badge/code%20style-black-000000.svg)](https://github.com/psf/black)

A pytest-based testing framework for [GenLayer](https://docs.genlayer.com/) intelligent contracts. Built on top of [genlayer-py](https://docs.genlayer.com/api-references/genlayer-py).

```bash
pip install genlayer-test
```

## Two Ways to Test

The testing suite provides two execution modes. Pick the one that fits your workflow:

| | Direct Mode | Studio Mode |
|---|---|---|
| **How it works** | Runs contract Python code directly in-memory | Deploys to GenLayer Studio, interacts via RPC |
| **Speed** | ~milliseconds per test | ~minutes per test |
| **Prerequisites** | Python >= 3.12 | Python >= 3.12 + GenLayer Studio (Docker) |
| **Best for** | Unit tests, rapid development, CI/CD | Integration tests, consensus validation, testnet |
| **Mocking** | Foundry-style cheatcodes (`mock_web`, `mock_llm`) | Mock validators with transaction context |

**Start with Direct Mode.** It's faster, simpler, and doesn't require Docker. Use Studio Mode when you need full network behavior, multi-validator consensus, or testnet deployment.

---

## Direct Mode

Run contracts directly in Python — no simulator, no Docker, no network. Tests execute in milliseconds.

### Quick Start

```python
def test_storage(direct_vm, direct_deploy):
    # Deploy contract in-memory
    storage = direct_deploy("contracts/Storage.py", "initial")

    # Read state directly
    assert storage.get_storage() == "initial"

    # Write state directly
    storage.update_storage("updated")
    assert storage.get_storage() == "updated"
```

Run with pytest:

```bash
pytest tests/ -v
```

### Fixtures

| Fixture | Description |
|---------|-------------|
| `direct_vm` | VM context with cheatcodes |
| `direct_deploy` | Deploy contracts directly |
| `direct_alice`, `direct_bob`, `direct_charlie` | Test addresses |
| `direct_owner` | Default sender address |
| `direct_accounts` | List of 10 test addresses |

### Cheatcodes

```python
# Change sender
direct_vm.sender = alice

# Prank (temporary sender change)
with direct_vm.prank(bob):
    contract.method()  # Called as bob

# Snapshots (captures full state: storage, mocks, sender, validators)
snap_id = direct_vm.snapshot()
contract.modify_state()
direct_vm.revert(snap_id)  # Full state restored

# Expect revert
with direct_vm.expect_revert("Insufficient balance"):
    contract.transfer(bob, 1000000)

# Mock web/LLM (regex pattern matching)
direct_vm.mock_web(r"api\.example\.com", {"status": 200, "body": "{}"})
direct_vm.mock_llm(r"analyze.*", "positive sentiment")

# Test validator consensus logic
contract.update_price()          # Runs leader_fn, captures validator
direct_vm.clear_mocks()          # Swap mocks for validator
direct_vm.mock_llm(r".*", "different result")
assert direct_vm.run_validator() is False  # Validator disagrees

# Strict mocks (detect unused mocks)
direct_vm.strict_mocks = True

# Pickling validation (catch production serialization issues)
direct_vm.check_pickling = True
```

**[Full Direct Mode Documentation](docs/direct-runner.md)** — fixtures, cheatcodes, validator testing, limitations, and complete examples.

---

## Studio Mode

Deploy contracts to a running GenLayer Studio instance and interact via RPC. This gives you full network behavior including multi-validator consensus.

### Prerequisites

- Python >= 3.12
- GenLayer Studio running (Docker)

### Quick Start

```python
from gltest import get_contract_factory, get_default_account
from gltest.assertions import tx_execution_succeeded

factory = get_contract_factory("MyContract")
contract = factory.deploy()

# Read method — returns value directly
result = contract.get_value().call()

# Write method — returns transaction receipt
tx_receipt = contract.set_value(args=["new_value"]).transact()
assert tx_execution_succeeded(tx_receipt)
```

Run with the `gltest` CLI:

```bash
gltest                              # Run all tests
gltest tests/test_mycontract.py     # Specific file
gltest --network studionet          # Specific network
gltest --leader-only                # Skip consensus (faster)
gltest -v                           # Verbose output
```

### Configuration

Create a `gltest.config.yaml` in your project root:

```yaml
networks:
  default: localnet

  localnet:
    url: "http://127.0.0.1:4000/api"
    leader_only: false

  studionet:
    # Pre-configured — accounts auto-generated

  testnet_asimov:
    accounts:
      - "${ACCOUNT_PRIVATE_KEY_1}"
      - "${ACCOUNT_PRIVATE_KEY_2}"
    from: "${ACCOUNT_PRIVATE_KEY_1}"

paths:
  contracts: "contracts"
  artifacts: "artifacts"

environment: .env
```

Key options:
- **Networks**: `localnet` and `studionet` work out of the box. `testnet_asimov` requires account keys.
- **Paths**: Where your contracts and artifacts live.
- **Environment**: `.env` file for private keys.

Override via CLI:

```bash
gltest --network testnet_asimov
gltest --contracts-dir custom/contracts/path
gltest --rpc-url http://custom:4000/api
gltest --chain-type localnet
```

### Contract Deployment

```python
from gltest import get_contract_factory, get_default_account
from gltest.assertions import tx_execution_succeeded

factory = get_contract_factory("Storage")

# deploy() returns the contract instance (recommended)
contract = factory.deploy(
    args=["initial_value"],
    account=get_default_account(),
    consensus_max_rotations=3,
)

# deploy_contract_tx() returns only the receipt
receipt = factory.deploy_contract_tx(args=["initial_value"])
assert tx_execution_succeeded(receipt)
```

### Read and Write Methods

```python
# Read — call() returns the value
result = contract.get_storage().call()

# Write — transact() returns a receipt
tx_receipt = contract.update_storage(args=["new_value"]).transact(
    value=0,
    consensus_max_rotations=3,
    wait_interval=1000,
    wait_retries=10,
)
assert tx_execution_succeeded(tx_receipt)
```

### Assertions

```python
from gltest.assertions import tx_execution_succeeded, tx_execution_failed

assert tx_execution_succeeded(tx_receipt)
assert tx_execution_failed(tx_receipt)

# Regex matching on stdout/stderr (localnet/studionet only)
assert tx_execution_succeeded(tx_receipt, match_std_out=r".*code \d+")
assert tx_execution_failed(tx_receipt, match_std_err=r"Method.*failed")
```

### Fixtures

| Fixture | Scope | Description |
|---------|-------|-------------|
| `gl_client` | session | GenLayer client for network operations |
| `default_account` | session | Default account for transactions |
| `accounts` | session | List of test accounts |

```python
def test_workflow(gl_client, default_account, accounts):
    factory = get_contract_factory("MyContract")
    contract = factory.deploy(account=default_account)

    tx_receipt = contract.some_method(args=["value"], account=accounts[1])
    assert tx_execution_succeeded(tx_receipt)
```

### Mock LLM Responses

Simulate LLM responses for deterministic tests:

```python
from gltest import get_contract_factory, get_validator_factory
from gltest.types import MockedLLMResponse

mock_response: MockedLLMResponse = {
    "nondet_exec_prompt": {
        "analyze this": "positive sentiment"
    },
    "eq_principle_prompt_comparative": {
        "values match": True
    }
}

validator_factory = get_validator_factory()
validators = validator_factory.batch_create_mock_validators(
    count=5,
    mock_llm_response=mock_response
)

transaction_context = {
    "validators": [v.to_dict() for v in validators],
    "genvm_datetime": "2024-01-01T00:00:00Z"
}

factory = get_contract_factory("LLMContract")
contract = factory.deploy(transaction_context=transaction_context)
result = contract.analyze_text(args=["analyze this"]).transact(
    transaction_context=transaction_context
)
```

Mock keys map to GenLayer methods:

| Mock Key | GenLayer Method |
|----------|----------------|
| `"nondet_exec_prompt"` | `gl.nondet.exec_prompt` |
| `"eq_principle_prompt_comparative"` | `gl.eq_principle.prompt_comparative` |
| `"eq_principle_prompt_non_comparative"` | `gl.eq_principle.prompt_non_comparative` |

The system performs **substring matching** on the internal user message — your mock key must appear within the message.

### Mock Web Responses

Simulate HTTP responses for contracts that call `gl.nondet.web.get()`, etc.:

```python
from gltest.types import MockedWebResponse
import json

mock_web_response: MockedWebResponse = {
    "nondet_web_request": {
        "https://api.example.com/price": {
            "method": "GET",
            "status": 200,
            "body": json.dumps({"price": 100.50})
        }
    }
}

validators = validator_factory.batch_create_mock_validators(
    count=5,
    mock_web_response=mock_web_response
)
```

You can combine both `mock_llm_response` and `mock_web_response` in a single `batch_create_mock_validators` call. URL matching is exact (including query parameters).

### Custom Validators

```python
from gltest import get_validator_factory

factory = get_validator_factory()

# Real validators with specific LLM providers
validators = factory.batch_create_validators(
    count=5,
    stake=10,
    provider="openai",
    model="gpt-4o",
    config={"temperature": 0.7},
    plugin="openai-compatible",
    plugin_config={"api_key_env_var": "OPENAI_API_KEY"}
)

# Use in transaction context
transaction_context = {
    "validators": [v.to_dict() for v in validators],
    "genvm_datetime": "2024-03-15T14:30:00Z"
}
```

### Statistical Analysis

For LLM-based contracts, `.analyze()` runs multiple simulations to measure consistency:

```python
analysis = contract.process_with_llm(args=["input"]).analyze(
    provider="openai",
    model="gpt-4o",
    runs=100,
)

print(f"Success rate: {analysis.success_rate:.2f}%")
print(f"Reliability: {analysis.reliability_score:.2f}%")
print(f"Unique states: {analysis.unique_states}")
```

**[Full Studio Mode Documentation](docs/studio-runner.md)** — configuration reference, all CLI flags, mock LLM/web details, custom validators, statistical analysis, and complete examples.

---

## Example Contract

```python
from genlayer import *

class Storage(gl.Contract):
    storage: str

    def __init__(self, initial_storage: str):
        self.storage = initial_storage

    @gl.public.view
    def get_storage(self) -> str:
        return self.storage

    @gl.public.write
    def update_storage(self, new_storage: str) -> None:
        self.storage = new_storage
```

### Project Structure

```
my-project/
├── contracts/
│   └── Storage.py
├── tests/
│   ├── test_direct.py      # Direct mode tests (fast)
│   └── test_integration.py  # Studio mode tests
└── gltest.config.yaml       # Studio mode config
```

For more examples, see the [contracts directory](tests/examples/contracts).

## Troubleshooting

**Contract not found**: Ensure contracts are in `contracts/` or specify `--contracts-dir`. Contracts must inherit from `gl.Contract`.

**Transaction timeouts** (Studio mode): Increase `wait_interval` and `wait_retries` in `.transact()`.

**Consensus failures** (Studio mode): Increase `consensus_max_rotations` or use `--leader-only` for faster iteration.

**Environment issues**: Verify Python >= 3.12. For Studio mode, check Docker is running (`docker ps`).

## Contributing

See our [Contributing Guide](CONTRIBUTING.md).

## License

MIT — see [LICENSE](LICENSE).

## Support

- [Documentation](https://docs.genlayer.com/api-references/genlayer-test)
- [Discord](https://discord.gg/qjCU4AWnKE)
- [GitHub Issues](https://github.com/genlayerlabs/genlayer-testing-suite/issues)
- [Twitter](https://x.com/GenLayer)
