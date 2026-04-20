# Best Practices for Intelligent Contracts

> Best practices for writing efficient, reliable, and maintainable Intelligent Contracts on GenLayer.

---

## 1. Structure your contract clearly

Follow a consistent layout: storage declarations at the top, `__init__` next, then read-only (view) methods, then write methods. Non-deterministic blocks should be small, self-contained functions immediately adjacent to the call that uses them.

**Recommended contract layout:**

```python
from genlayer import *

class MyContract(gl.Contract):
    # 1. Storage
    owner: Address
    data: TreeMap[str, str]

    # 2. Init
    def __init__(self, owner: Address):
        self.owner = owner
        self.data = TreeMap()

    # 3. View methods
    @gl.public.view
    def get_value(self, key: str) -> str:
        return self.data.get(key, "")

    # 4. Write methods
    @gl.public.write
    def set_value(self, key: str, value: str) -> None:
        assert gl.message.sender == self.owner, "Not authorized"

        def _fetch_and_validate() -> bool:
            page = gl.get_webpage(value, mode="text")
            return gl.eq_principle_prompt_comparative(
                lambda: "Is this a valid non-empty URL response? " + page[:200],
                "yes or no"
            )

        if gl.eq_principle_strict_eq(_fetch_and_validate):
            self.data[key] = value
```

---

## 2. Keep non-deterministic blocks minimal

Non-deterministic blocks run on every validator. The more they do, the more LLM calls and web fetches you pay for — and the harder it is to reach consensus. Extract only the judgment you need.

**Avoid — doing too much in one block:**

```python
def _block():
    page = gl.get_webpage(url)
    summary = gl.exec_prompt("Summarize: " + page)
    score = gl.exec_prompt("Rate 1-10: " + summary)
    tags = gl.exec_prompt("Extract tags: " + page)
    return summary, score, tags
```

**Prefer — one focused judgment per block:**

```python
def _block():
    page = gl.get_webpage(url)
    return gl.exec_prompt(
        "Is this page about AI? Answer yes or no.\n" + page
    )
```

---

## 3. Choose the right equivalence principle

Picking the wrong principle is the most common source of `UNDETERMINED` transactions. Use the table below to guide your choice:

| Situation | Use | Example |
|---|---|---|
| All validators must match exactly | `strict_eq` | Fetching a price, parsing a number |
| LLM outputs may differ but mean the same | `prompt_comparative` | Sentiment check, yes/no decisions |
| You define what "equal enough" means | `prompt_non_comparative` | Grading, scoring, classification |

> **Warning:** Using `strict_eq` on a free-text LLM response almost always results in `UNDETERMINED`. Always constrain LLM outputs to structured answers (yes/no, a number, a category) when using `strict_eq`.

---

## 4. Validate external data before storing

Never write raw web data directly into storage. Validate structure and length before persisting.

```python
def _validate_price(url: str) -> float:
    raw = gl.get_webpage(url, mode="text")
    price_str = gl.exec_prompt(
        f"Extract the numeric price from this text. "
        f"Return only the number, no currency symbol.\n{raw[:500]}"
    )
    price = float(price_str.strip())
    assert 0 < price < 1_000_000, "Price out of range"
    return price
```

---

## 5. Minimize storage reads in write methods

Storage reads inside write methods still incur cost. Cache values in local variables when you need them multiple times within a single method call.

```python
# Instead of reading self.counter twice:
count = self.counter
count += 1
self.counter = count
self._emit_count_event(count)  # reuse local var
```

---

## 6. Use access control on every write method

Any method decorated with `@gl.public.write` is callable by anyone on-chain. Explicitly check `gl.message.sender` at the top of every method that should be restricted.

```python
@gl.public.write
def admin_reset(self) -> None:
    assert gl.message.sender == self.owner, "Only owner"
    self.data = TreeMap()
```

---

## 7. Test with multiple validators

A contract that passes on 1 validator may fail with 5 due to LLM variance. Always run integration tests with at least 3–5 validators before deploying to testnet.

```python
sim_createRandomValidators(5, "openai", ["gpt-4"])
```

---

## See also

- [Equivalence Principle](../core-concepts/equivalence-principle.md)
- [Security Checklist](./security-checklist.md)
- [Debugging Intelligent Contracts](./debugging.md)
