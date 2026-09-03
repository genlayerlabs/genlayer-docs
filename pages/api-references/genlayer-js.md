---
description: "Create GenLayer JavaScript clients, estimate and submit fee-funded transactions, wait for outcomes, and appeal decisions."
---

# GenLayerJS

`genlayer-js` is the TypeScript client for GenLayer RPC, Intelligent Contracts, transaction lifecycle, fees, appeals, wallets, staking, and developer rewards. It builds on Viem-compatible accounts and EIP-1193 browser providers.

## Install

```bash
npm install genlayer-js
```

For the Consensus v0.6 preview, install the explicit v2.0 release candidate published in the release notes. Do not rely on the default npm tag to select a prerelease.

## Create a client

```typescript
import { createAccount, createClient } from 'genlayer-js';
import { localnet } from 'genlayer-js/chains';
import { TransactionHashVariant } from 'genlayer-js/types';

const account = createAccount();
const client = createClient({
  chain: localnet,
  account,
});
```

Use `testnetBradbury`, `testnetAsimov`, or `studionet` for the corresponding hosted network. The v0.123 preview uses the matching RC's `studioDevnet` definition, which binds chain ID 61997, its RPC, and its consensus deployment together.

## Read a contract

```typescript
const value = await client.readContract({
  address: contractAddress,
  functionName: 'get_storage',
  args: [],
  transactionHashVariant: TransactionHashVariant.LATEST_FINAL,
});
```

## Estimate and submit a write

Build the allocation from a measured contract profile, then let the SDK apply current network prices and caps:

```typescript
const estimate = await client.estimateTransactionFees({
  leaderTimeunitsAllocation: 125n,
  validatorTimeunitsAllocation: 250n,
  executionBudgetPerRound: 786_500n,
  totalMessageFees: 0n,
  appealRounds: 1n,
  rotations: [1n, 1n],
});

const txId = await client.writeContract({
  address: contractAddress,
  functionName: 'update_storage',
  args: ['new value'],
  fees: {
    distribution: estimate.distribution,
    feeValue: estimate.feeValue,
  },
});
```

When `rotations` is omitted, the estimator funds the chain's configured maximum for every leader round. Pass an explicit array, including `[0n]`, when the transaction should use a smaller posture.

For applications, prefer a checked-in [`fee-profile.json`](/developers/decentralized-applications/fee-profiling-and-estimation) or [Transaction Kit](/developers/decentralized-applications/transaction-kit-integration) over hand-maintained allocation constants.

## Simulate and derive a preset

Studio can return fee accounting with a write simulation. The one-step helper turns the observed execution and message use into a transaction estimate:

```typescript
const recommended = await client.estimateTransactionFeesForWrite({
  address: contractAddress,
  functionName: 'update_storage',
  args: ['new value'],
});
```

Use this during profiling and development, not as a slow simulation before every production click.

## Wait for the right outcome

```typescript
import { isSuccessful } from 'genlayer-js';

const receipt = await client.waitForFinalization({ hash: txId });
if (!isSuccessful(receipt)) {
  throw new Error(
    `Transaction did not succeed: ${receipt.statusName} / ${receipt.txExecutionResultName}`,
  );
}
```

`waitForDecision` waits for a materialized decision; `waitForFinalization` also waits for final fee settlement and refunds. Advanced protocol consumers can call `client.advanced.getTransactionLifecycle({ hash })` to read the stored and projected status, resolution action, and active decision identity.

## Appeal a decision

```typescript
const charge = await client.getAppealCharge({ txId });
await client.appealTransaction({ txId, value: charge });
```

`getAppealCharge` returns the bond plus induced-work funding. `appealTransaction` binds the current decision and uses `topUpAndSubmitAppeal`, which is safe whether or not the next round was pre-funded. The old `getMinAppealBond` name remains as a deprecated compatibility alias and also returns the complete charge.

## Browser wallets

```typescript
const walletClient = createClient({
  chain: testnetBradbury,
  account: walletAddress,
  provider: window.ethereum,
});

await walletClient.connect('testnetBradbury');
```

Create an account-free client for reads and a provider-backed client for writes. Before signing, connect the wallet to the exact chain object used by the write client.

## API reference

- [Contract, fee, appeal, and developer-reward methods](./genlayer-js/contracts)
- [Transaction and lifecycle methods](./genlayer-js/transactions)
- [Staking methods](./genlayer-js/staking)
- [Consensus v0.6 migration guide](/developers/consensus-v06-migration)
