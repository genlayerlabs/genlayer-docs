# Protocol documentation maintenance

Use this guide when changing `pages/understand-genlayer-protocol.mdx` or `pages/understand-genlayer-protocol/`. That section explains the protocol to readers; it must not become a second, independently evolving specification or API reference.

## Source precedence

When sources disagree, use this order and resolve the inconsistency before publishing:

1. Deployed consensus contracts and the matching contract interfaces define executable state, enums, and transitions.
2. The consensus specification explains intended protocol behavior. Verify high-risk details against the implementation.
3. GenLayer Node and GenVM code and their repository documentation define component behavior.
4. Developer documentation in this repository defines the public SDK and Intelligent Contract APIs.
5. Architecture articles and blog posts can supply narrative and motivation, but they are not normative.

Never copy a deployment default into a timeless rule. Label values such as timeouts, committee limits, minimum stake, weights, rewards, and slash percentages as current defaults or configurable parameters.

## Page ownership

Keep each fact in one primary place and link to it elsewhere.

| Topic | Primary page type |
| --- | --- |
| Architecture, roles, lifecycle, and mental models | Understand GenLayer Protocol |
| Python APIs, code patterns, and contract restrictions | Intelligent Contract developer guides |
| SDK methods and frontend code | DApp developer guides and SDK reference |
| RPC fields, numeric codes, and response schemas | API reference |
| Node installation and operations | Validator documentation |

Concept pages can summarize an API, but they should not duplicate long code examples or response payloads. API pages can link back to concepts instead of redefining consensus semantics.

## Writing style

Follow the [Google developer documentation style guide](https://developers.google.com/style) unless GenLayer terminology requires an exception.

- Put the reader's question or outcome first.
- Use sentence case for headings.
- Prefer active voice, present tense, and short paragraphs.
- Define a term before using its abbreviation.
- Use **Intelligent Contract**, **GenLayer Chain**, **GenVM**, **Ghost**, and **Optimistic Democracy** consistently.
- Distinguish `Accepted` from `Finalized` and consensus status from execution result.
- Use meaningful link text. Link to the canonical page rather than “here.”
- Give every image useful alternative text. Prefer Mermaid for protocol flows that are likely to change.
- Separate protocol guarantees from current deployment configuration and future plans.

## Review triggers

Review the affected concept pages when any of these sources change:

| Source change | Pages to review |
| --- | --- |
| `ITransactions.TransactionStatus` or phase contracts | Transaction execution, statuses, appeals, finality |
| Committee selection or round sizing | Validators, Optimistic Democracy, appeals |
| Staking, rewards, epochs, or slash contracts | Economic model, staking, slashing, unstaking |
| GenVM sandbox, runner, or host interface | GenVM, non-deterministic operations, LLM and web pages |
| Ghost, messages, or account queues | Architecture, accounts, transactions, finality |
| Node RPC receipt/status schema | Transaction pages and API reference |

Run `npm run check:protocol-docs` after editing these pages. The check intentionally keeps a local snapshot of the public status enum because CI does not have the sibling consensus repository. Update the snapshot only after verifying the deployed-compatible consensus interface.
