# GenLayer vs Solidity: Migration Guide

> A quick-reference for developers coming from Ethereum/Solidity. This page maps familiar Solidity concepts to their GenLayer equivalents and highlights the key mental model shifts.

---

## Concept mapping

| Concept | Solidity | GenLayer (Python) |
|---|---|---|
| Language | Solidity (`.sol`) | Python (`.py`) via GenVM |
| Contract declaration | `contract Foo { }` | `class Foo(gl.Contract): ...` |
| State variables | Top-level typed declarations | Class-level annotated attributes, e.g. `count: u256` |
| Constructor | `constructor(...)` | `def __init__(self, ...)` |
| View function | `view` modifier | `@gl.public.view` |
| Write function | (default, no modifier needed) | `@gl.public.write` |
| Mapping | `mapping(K => V)` | `TreeMap[K, V]` |
| Dynamic array | `T[]` | `DynArray[T]` |
| Caller address | `msg.sender` | `gl.message.sender` |
| Value sent | `msg.value` | `gl.message.value` |
| Revert / error | `revert(...)` / `require(...)` | `assert ...` / `raise Exception(...)` |
| Cross-contract call | `IFoo(addr).bar()` | `gl.contract_at(addr, Foo).bar()` |
| External data (oracle) | Chainlink / oracle services | `gl.get_webpage(url)` natively |
| AI / LLM | Not possible | `gl.exec_prompt(prompt)` natively |
| Consensus model | Deterministic EVM execution | Optimistic Democracy + equivalence principles |
| Transaction outcomes | Success or revert | Success, revert, or `UNDETERMINED` |

---

## Key mental model shifts

### 1. Determinism is opt-in for AI and web operations

In Solidity, every operation must be deterministic — the EVM enforces this at the protocol level. In GenLayer, deterministic and non-deterministic code coexist in the same contract, but they must be **explicitly separated** into non-deterministic blocks.

Business logic outside those blocks is still fully deterministic. Think of non-deterministic blocks as sandboxed AI calls whose result is then fed back into deterministic logic.

```python
@gl.public.write
def update_status(self, url: str) -> None:
    # This outer code is deterministic
    assert gl.message.sender == self.owner, "Not authorized"

    # Non-deterministic block — isolated AI/web logic
    def _check():
        page = gl.get_webpage(url, mode="text")
        return gl.exec_prompt("Is this page live? Answer yes or no.\n" + page[:300])

    # Back to deterministic — store the consensus result
    self.is_live = gl.eq_principle_strict_eq(_check) == "yes"
```

---

### 2. Transactions may be UNDETERMINED, not just reverted

Solidity transactions have two outcomes: success or revert. GenLayer adds a third: **`UNDETERMINED`**, meaning validators ran the contract but could not reach consensus on the output.

This happens when:
- An LLM produces sufficiently different outputs across validators.
- `strict_eq` is used on free-text LLM output.
- Web fetches return different content on different validators (e.g. live prices, timestamps).

Design your equivalence principle and prompt structure to minimize `UNDETERMINED` results. Constraining LLM output to yes/no, a specific category, or a number is the most reliable approach.

---

### 3. No native event system — use storage for history

Solidity has `event` declarations and `emit` for off-chain indexing. GenLayer does not have a native event system yet. If you need queryable history, store it explicitly.

```python
# Solidity pattern (not available in GenLayer):
# emit Transfer(from, to, amount);

# GenLayer equivalent — store a log in a DynArray:
class TokenContract(gl.Contract):
    transfer_log: DynArray[str]

    @gl.public.write
    def transfer(self, to: Address, amount: u256) -> None:
        # ... transfer logic ...
        entry = f"{gl.message.sender}->{to}:{amount}"
        self.transfer_log.append(entry)
```

---

### 4. No built-in oracles — web access is native

In Solidity, fetching external data requires a trusted oracle service (Chainlink, etc.), which adds cost, latency, and a trust assumption. In GenLayer, `gl.get_webpage(url)` is a first-class protocol primitive — no third-party oracle needed.

Multi-validator consensus on the fetched data replaces the oracle's trust model.

---

### 5. Storage types are different

GenLayer's storage types are Python-native but have blockchain-specific semantics. The key types:

| Solidity | GenLayer | Notes |
|---|---|---|
| `mapping(K => V)` | `TreeMap[K, V]` | Ordered; supports iteration |
| `T[]` (dynamic) | `DynArray[T]` | Dynamic array |
| `T[N]` (fixed) | Python list (fixed size) | Initialized in `__init__` |
| `struct Foo` | `@dataclass class Foo` | Use `gl.Dataclass` |
| `address` | `Address` | GenLayer address type |
| `uint256` | `u256` | And `u8`, `u32`, `u64`, `i256`, etc. |

---

## Quick start for Solidity developers

1. Install the GenLayer CLI: `npm install -g genlayer`
2. Scaffold a project: `genlayer init my-project`
3. Replace your `.sol` file with a `.py` file following the `class MyContract(gl.Contract)` pattern
4. Run the GenLayer Studio locally to test with multiple validators
5. Deploy to testnet: `genlayer deploy --contract contracts/my_contract.py`

---

## See also

- [Introduction to Intelligent Contracts](../intelligent-contracts/introduction.md)
- [Types Reference](../intelligent-contracts/types.md)
- [Best Practices](./best-practices.md)
- [Your First Intelligent Contract](../intelligent-contracts/first-intelligent-contract.md)
