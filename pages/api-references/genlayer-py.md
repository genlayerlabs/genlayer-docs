---
description: "Use the GenLayer Python SDK for fee-funded transactions, lifecycle reads, appeals, and contract interaction."
---

# GenLayerPY

`genlayer-py` is the Python client for GenLayer RPC, Intelligent Contracts, fee estimation, appeals, and transaction lifecycle.

## Install

```bash
pip install genlayer-py
```

For the Consensus v0.6 preview, install the explicit v0.19 release candidate published in the release notes. PyPI prerelease versions are not selected by every unconstrained installer, so pin the RC directly.

## Create a client

```python
from genlayer_py import create_account, create_client
from genlayer_py.chains import localnet

account = create_account()
client = create_client(chain=localnet, account=account)
```

Use the matching v0.19 RC's Studio-dev chain definition for the v0.123 preview. Do not substitute stable Studionet: Studio-dev is chain ID 61997 and has its own consensus deployment.

## Read a contract

```python
value = client.read_contract(
    address=contract_address,
    function_name="get_storage",
    args=[],
)
```

## Estimate and submit a write

```python
estimate = client.estimate_transaction_fees(
    {
        "leaderTimeunitsAllocation": 125,
        "validatorTimeunitsAllocation": 250,
        "executionBudgetPerRound": 786_500,
        "totalMessageFees": 0,
        "appealRounds": 1,
        "rotations": [1, 1],
    }
)

tx_id = client.write_contract(
    address=contract_address,
    function_name="update_storage",
    args=["new value"],
    fees={
        "distribution": estimate["distribution"],
        "feeValue": estimate["feeValue"],
    },
)
```

For applications, generate those allocation inputs from a checked-in [`fee-profile.json`](/developers/decentralized-applications/fee-profiling-and-estimation). The SDK still reads live prices and caps when it produces the final estimate.

Studio can also simulate one concrete write and derive a recommended preset:

```python
recommended = client.estimate_transaction_fees_for_write(
    address=contract_address,
    function_name="update_storage",
    args=["new value"],
)
```

Use simulation during profiling and development rather than before every production user action.

## Wait for the right outcome

```python
from genlayer_py.transactions import is_successful

receipt = client.wait_for_finalization(tx_id)
if not is_successful(receipt):
    raise RuntimeError(
        f"Transaction did not succeed: "
        f"{receipt['status_name']} / {receipt['tx_execution_result_name']}"
    )
```

`wait_for_decision` waits for a stored decision. `wait_for_finalization` also waits for fee settlement and refunds. `get_transaction_lifecycle` exposes the stored/projected state and protocol resolution action when the backend supports the advanced lifecycle RPC.

## Appeal a decision

```python
charge = client.get_appeal_charge(tx_id)
client.appeal_transaction(tx_id, value=charge)
```

The charge includes the bond and induced-work funding. `appeal_transaction` resolves and binds the active decision and uses the safe `topUpAndSubmitAppeal` path. `get_min_appeal_bond` is a deprecated compatibility alias that also returns the complete charge.

## API reference

- [Client methods and enums](./genlayer-py/api)
- [Fee Profiling & Estimation](/developers/decentralized-applications/fee-profiling-and-estimation)
- [Consensus v0.6 migration guide](/developers/consensus-v06-migration)
