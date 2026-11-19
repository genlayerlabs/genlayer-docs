# Security Checklist

> A pre-deployment checklist covering the most critical security concerns for Intelligent Contracts. Work through every section before deploying to testnet or mainnet.

---

## Access control

- [ ] **Owner check on restricted methods** — every write method that should be admin-only asserts `gl.message.sender == self.owner`.
- [ ] **No default public admin** — the deployer address is stored explicitly at `__init__`, not assumed later.
- [ ] **Role changes are guarded** — any method that updates `self.owner` or a similar privileged field requires the current owner to authorize it.

```python
@gl.public.write
def transfer_ownership(self, new_owner: Address) -> None:
    assert gl.message.sender == self.owner, "Only owner"
    self.owner = new_owner
```

---

## Prompt injection

LLM calls are an attack surface unique to Intelligent Contracts. Treat prompt inputs with the same care as SQL queries.

- [ ] **User input is never embedded raw in prompts** — always sanitize or truncate caller-supplied strings before interpolating into `gl.exec_prompt`.
- [ ] **Prompts request structured output** — asking for yes/no, a number, or a specific category shrinks the attack surface versus open-ended generation.
- [ ] **Web content is trimmed before injection** — use `page[:500]` or similar to avoid embedding adversarial content hidden deep in a fetched page.
- [ ] **LLM output is validated post-generation** — parse and bounds-check any value extracted from an LLM before using it in business logic or storage.

**Example — safe prompt construction:**

```python
@gl.public.write
def classify(self, user_input: str) -> None:
    # Sanitize: truncate and strip control characters
    safe_input = user_input[:200].replace("\n", " ").replace("\r", " ")

    def _classify():
        return gl.exec_prompt(
            f"Classify the following text as 'positive', 'negative', or 'neutral'. "
            f"Return only one of those three words.\nText: {safe_input}"
        )

    result = gl.eq_principle_strict_eq(_classify).strip().lower()
    assert result in ("positive", "negative", "neutral"), "Unexpected LLM output"
    self.sentiment = result
```

---

## State consistency & reentrancy

GenLayer does not have Solidity-style reentrancy guards, but the same underlying principle applies: validate before you mutate.

- [ ] **Checks before effects** — validate all preconditions (`assert`) before any state mutation, following the checks–effects–interactions pattern.
- [ ] **No storage access inside non-deterministic blocks** — storage is intentionally inaccessible there, but ensure closures or captured variables don't smuggle stale state in.
- [ ] **Contract-to-contract calls use `gl.contract_at`** — external calls are explicit; never rely on implicit state sharing between contracts.

**Pattern — checks before effects:**

```python
@gl.public.write
def withdraw(self, amount: u256) -> None:
    # CHECKS
    assert gl.message.sender == self.owner, "Not authorized"
    assert self.balance >= amount, "Insufficient balance"

    # EFFECTS (mutate state before any external interaction)
    self.balance -= amount

    # INTERACTIONS (external calls last)
    # ... send tokens ...
```

---

## Web data safety

- [ ] **URLs are validated before fetching** — check that caller-supplied URLs start with `https://` and, where possible, belong to an expected domain allowlist.
- [ ] **Fetch failures are handled gracefully** — wrap `gl.get_webpage` calls so a network failure surfaces a clear exception rather than causing an `UNDETERMINED` transaction silently.
- [ ] **Web data is never stored without parsing** — raw HTML is not meaningful storage; always extract and validate the specific field you need before writing to state.

```python
def _safe_fetch(url: str) -> str:
    assert url.startswith("https://"), "Only HTTPS URLs allowed"
    try:
        content = gl.get_webpage(url, mode="text")
    except Exception as e:
        raise Exception(f"Web fetch failed: {e}")
    assert len(content) > 0, "Empty response"
    return content[:1000]
```

---

## Gas & economic safety

Unlike EVM gas limits, unbounded operations in GenLayer can cause transactions to run indefinitely or become prohibitively expensive. Design defensively.

- [ ] **Non-deterministic blocks are bounded** — LLM calls with unbounded input can spike costs; always cap input size passed to `gl.exec_prompt` and `gl.get_webpage`.
- [ ] **Loops over storage are avoided in write methods** — iterating a `TreeMap` of unbounded size inside a write method creates an unbounded gas cost vector.
- [ ] **No user-controlled iteration bounds** — if a caller can pass a `count` argument that drives a loop, cap it to a safe maximum constant.

```python
MAX_ITEMS = 100

@gl.public.write
def batch_process(self, items: list) -> None:
    assert len(items) <= MAX_ITEMS, f"Exceeds max batch size of {MAX_ITEMS}"
    for item in items:
        self._process(item)
```

---

## Pre-deployment summary

Before deploying to testnet, confirm:

1. Every restricted write method checks `gl.message.sender`.
2. All user-supplied strings are sanitized before reaching `gl.exec_prompt`.
3. LLM outputs are parsed and validated before being stored or used in logic.
4. State mutations follow checks–effects–interactions order.
5. Web fetches validate the URL and handle failures explicitly.
6. No unbounded loops or user-controlled iteration sizes exist in write methods.

---

## See also

- [Prompt Injection](./prompt-injection.md)
- [Best Practices](./best-practices.md)
- [Equivalence Principle](../core-concepts/equivalence-principle.md)
