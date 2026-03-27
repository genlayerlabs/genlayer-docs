# GenLayerPY



## About

GenLayerPY SDK is a python library designed for developers building decentralized applications (Dapps) on the GenLayer protocol. This SDK provides a comprehensive set of tools to interact with the GenLayer network, including client creation, transaction handling, event subscriptions, and more, all while leveraging the power of web3.py as the underlying blockchain client.

## Prerequisites

Before installing GenLayerPY SDK, ensure you have the following prerequisites installed:

- Python (>=3.12)


## ️ Installation and Usage

To install the GenLayerPY SDK, use the following command:
```bash
$ pip install genlayer-py
```

Here’s how to initialize the client and connect to the GenLayer Simulator:

### Reading a Transaction
```python
from genlayer_py import create_client
from genlayer_py.chains import localnet

client = create_client(
    chain=localnet,
)

transaction_hash = "0x..."

transaction = client.get_transaction(hash=transaction_hash)

```

### Waiting for Transaction Receipt
```python
from genlayer_py import create_client
from genlayer_py.chains import localnet
from genlayer_py.types import TransactionStatus

client = create_client(chain=localnet)

# Get simplified receipt (default - removes binary data, keeps execution results)
receipt = client.wait_for_transaction_receipt(
    transaction_hash="0x...",
    status=TransactionStatus.FINALIZED,
    full_transaction=False  # Default - simplified for readability
)

# Get complete receipt with all fields
full_receipt = client.wait_for_transaction_receipt(
    transaction_hash="0x...",
    status=TransactionStatus.FINALIZED,
    full_transaction=True  # Complete receipt with all internal data
)
```

### Reading a contract
```python
from genlayer_py import create_client
from genlayer_py.chains import localnet

client = create_client(
    chain=localnet,
)

result = client.read_contract(
    address=contract_address,
    function_name='get_complete_storage',
    args=[],
    state_status='accepted'
)
```

### Writing a transaction
```python
from genlayer_py.chains import localnet
from genlayer_py import create_client, create_account

client = create_client(
    chain=localnet,
)

account = create_account()

transaction_hash = client.write_contract(
    account=account,
    transaction=transaction,
    address=contract_address,
    function_name='account',
    args=['new_storage'],
    value=0, // value is optional, if you want to send some native token to the contract
)
receipt = client.wait_for_transaction_receipt(
    hash=transaction_hash,
    status=TransactionStatus.FINALIZED, // or ACCEPTED
    full_transaction=False  // False by default - returns simplified receipt for better readability
)
```

### Checking execution results

A transaction can be finalized by consensus but still have a failed execution. Always check `tx_execution_result` before reading contract state:

```python
from genlayer_py import create_client, create_account
from genlayer_py.chains import testnet_bradbury
from genlayer_py.types import TransactionStatus, ExecutionResult

client = create_client(chain=testnet_bradbury, account=create_account())

receipt = client.wait_for_transaction_receipt(
    transaction_hash=tx_hash,
    status=TransactionStatus.FINALIZED,
)

if receipt.get("tx_execution_result_name") == ExecutionResult.FINISHED_WITH_RETURN.value:
    # Execution succeeded — safe to read state
    result = client.read_contract(
        address=contract_address,
        function_name="get_storage",
        args=[],
    )
elif receipt.get("tx_execution_result_name") == ExecutionResult.FINISHED_WITH_ERROR.value:
    # Execution failed — contract state was not modified
    raise RuntimeError("Contract execution failed")
else:
    # NOT_VOTED — execution hasn't completed
    print("Execution result not yet available")
```

### Fetching emitted messages and triggered transactions

Transactions can emit messages to other contracts. These messages create new child transactions when processed:

```python
tx = client.get_transaction(transaction_hash=tx_hash)

# Messages emitted by the contract during execution
print(tx["messages"])
# [{"messageType": 1, "recipient": "0x...", "value": 0, "data": "0x...", "onAcceptance": True, "saltNonce": 0}, ...]

# Child transaction IDs created from those messages (separate call)
child_tx_ids = client.get_triggered_transaction_ids(transaction_hash=tx_hash)
print(child_tx_ids)
# ["0xabc...", "0xdef..."]
```

### Debugging transaction execution

Use `debug_trace_transaction` to inspect the full execution trace of a transaction, including return data, errors, and GenVM logs:

```python
trace = client.debug_trace_transaction(
    transaction_hash=tx_hash,
    round=0,  # optional, defaults to 0
)

print(trace["result_code"])   # 0=success, 1=user error, 2=VM error
print(trace["return_data"])   # hex-encoded contract return data
print(trace["stderr"])        # standard error output
print(trace["genvm_log"])     # detailed GenVM execution logs
```

## Key Features

* **Client Creation**: Easily create and configure a client to connect to GenLayer’s network.
* **Transaction Handling**: Send and manage transactions on the GenLayer network.
* **Gas Estimation**: Estimate gas fees for executing transactions on GenLayer.

_* under development_


## Documentation

For detailed information on how to use GenLayerPY SDK, please refer to our [documentation](https://docs.genlayer.com/api-references/genlayer-py).


## Contributing

We welcome contributions to GenLayerPY SDK! Whether it's new features, improved infrastructure, or better documentation, your input is valuable. Please read our [CONTRIBUTING](https://github.com/genlayerlabs/genlayer-py/blob/main/CONTRIBUTING.md) guide for guidelines on how to submit your contributions.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
