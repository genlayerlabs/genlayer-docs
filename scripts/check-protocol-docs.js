const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const UNDERSTAND = path.join(ROOT, "pages", "understand-genlayer-protocol");
const failures = [];

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

function relative(file) {
  return path.relative(ROOT, file);
}

function hasUsefulAlt(imageTag) {
  const match = imageTag.match(/\balt\s*=\s*(?:"([^"]*)"|'([^']*)'|\{([^}]*)\})/);
  if (!match) return false;

  const value = (match[1] ?? match[2] ?? match[3] ?? "").trim();
  return value.replace(/^(['"])(.*)\1$/, "$2").trim().length > 0;
}

const landingPage = path.join(ROOT, "pages", "understand-genlayer-protocol.mdx");
const pages = [landingPage, ...walk(UNDERSTAND).filter((file) => file.endsWith(".mdx"))];

for (const file of pages) {
  const content = fs.readFileSync(file, "utf8");

  if (!content.startsWith("---\n")) {
    failures.push(`${relative(file)}: missing frontmatter`);
  }

  if (/!\[\s*\]\(/.test(content)) {
    failures.push(`${relative(file)}: Markdown image has empty alternative text`);
  }

  for (const imageTag of content.match(/<Image\b[\s\S]*?\/>/g) || []) {
    if (!hasUsefulAlt(imageTag)) {
      failures.push(`${relative(file)}: Image component has empty or missing alt`);
    }
  }

  const localRoutes = [
    ...Array.from(content.matchAll(/\]\((\/[^)\s#]+)(?:#[^)]*)?\)/g), (match) => match[1]),
    ...Array.from(content.matchAll(/\bhref=["'](\/[^"'#?]+)(?:[?#][^"']*)?["']/g), (match) => match[1]),
  ];
  for (const localRoute of localRoutes) {
    const route = localRoute.replace(/\/$/, "");
    const candidates = [
      path.join(ROOT, "pages", `${route}.mdx`),
      path.join(ROOT, "pages", `${route}.cmdx`),
      path.join(ROOT, "pages", route, "index.mdx"),
    ];
    if (!candidates.some(fs.existsSync)) {
      failures.push(`${relative(file)}: unresolved internal link ${localRoute}`);
    }
  }
}

const legacyLinkPattern = /(?:\]\(|href=["'])\/(?:core-concepts|about-genlayer)(?:\/|[)"'])/;
for (const file of pages) {
  if (legacyLinkPattern.test(fs.readFileSync(file, "utf8"))) {
    failures.push(`${relative(file)}: uses a legacy route instead of its canonical URL`);
  }
}

const staleClaims = [
  ["OutOfFee", "obsolete OutOfFee transaction status"],
  ["each round doubles", "obsolete appeal committee growth claim"],
  ["pay for all validators", "unsupported fast-finality claim"],
];
for (const file of pages) {
  const content = fs.readFileSync(file, "utf8").toLowerCase();
  for (const [text, description] of staleClaims) {
    if (content.includes(text.toLowerCase())) {
      failures.push(`${relative(file)}: contains ${description}`);
    }
  }
}

const statuses = [
  "Uninitialized",
  "Pending",
  "Proposing",
  "Committing",
  "Revealing",
  "Accepted",
  "Undetermined",
  "Finalized",
  "Canceled",
  "AppealRevealing",
  "AppealCommitting",
  "ValidatorsTimeout",
  "LeaderTimeout",
  "LeaderRevealing",
];
const statusTables = [
  path.join(UNDERSTAND, "core-concepts", "transactions", "transaction-statuses.mdx"),
  path.join(ROOT, "pages", "api-references", "genlayer-node", "gen", "gen_getTransactionStatus.mdx"),
];
for (const statusTable of statusTables) {
  const content = fs.readFileSync(statusTable, "utf8");
  for (const [code, status] of statuses.entries()) {
    const readableName = status.replace(/([a-z])([A-Z])/g, "$1_$2").toUpperCase();
    const conceptRow = `| ${code} | \`${status}\` |`;
    const apiRow = `| ${code} | ${readableName} |`;
    const camelApiRow = `| ${code} | ${status} |`;
    if (!content.includes(conceptRow) && !content.includes(apiRow) && !content.includes(camelApiRow)) {
      failures.push(`${relative(statusTable)}: missing status ${code} ${status}`);
    }
  }
}

for (const file of [
  path.join(UNDERSTAND, "core-concepts", "transactions", "transaction-statuses.mdx"),
  path.join(UNDERSTAND, "core-concepts", "transactions", "transaction-execution.mdx"),
  path.join(UNDERSTAND, "core-concepts", "optimistic-democracy", "finality.mdx"),
  path.join(ROOT, "pages", "api-references", "genlayer-node", "gen", "gen_getTransactionStatus.mdx"),
]) {
  const content = fs.readFileSync(file, "utf8");
  if (content.includes("| 11 | `ReadyToFinalize` |") || content.includes("| 11 | READY_TO_FINALIZE |")) {
    failures.push(`${relative(file)}: carries removed ReadyToFinalize status at ordinal 11`);
  }
}

const lifecycleApi = path.join(
  ROOT,
  "pages",
  "api-references",
  "genlayer-node",
  "gen",
  "gen_getTransactionLifecycle.mdx",
);
const lifecycleContent = fs.readFileSync(lifecycleApi, "utf8");
for (const field of [
  "storedStatus",
  "projectedStatus",
  "resolutionAction",
  "resolutionSource",
  "decisionId",
  "decisionActive",
  "evaluatedAt",
]) {
  if (!lifecycleContent.includes(`\`${field}\``)) {
    failures.push(`${relative(lifecycleApi)}: missing lifecycle field ${field}`);
  }
}

const removedStubs = [
  "what-are-intelligent-contracts.mdx",
  "what-makes-genlayer-different.mdx",
  "who-is-genlayer-for.mdx",
  "why-we-are-building-genlayer.mdx",
];
for (const stub of removedStubs) {
  if (fs.existsSync(path.join(UNDERSTAND, stub))) {
    failures.push(`${stub}: replace moved-page stub with a redirect`);
  }
}

if (failures.length) {
  console.error("check-protocol-docs: FAILED");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(
  `check-protocol-docs: OK (${pages.length} concept pages, ${statuses.length} transaction statuses)`,
);
