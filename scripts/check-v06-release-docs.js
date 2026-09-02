const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const ts = require("typescript");

const ROOT = process.cwd();
const failures = [];

const releaseDocs = [
  "pages/developers/consensus-v06-migration.mdx",
  "pages/developers/error-reference.mdx",
  "pages/developers/networks.mdx",
  "pages/developers/decentralized-applications/architecture-overview.mdx",
  "pages/developers/decentralized-applications/dapp-development-workflow.mdx",
  "pages/developers/intelligent-contracts/deploying/cli-deployment.mdx",
  "pages/developers/intelligent-contracts/deploying/deploy-scripts.mdx",
  "pages/developers/intelligent-contracts/deploying/network-configuration.mdx",
  "pages/developers/intelligent-contracts/deploying.mdx",
  "pages/developers/intelligent-contracts/features/value-transfers.mdx",
  "pages/developers/intelligent-contracts/tooling-setup.mdx",
  "pages/developers/intelligent-contracts/tools/genlayer-studio.mdx",
  "pages/developers/intelligent-contracts/tools/genlayer-studio/limitations.mdx",
  "pages/developers/decentralized-applications/developer-nft-rewards.mdx",
  "pages/developers/decentralized-applications/fee-outcomes-and-debugging.mdx",
  "pages/developers/decentralized-applications/fee-profiling-and-estimation.mdx",
  "pages/developers/decentralized-applications/fees-and-transaction-kit.mdx",
  "pages/developers/decentralized-applications/transaction-kit-integration.mdx",
  "pages/developers/decentralized-applications/querying-a-transaction.mdx",
  "pages/developers/decentralized-applications/reading-data.mdx",
  "pages/developers/decentralized-applications/writing-data.mdx",
  "pages/understand-genlayer-protocol/core-concepts/optimistic-democracy/appeal-process.mdx",
  "pages/understand-genlayer-protocol/core-concepts/economic-model.mdx",
  "pages/understand-genlayer-protocol/core-concepts/optimistic-democracy/slashing.mdx",
  "pages/understand-genlayer-protocol/core-concepts/optimistic-democracy/deterministic-violations-and-tribunals.mdx",
  "pages/understand-genlayer-protocol/core-concepts/optimistic-democracy/protocol-randomness.mdx",
  "pages/validators/network-keeper-roles.mdx",
  "pages/api-references/genlayer-js.md",
  "pages/api-references/genlayer-py.md",
];

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function requireText(relativePath, text, description = text) {
  if (!read(relativePath).includes(text)) {
    failures.push(`${relativePath}: missing ${description}`);
  }
}

function forbidText(relativePath, text, description = text) {
  if (read(relativePath).toLowerCase().includes(text.toLowerCase())) {
    failures.push(`${relativePath}: contains stale ${description}`);
  }
}

const appeal =
  "pages/understand-genlayer-protocol/core-concepts/optimistic-democracy/appeal-process.mdx";
requireText(appeal, "topUpAndSubmitAppeal", "schedule-extending appeal selector");
requireText(appeal, "bond + funding", "complete appeal charge formula");
requireText(appeal, "2.5× the bond in total", "2.5× successful appeal return");
requireText(appeal, "1.5× the bond", "1.5× appeal profit");
requireText(appeal, "AppealRoundNotPermitted", "direct-submit failure mode");
forbidText(appeal, "principal returned plus a 0.5× profit", "old 1.5× total reward");

const keepers = "pages/validators/network-keeper-roles.mdx";
requireText(keepers, "topUpAndSubmitAppeal", "public keeper appeal path");
requireText(keepers, "2.5× the bond in total", "keeper appeal total return");
forbidText(keepers, "ConsensusMain.submitAppeal()", "direct submitAppeal keeper guidance");

const randomness =
  "pages/understand-genlayer-protocol/core-concepts/optimistic-democracy/protocol-randomness.mdx";
requireText(randomness, "ECVRF", "ECVRF seed advance");
requireText(randomness, "GenLayer/ConsensusManager/seed-advance/v1", "seed-advance domain");
requireText(randomness, "only one valid ECVRF output", "unique-output guarantee");
forbidText(randomness, "not a verifiable random function", "pre-v0.6 non-VRF claim");
forbidText(randomness, "ordinary ECDSA signature over the seed", "pre-v0.6 ECDSA scheme");

const tribunals =
  "pages/understand-genlayer-protocol/core-concepts/optimistic-democracy/deterministic-violations-and-tribunals.mdx";
requireText(tribunals, "quorumSnapshot", "creation-frozen tribunal quorum");
requireText(tribunals, "convictJudicially", "wired judicial conviction");
requireText(tribunals, "500 basis points", "leader slash default");
requireText(tribunals, "100 basis points", "validator slash default");
forbidText(tribunals, "not yet wired", "obsolete permanent-ban gap");
forbidText(tribunals, "implementation and the design intent diverge", "obsolete quorum gap");

const nft = "pages/developers/decentralized-applications/developer-nft-rewards.mdx";
requireText(nft, "Every later contract", "all deployments linked to the developer NFT");
requireText(nft, "at most 50 finalized inflation epochs", "bounded claim behavior");
requireText(nft, "time-unit fee pool", "developer fee source");
forbidText(nft, "only the first contract you deploy", "first-contract-only rewards claim");

const networks = "pages/developers/networks.mdx";
requireText(networks, "https://studio-dev.genlayer.com/api", "canonical Studio-dev RPC");
requireText(networks, "61997", "Studio-dev chain ID");
requireText(networks, 'chainId: "0xf22d"', "Studio-dev hexadecimal chain ID");
requireText(networks, 'chainId: "0xf22f"', "Studionet hexadecimal chain ID");
forbidText(networks, 'chainId: "0xf23f"', "incorrect Studionet hexadecimal chain ID");

const kit = "pages/developers/decentralized-applications/transaction-kit-integration.mdx";
requireText(kit, "| `low` | 1 |", "Transaction Kit low preset");
requireText(kit, "| `standard` | 3 |", "Transaction Kit standard preset");
requireText(kit, "| `high` | 5 |", "Transaction Kit high preset");
requireText(kit, "Fee policy changed; re-estimate before signing.", "fee-policy mismatch guard");
requireText(kit, "known mismatch by default", "fail-closed adapter behavior");

const economics = "pages/understand-genlayer-protocol/core-concepts/economic-model.mdx";
requireText(economics, "| Validator/staking distribution | 85% |", "time-unit validator share");
requireText(economics, "| Validator owners for operations | 15% |", "inflation validator share");
requireText(economics, "induced-work funding", "separate appeal work funding");
forbidText(economics, "combined pool is routed", "collapsed fee/inflation allocation");
forbidText(economics, "The bond funds the additional", "bond-as-work-funding claim");

const studioLimitations =
  "pages/developers/intelligent-contracts/tools/genlayer-studio/limitations.mdx";
requireText(studioLimitations, "protocol fees are a separate layer", "EVM/protocol fee distinction");

const feeOverview = "pages/developers/decentralized-applications/fees-and-transaction-kit.mdx";
requireText(feeOverview, "Storage and receipt ceilings are checked at submission", "cap timing");
requireText(feeOverview, "GEN-per-time-unit price is also locked at activation", "time-unit lock timing");
requireText(feeOverview, "user value is transferred separately", "user value and fee-deposit separation");

const outcomes = "pages/developers/decentralized-applications/fee-outcomes-and-debugging.mdx";
requireText(outcomes, "Canceled at activation because `GENPerTimeUnit`", "activation cap cancellation");
requireText(outcomes, "`MaxPriceExceeded` for the current storage/receipt price", "submission cap rejection");

const slashing =
  "pages/understand-genlayer-protocol/core-concepts/optimistic-democracy/slashing.mdx";
requireText(slashing, "judicial selection restriction", "v0.6 tribunal restriction");
requireText(slashing, "electorate and participation target are frozen", "frozen tribunal authority");
forbidText(slashing, "uses the active validator network", "live tribunal electorate claim");

const writing = "pages/developers/decentralized-applications/writing-data.mdx";
requireText(writing, "estimateTransactionFeesForWrite", "fee-aware write example");
requireText(writing, "isSuccessful(transaction)", "execution-aware success check");
requireText(writing, "Do not blindly submit", "duplicate-write warning");
forbidText(writing, "chain: simulator", "obsolete simulator chain import");
forbidText(writing, "status: TransactionStatus.FINALIZED", "deprecated status waiter");

const querying = "pages/developers/decentralized-applications/querying-a-transaction.mdx";
requireText(querying, "advanced.getTransactionLifecycle", "advanced lifecycle projection");
requireText(querying, "waitUntil: 'finalized'", "current generic waiter");
forbidText(querying, "tx.status === 'pending'", "non-canonical status polling");

const reading = "pages/developers/decentralized-applications/reading-data.mdx";
requireText(reading, "TransactionHashVariant.LATEST_FINAL", "explicit final read snapshot");
forbidText(reading, "chain: simulator", "obsolete simulator chain import");

const deployScripts =
  "pages/developers/intelligent-contracts/deploying/deploy-scripts.mdx";
requireText(deployScripts, "estimateTransactionFees", "fee-aware deploy estimate");
requireText(deployScripts, "isSuccessful(transaction)", "execution-aware deploy result");
requireText(deployScripts, "is deprecated on the v2 client", "deprecated initializer warning");
forbidText(deployScripts, "await client.initializeConsensusSmartContract", "deprecated initializer call");

const deploying = "pages/developers/intelligent-contracts/deploying.mdx";
requireText(deploying, "estimate from a measured fee profile", "fee-aware deployment guidance");
requireText(deploying, "verify the execution result", "execution-aware deployment outcome");
requireText(deploying, "genlayer network set studio-dev", "Studio-dev network selection");
forbidText(deploying, "testnetBradbury", "pre-v0.40 Bradbury alias");

const valueTransfers = "pages/developers/intelligent-contracts/features/value-transfers.mdx";
requireText(valueTransfers, "wallet must cover `value + feeValue`", "separate user value and protocol fee funding");

const tooling = "pages/developers/intelligent-contracts/tooling-setup.mdx";
requireText(tooling, "estimateTransactionFeesForWrite", "fee-aware tooling write");
requireText(tooling, "waitForFinalization", "current finalization waiter");

forbidText(
  "pages/api-references/genlayer-js.md",
  "stateStatus:",
  "unsupported GenLayerJS read option",
);

for (const relativePath of [
  "pages/developers/intelligent-contracts/deploying/cli-deployment.mdx",
  "pages/developers/intelligent-contracts/deploying/network-configuration.mdx",
]) {
  forbidText(relativePath, "genlayer network localnet", "pre-v0.40 network selection syntax");
  forbidText(relativePath, "genlayer network studionet", "pre-v0.40 network selection syntax");
  forbidText(relativePath, "genlayer network testnet-bradbury", "pre-v0.40 network selection syntax");
}

for (const relativePath of releaseDocs) {
  const content = read(relativePath);

  const localRoutes = [
    ...Array.from(content.matchAll(/\]\((\/[^)\s#]+)(?:#[^)]*)?\)/g), (match) => match[1]),
    ...Array.from(content.matchAll(/\bhref=["'](\/[^"'#?]+)(?:[?#][^"']*)?["']/g), (match) => match[1]),
  ];
  for (const localRoute of localRoutes) {
    const route = localRoute.replace(/\/$/, "");
    const candidates = [
      path.join(ROOT, "pages", `${route}.mdx`),
      path.join(ROOT, "pages", `${route}.md`),
      path.join(ROOT, "pages", `${route}.cmdx`),
      path.join(ROOT, "pages", route, "index.mdx"),
    ];
    if (!candidates.some(fs.existsSync)) {
      failures.push(`${relativePath}: unresolved internal link ${localRoute}`);
    }
  }

  for (const match of content.matchAll(/```(typescript|tsx|python)\s*\n([\s\S]*?)```/g)) {
    const [, language, source] = match;
    const line = content.slice(0, match.index).split("\n").length;
    if (language === "python") {
      const result = spawnSync(
        "python3",
        ["-c", "import ast,sys; ast.parse(sys.stdin.read())"],
        { input: source, encoding: "utf8" },
      );
      if (result.status !== 0) {
        failures.push(`${relativePath}:${line}: invalid Python example: ${result.stderr.trim()}`);
      }
    } else {
      const result = ts.transpileModule(source, {
        compilerOptions: {
          jsx: ts.JsxEmit.ReactJSX,
          target: ts.ScriptTarget.ES2022,
          module: ts.ModuleKind.ESNext,
        },
        fileName: language === "tsx" ? "example.tsx" : "example.ts",
        reportDiagnostics: true,
      });
      for (const diagnostic of result.diagnostics || []) {
        if (diagnostic.category === ts.DiagnosticCategory.Error) {
          failures.push(
            `${relativePath}:${line}: invalid ${language} example: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, " ")}`,
          );
        }
      }
    }
  }
}

requireText(
  "pages/api-references/genlayer-cli/transactions/appeal-bond.mdx",
  "bond and induced-work funding",
  "complete CLI appeal-charge description",
);
forbidText(
  "pages/api-references/genlayer-cli/transactions/appeal-bond.mdx",
  "Show minimum appeal bond required",
  "minimum-bond-only CLI description",
);

const jsApi = "pages/api-references/genlayer-js/contracts.md";
for (const method of [
  "### estimateTransactionFees",
  "### estimateTransactionFeesForWrite",
  "### getAppealCharge",
  "### appealTransaction",
  "### getDeveloperNft",
  "### resolveTransactions",
  "### finalizeDecisions",
]) {
  requireText(jsApi, method, `GenLayerJS API method ${method.slice(4)}`);
}
requireText(
  "pages/api-references/genlayer-js/transactions.md",
  "### getTransactionLifecycle",
  "GenLayerJS lifecycle API",
);
forbidText(jsApi, "Calculates the minimum bond required", "minimum-bond-only JS API description");

const pyApi = "pages/api-references/genlayer-py/api.md";
for (const method of [
  "### estimate_transaction_fees",
  "### estimate_transaction_fees_for_write",
  "### get_appeal_charge",
  "### appeal_transaction",
  "### get_transaction_lifecycle",
  "### wait_for_finalization",
]) {
  requireText(pyApi, method, `GenLayerPY API method ${method.slice(4)}`);
}
forbidText(pyApi, "value: int = 0)\n```", "zero-value default for Python appeals");

const selectorsPath = "data/consensus-v06-error-selectors.json";
requireText(
  "pages/developers/error-reference.mdx",
  "2f78febfc06866e59e7f12db848664e95ce99e8e",
  "consensus selector source revision",
);
const selectors = JSON.parse(read(selectorsPath));
const signatures = new Set(selectors.map(({ signature }) => signature));
const selectorValues = new Set(selectors.map(({ selector }) => selector));
if (selectors.length !== 363) {
  failures.push(`${selectorsPath}: expected 363 entries, found ${selectors.length}`);
}
if (signatures.size !== selectors.length) {
  failures.push(`${selectorsPath}: duplicate error signatures`);
}
if (selectorValues.size !== selectors.length) {
  failures.push(`${selectorsPath}: selector collision`);
}

const anchors = new Map([
  ["FeeValueMustBeNonZero(uint256)", "0x632be5a1"],
  ["AppealRoundNotPermitted()", "0x6ecc8d59"],
  ["InsufficientAppealFunding(uint256,uint256)", "0x96631b91"],
  ["TopUpCannotExtendSchedule()", "0x49449933"],
  ["PubKeyMismatch()", "0x203f11f1"],
  ["OnlyStakingRouter()", "0x25cbc0a7"],
]);
const actual = new Map(selectors.map(({ signature, selector }) => [signature, selector]));
for (const [signature, selector] of anchors) {
  if (actual.get(signature) !== selector) {
    failures.push(`${selectorsPath}: ${signature} must map to ${selector}`);
  }
}
for (const removed of ["FacetCallFailed(bytes)", "ReconcileBeyondTail()", "ReconcileNotAdvancing()"]) {
  if (signatures.has(removed)) {
    failures.push(`${selectorsPath}: contains removed signature ${removed}`);
  }
}

if (failures.length) {
  console.error("check-v06-release-docs: FAILED");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(
  `check-v06-release-docs: OK (${selectors.length} unique selectors and release-critical behavior anchors)`,
);
