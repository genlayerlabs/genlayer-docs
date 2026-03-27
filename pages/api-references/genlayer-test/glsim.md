# glsim — Local GenLayer Network

A lightweight single-process GenLayer network that runs contracts via direct mode. Supports real LLM and web calls without Docker or WASM.

## Installation

```bash
pip install genlayer-test[sim]
```

## Usage

```bash
# Start with defaults (port 4000, 5 validators)
glsim

# Custom configuration
glsim --port 8000 --validators 3 --llm-provider openai:gpt-4o

# Deterministic mode (reproducible addresses)
glsim --seed my-test-seed
```

## CLI Options

| Option | Default | Description |
|---|---|---|
| `--port` | 4000 | RPC server port |
| `--host` | 127.0.0.1 | Bind address |
| `--validators` | 5 | Number of validators |
| `--max-rotations` | 3 | Max leader rotations |
| `--chain-id` | 61127 | Network chain ID |
| `--llm-provider` | None | LLM provider:model (e.g., `openai:gpt-4o`) |
| `--no-browser` | false | Use httpx instead of Playwright for web |
| `--seed` | None | Deterministic seed for addresses |
| `-v, --verbose` | false | Verbose logging |

## JSON-RPC Methods

glsim exposes a JSON-RPC 2.0 endpoint at `POST /api` compatible with both GenLayer Studio and standard Ethereum methods:

### GenLayer Methods
- `gen_call` — Call a contract method
- `gen_get_contract_schema` — Get contract schema
- `gen_get_contract_schema_for_code` — Get schema from code
- `gen_get_transaction_status` — Get transaction status

### Simulator Methods
- `sim_deploy` — Deploy a contract
- `sim_call` — Call a contract method
- `sim_read` — Read contract state
- `sim_fund_account` — Fund an account
- `sim_get_balance` — Get account balance
- `sim_create_snapshot` — Create state snapshot
- `sim_restore_snapshot` — Restore snapshot
- `sim_install_mocks` — Install web/LLM mocks
- `sim_get_mocks` — Get current mocks
- `sim_increase_time` — Advance time (Anvil-style)
- `sim_set_time` — Set time to specific datetime

### Ethereum Compatible
- `eth_chainId`, `eth_blockNumber`, `eth_getBalance`
- `eth_getTransactionReceipt`, `eth_getTransactionByHash`
- `eth_estimateGas`, `eth_gasPrice`, `eth_sendRawTransaction`
