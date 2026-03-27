# Direct Mode Testing

Run contracts directly in Python without a network. Provides Foundry-style cheatcodes for fast test execution.

## Setup Functions

### `deploy_contract`

Deploy a contract and return an instance.

```python
deploy_contract(contract_path: Path, vm: 'VMContext', args: Any, sdk_version: Optional[str] = None, kwargs: Any)
```

**Parameters:**

- **contract_path** (`Path`) — required
- **vm** (`'VMContext'`) — required
- **args** (`Any`) — required
- **sdk_version** (`Optional[str]`) — optional = None
- **kwargs** (`Any`) — required

**Returns:** `Any`

---
### `load_contract_class`

Load a contract class from file.

Sets up SDK paths, WASI mock, and message context.

```python
load_contract_class(contract_path: Path, vm: 'VMContext', sdk_version: Optional[str] = None)
```

**Parameters:**

- **contract_path** (`Path`) — required
- **vm** (`'VMContext'`) — required
- **sdk_version** (`Optional[str]`) — optional = None

**Returns:** `Type[Any]`

---
### `create_address`

Create a deterministic address from seed string.

```python
create_address(seed: str)
```

**Parameters:**

- **seed** (`str`) — required

**Returns:** `Any`

---
### `create_test_addresses`

Create a list of test addresses.

```python
create_test_addresses(count: int = 10)
```

**Parameters:**

- **count** (`int`) — optional = 10

**Returns:** `list`

---
## VMContext

Test VM context providing Foundry-style cheatcodes.

Usage:
    vm = VMContext()
    vm.sender = Address("0x" + "a" * 40)
    vm.mock_web("api.example.com", {"status": 200, "body": "{}"})

    with vm.activate():
        contract = deploy_contract("Token.py", vm, owner)
        contract.transfer(bob, 100)

### `vm.activate`

Activate this VM context for contract execution.
Uses proper cleanup via ExitStack for resource management.

Patches datetime.datetime so that datetime.now() returns the
warped time set via vm.warp(). This is dynamic: calling warp()
mid-test updates _datetime and subsequent now() calls reflect it.

---

### `vm.warp`

Set block timestamp (ISO format).

```python
vm.warp(timestamp: str)
```

**Parameters:**

- **timestamp** (`str`) — required

**Returns:** `None`

---

### `vm.deal`

Set balance for an address.

```python
vm.deal(address: Any, amount: int)
```

**Parameters:**

- **address** (`Any`) — required
- **amount** (`int`) — required

**Returns:** `None`

---

### `vm.snapshot`

Take a snapshot of current state. Returns snapshot ID.

**Returns:** `int`

---

### `vm.revert`

Revert to a previous snapshot.

```python
vm.revert(snapshot_id: int)
```

**Parameters:**

- **snapshot_id** (`int`) — required

**Returns:** `None`

---

### `vm.mock_web`

Mock web requests matching URL pattern.

```python
vm.mock_web(url_pattern: str, response: MockedWebResponseData)
```

**Parameters:**

- **url_pattern** (`str`) — required
- **response** (`MockedWebResponseData`) — required

**Returns:** `None`

---

### `vm.mock_llm`

Mock LLM prompts matching pattern.

```python
vm.mock_llm(prompt_pattern: str, response: str)
```

**Parameters:**

- **prompt_pattern** (`str`) — required
- **response** (`str`) — required

**Returns:** `None`

---

### `vm.clear_mocks`

Clear all registered mocks.

**Returns:** `None`

---

### `vm.prank`

Context manager to temporarily change sender.

```python
vm.prank(address: Any)
```

**Parameters:**

- **address** (`Any`) — required

---

### `vm.startPrank`

Start pranking as address (persists until stopPrank).

```python
vm.startPrank(address: Any)
```

**Parameters:**

- **address** (`Any`) — required

**Returns:** `None`

---

### `vm.stopPrank`

Stop the current prank.

**Returns:** `None`

---

### `vm.expect_revert`

Context manager expecting the next call to revert.

Catches ContractRollback (gl.rollback) and any Exception raised
by contract code (ValueError, RuntimeError, etc.). If *message*
is given, the exception text must contain it.

```python
vm.expect_revert(message: Optional[str] = None)
```

**Parameters:**

- **message** (`Optional[str]`) — optional = None

---

### `vm.run_validator`

Run a captured validator function from a prior run_nondet call.

Each ``gl.vm.run_nondet`` call in a contract appends an entry to
an internal list. Use *index* to select which one (default -1,
the most recent).

Mocks still apply: the validator typically re-runs leader_fn
internally, which hits the current web/LLM mocks. Swap mocks
between the contract call and ``run_validator()`` to simulate
the validator seeing different external data.

Args:
    leader_result: Override the leader's return value.
    leader_error: Simulate a leader exception (gl.vm.UserError).
    index: Which captured validator to run (-1 = last).

Returns:
    The bool returned by the validator function.

```python
vm.run_validator(leader_result: Any = <object object at 0x7f26a8798ad0>, leader_error: Optional[Exception] = None, index: int = -1)
```

**Parameters:**

- **leader_result** (`Any`) — optional = <object object at 0x7f26a8798ad0>
- **leader_error** (`Optional[Exception]`) — optional = None
- **index** (`int`) — optional = -1

**Returns:** `bool`

---

### `vm.clear_validators`

Clear the captured validator list.

**Returns:** `None`

---
