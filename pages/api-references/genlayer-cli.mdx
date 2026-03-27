# GenLayer CLI

## Description

The GenLayer CLI is designed to streamline the setup and local execution of the GenLayer simulator. This tool automates the process of downloading and launching the GenLayer simulator, making it easy to start simulating and testing locally with minimal setup.

## Installation

Before installing the GenLayer CLI, ensure you have Node.js installed on your system. You can then install the CLI globally using npm:

```bash
npm install -g genlayer
```

### Linux Dependencies

On some Linux distributions with minimal setups (like Debian netinst or Docker images), you may need to manually install libsecret:

```bash
# Ubuntu/Debian
sudo apt-get install libsecret-1-0

# CentOS/RHEL/Fedora
sudo yum install libsecret
# or for newer versions
sudo dnf install libsecret

# Arch Linux
sudo pacman -S libsecret
```

The GenLayer CLI uses the `keytar` library for secure key storage, which relies on `libsecret` on Linux systems.

## Usage

Each command includes syntax, usage information, and examples to help you effectively use the CLI for interacting with the GenLayer environment.

### Command line syntax

General syntax for using the GenLayer CLI:

```bash
genlayer command [command options] [arguments...]
```

### Commands and usage

#### Initialize

Prepares and verifies your environment to run the GenLayer Studio.

```bash
USAGE:
   genlayer init [options]

OPTIONS:
   --numValidators <numValidators>       Number of validators (default: "5")
   --headless                            Headless mode (default: false)
   --reset-db                            Reset Database (default: false)
   --localnet-version <localnetVersion>  Select a specific localnet version
   --ollama                              Enable Ollama container (default: false)

EXAMPLES:
   genlayer init
   genlayer init --numValidators 10 --headless --reset-db --localnet-version v0.10.2
   genlayer init --ollama
```

##### Version Compatibility

The GenLayer CLI always uses the latest compatible version of the environment, ensuring that you benefit from the most recent features, bug fixes, and optimizations without requiring manual updates. If a specific version is needed, you can specify it using the --localnet-version option when initializing the environment.

```bash
genlayer init --localnet-version v0.10.2
```

#### Start GenLayer environment

Launches the GenLayer environment and the Studio, initializing a fresh set of database and accounts.

```bash
USAGE:
   genlayer up [options]

OPTIONS:
   --reset-validators               Remove all current validators and create new random ones (default: false)
   --numValidators <numValidators>  Number of validators (default: "5")
   --headless                       Headless mode (default: false)
   --reset-db                       Reset Database (default: false)
   --ollama                         Enable Ollama container (default: false)

EXAMPLES:
   genlayer up
   genlayer up --reset-validators --numValidators 8 --headless --reset-db
   genlayer up --ollama
```

#### Stop GenLayer environment

Stops all running GenLayer Localnet services.

```bash
USAGE:
   genlayer stop
```

#### Create a New GenLayer Project

Initialize a new GenLayer project using a local template.

```bash
USAGE:
   genlayer new <projectName> [options]

OPTIONS:
   --path <directory>  Specify the directory for the new project (default: ".")
   --overwrite         Overwrite existing directory if it exists (default: false)

EXAMPLES:
   genlayer new myProject
   genlayer new myProject --path ./customDir
   genlayer new myProject --overwrite
```

#### Manage CLI Configuration

Configure the GenLayer CLI settings.

```bash
USAGE:
   genlayer config <command> [options]

COMMANDS:
   set <key=value>  Set a configuration value
   get [key]        Get the current configuration
   reset <key>      Reset a configuration value to its default

EXAMPLES:
   genlayer config get
   genlayer config get defaultOllamaModel
   genlayer config set defaultOllamaModel=deepseek-r1
   genlayer config reset keyPairPath
```

#### Network Management

Manage network configuration for contract operations.

```bash
USAGE:
   genlayer network set [network]    Set the network to use
   genlayer network info             Show current network configuration and contract addresses
   genlayer network list             List available networks

EXAMPLES:
   genlayer network set
   genlayer network set testnet
   genlayer network set mainnet
   genlayer network info
   genlayer network list
```

#### Deploy and Call Intelligent Contracts

Deploy and interact with intelligent contracts.

```bash
USAGE:
   genlayer deploy [options]
   genlayer call <contractAddress> <method> [options]
   genlayer write <contractAddress> <method> [options]
   genlayer schema <contractAddress> [options]

OPTIONS (deploy):
   --contract <contractPath>  (Optional) Path to the intelligent contract to deploy
   --rpc <rpcUrl>             RPC URL for the network
   --args <args...>           Contract arguments (see Argument Types below)

OPTIONS (call):
   --rpc <rpcUrl>             RPC URL for the network
   --args <args...>           Method arguments (see Argument Types below)

OPTIONS (write):
   --rpc <rpcUrl>             RPC URL for the network
   --args <args...>           Method arguments (see Argument Types below)

OPTIONS (schema):
   --rpc <rpcUrl>             RPC URL for the network

EXAMPLES:
   genlayer deploy
   genlayer deploy --contract ./my_contract.gpy
   genlayer deploy --contract ./my_contract.gpy --args "arg1" "arg2" 123
   genlayer call 0x123456789abcdef greet --args "Hello World!"
   genlayer write 0x123456789abcdef updateValue --args 42
   genlayer write 0x123456789abcdef sendReward --args 0x6857Ed54CbafaA74Fc0357145eC0ee1536ca45A0
   genlayer write 0x123456789abcdef setScores --args '[1, 2, 3]'
   genlayer write 0x123456789abcdef setConfig --args '{"timeout": 30, "retries": 5}'
   genlayer schema 0x123456789abcdef
```

##### Argument Types

The `--args` option automatically detects and converts values to the correct type:

| Type | Syntax | Example |
|------|--------|---------|
| Boolean | `true`, `false` | `--args true false` |
| Null | `null` | `--args null` |
| Integer | numeric value | `--args 42 -1` |
| Hex integer | `0x` prefix | `--args 0x1a` |
| String | any other value | `--args hello "multi word"` |
| Address | 40 hex chars with `0x` or `addr#` prefix | `--args 0x6857...a0` or `--args addr#6857...a0` |
| Bytes | `b#` prefix + hex | `--args b#deadbeef` |
| Array | JSON array in quotes | `--args '[1, 2, "three"]'` |
| Dict | JSON object in quotes | `--args '{"key": "value"}'` |

Large numbers that exceed JavaScript's safe integer range are automatically handled as BigInt to preserve precision.

##### Deploy Behavior
- If `--contract` is specified, the command will **deploy the given contract**.
- If `--contract` is omitted, the CLI will **search for scripts inside the `deploy` folder**, sort them, and execute them sequentially.

##### Call vs Write
- `call` - Calls a contract method without sending a transaction or changing the state (read-only)
- `write` - Sends a transaction to a contract method that modifies the state

##### Schema
- `schema` - Retrieves the contract schema

#### Transaction Operations

```bash
USAGE:
   genlayer receipt <txId>                Get transaction receipt
   genlayer appeal <txId>                 Appeal a transaction
   genlayer appeal-bond <txId>            Show minimum appeal bond required

OPTIONS (receipt):
   --status <status>       Status to wait for (default: FINALIZED)
   --retries <retries>     Number of retries (default: 100)
   --interval <interval>   Interval between retries in ms (default: 5000)
   --stdout                Print only stdout from the receipt
   --stderr                Print only stderr from the receipt

OPTIONS (appeal):
   --bond <amount>         Appeal bond amount (e.g. 500gen, 0.5gen). Auto-calculated if omitted
   --rpc <rpcUrl>          RPC URL override

EXAMPLES:
   # Check the minimum bond required to appeal
   genlayer appeal-bond 0x1234...

   # Appeal with auto-calculated bond
   genlayer appeal 0x1234...

   # Appeal with explicit bond
   genlayer appeal 0x1234... --bond 500gen
```

#### Transaction Trace

Inspect execution traces for debugging:

```bash
genlayer transactions trace <txId> [--round N] [--rpc URL]
```

#### Account Management

View and manage your account.

```bash
USAGE:
   genlayer account                   Show account info (address, balance, network, status)
   genlayer account create [options]  Create a new account
   genlayer account send <to> <amount> Send GEN to an address
   genlayer account unlock            Unlock account (cache key in OS keychain)
   genlayer account lock              Lock account (remove key from OS keychain)

OPTIONS (create):
   --output <path>    Path to save the keystore (default: "./keypair.json")
   --overwrite        Overwrite existing file (default: false)

EXAMPLES:
   genlayer account
   genlayer account create
   genlayer account create --output ./my_key.json --overwrite
   genlayer account send 0x123...abc 10gen
   genlayer account send 0x123...abc 0.5gen
   genlayer account unlock
   genlayer account lock
```

#### Update Resources

Manage and update models or configurations.

```bash
USAGE:
   genlayer update ollama [options]

OPTIONS:
   --model [model-name]  Specify the model to update or pull
   --remove              Remove the specified model instead of updating

EXAMPLES:
   genlayer update ollama
   genlayer update ollama --model deepseek-r1
   genlayer update ollama --model deepseek-r1 --remove
```

#### Localnet Validator Management

Manage localnet validator operations.

```bash
USAGE:
   genlayer localnet validators <command> [options]

COMMANDS:
   get [--address <validatorAddress>]     Retrieve details of a specific validator or all validators
   delete [--address <validatorAddress>]  Delete a specific validator or all validators
   count                                  Count all validators
   update <validatorAddress> [options]    Update a validator details
   create-random [options]                Create random validators
   create [options]                       Create a new validator

OPTIONS (update):
   --stake <stake>                        New stake for the validator
   --provider <provider>                  New provider for the validator
   --model <model>                        New model for the validator
   --config <config>                      New JSON config for the validator

OPTIONS (create-random):
   --count <count>                        Number of validators to create (default: "1")
   --providers <providers...>             Space-separated list of provider names (e.g., openai ollama)
   --models <models...>                   Space-separated list of model names (e.g., gpt-4 gpt-4o)

OPTIONS (create):
   --stake <stake>                        Stake amount for the validator (default: "1")
   --config <config>                      Optional JSON configuration for the validator
   --provider <provider>                  Specify the provider for the validator
   --model <model>                        Specify the model for the validator

EXAMPLES:
   genlayer localnet validators get
   genlayer localnet validators get --address 0x123456789abcdef

   genlayer localnet validators count
   genlayer localnet validators delete --address 0x123456789abcdef
   genlayer localnet validators update 0x123456789abcdef --stake 100 --provider openai --model gpt-4

   genlayer localnet validators create
   genlayer localnet validators create --stake 50 --provider openai --model gpt-4
   genlayer localnet validators create-random --count 3 --providers openai --models gpt-4 gpt-4o
```

#### Staking Operations

Manage staking for validators and delegators on testnet-bradbury (or testnet-asimov). Staking is not available on localnet/studio.

```bash
USAGE:
   genlayer staking <command> [options]

COMMANDS:
   validator-join [options]      Join as a validator by staking tokens
   validator-deposit [options]   Make an additional deposit as a validator
   validator-exit [options]      Exit as a validator by withdrawing shares
   validator-claim [options]     Claim validator withdrawals after unbonding period
   validator-prime [validator]   Prime a validator for the next epoch
   prime-all [options]           Prime all validators that need priming
   delegator-join [options]      Join as a delegator by staking with a validator
   delegator-exit [options]      Exit as a delegator by withdrawing shares
   delegator-claim [options]     Claim delegator withdrawals after unbonding period
   validator-info [validator]    Get information about a validator (--debug for raw data)
   validator-history [validator] Show slash and reward history for a validator
   delegation-info [validator]   Get delegation info for a delegator with a validator
   epoch-info [options]          Get current/previous epoch info (--epoch <n> for specific)
   validators [options]          Show validator set with stake, primed status, and weight
   active-validators [options]   List all active validators
   quarantined-validators        List all quarantined validators
   banned-validators             List all banned validators

COMMON OPTIONS (all commands):
   --network <network>           Network to use (localnet, testnet-bradbury, testnet-asimov)
   --rpc <rpcUrl>                RPC URL override
   --staking-address <address>   Staking contract address override

OPTIONS (validator-join):
   --amount <amount>             Amount to stake (in wei or with 'gen' suffix)
   --operator <address>          Operator address (defaults to signer)

OPTIONS (delegator-join):
   --validator <address>         Validator address to delegate to
   --amount <amount>             Amount to stake (in wei or with 'gen' suffix)

OPTIONS (exit commands):
   --shares <shares>             Number of shares to withdraw
   --validator <address>         Validator address (for delegator commands)

EXAMPLES:
   # Get epoch info (uses --network to specify testnet-bradbury)
   genlayer staking epoch-info --network testnet-bradbury

   # Or set network globally first
   genlayer network set testnet-bradbury

   # Join as validator with 42000 GEN
   genlayer staking validator-join --amount 42000gen

   # Join as delegator with 42 GEN
   genlayer staking delegator-join --validator 0x... --amount 42gen

   # Check validator info
   genlayer staking validator-info --validator 0x...
   # Output:
   # {
   #   validator: '0xa8f1BF1e5e709593b4468d7ac5DC315Ea3CAe130',
   #   vStake: '0.01 GEN',
   #   vShares: '10000000000000000',
   #   dStake: '0 GEN',
   #   dShares: '0',
   #   vDeposit: '0 GEN',
   #   vWithdrawal: '0 GEN',
   #   epoch: '0',
   #   live: true,
   #   banned: 'Not banned'
   # }

   # Get current epoch info (shows current + previous epoch)
   genlayer staking epoch-info
   # Output:
   # ✔ Epoch info
   #
   #   Current Epoch: 5 (started 9h 30m ago)
   #   Next Epoch:    in 14h 30m
   #   Validators:    33
   #   ...
   #
   #   Previous Epoch: 4 (finalized)
   #   Inflation:      1732904.66 GEN
   #   Claimed:        0 GEN
   #   Unclaimed:      1732904.66 GEN
   #   ...

   # Query specific epoch data
   genlayer staking epoch-info --epoch 4

   # List active validators
   genlayer staking active-validators
   # Output:
   # {
   #   count: 6,
   #   validators: [
   #     '0xa8f1BF1e5e709593b4468d7ac5DC315Ea3CAe130',
   #     '0xe9246A020cbb4fC6C46e60677981879c9219e8B9',
   #     ...
   #   ]
   # }

   # Show validator set table with stake, status, weight
   genlayer staking validators
   genlayer staking validators --all  # Include banned validators

   # Show validator slash/reward history (testnet only, default: last 10 epochs)
   genlayer staking validator-history 0x...
   genlayer staking validator-history 0x... --epochs 5   # Last 5 epochs
   genlayer staking validator-history 0x... --from-epoch 3  # From epoch 3
   genlayer staking validator-history 0x... --all  # Complete history (slow)
   genlayer staking validator-history 0x... --limit 20
   # Output:
   # ┌─────────────┬───────┬────────┬────────┬────────────────────────────────────┐
   # │ Time        │ Epoch │ Type   │ Details│ GL TxId / Block                    │
   # ├─────────────┼───────┼────────┼────────┼────────────────────────────────────┤
   # │ 12-11 14:20 │ 5     │ REWARD │ Val: …│ block 4725136                      │
   # │ 12-10 18:39 │ 4     │ SLASH  │ 1.00% │ 0x52db90a9...                       │
   # └─────────────┴───────┴────────┴────────┴────────────────────────────────────┘

   # Exit and claim (requires validator wallet address)
   genlayer staking validator-exit --validator 0x... --shares 100
   genlayer staking validator-claim --validator 0x...

   # Prime a validator for next epoch
   genlayer staking validator-prime 0x...

   # Prime all validators that need priming (anyone can call)
   genlayer staking prime-all
```

### Running the CLI from the repository

First, install the dependencies and start the build process

```bash
npm install
npm run dev
```

This will continuously rebuild the CLI from the source

Then in another window execute the CLI commands like so:

```bash
node dist/index.js init
```

## Guides

- [Validator Guide](docs/validator-guide.md) - How to become a validator on GenLayer testnet
- [Delegator Guide](docs/delegator-guide.md) - How to delegate GEN to a validator

## Documentation

For detailed information on how to use GenLayer CLI, please refer to our [documentation](https://docs.genlayer.com/).

## Contributing

We welcome contributions to GenLayerJS SDK! Whether it's new features, improved infrastructure, or better documentation, your input is valuable. Please read our [CONTRIBUTING](https://github.com/yeagerai/genlayer-js/blob/main/CONTRIBUTING.md) guide for guidelines on how to submit your contributions.

## License

This project is licensed under the ... License - see the [LICENSE](LICENSE) file for details.

