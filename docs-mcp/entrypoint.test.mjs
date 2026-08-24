import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import {
  chmod,
  mkdtemp,
  mkdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import test from "node:test";

const execFileAsync = promisify(execFile);
const entrypoint = join(dirname(fileURLToPath(import.meta.url)), "entrypoint.sh");

test("indexes docs as HTML through the image-owned entrypoint", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "docs-mcp-entrypoint-"));
  const bin = join(root, "bin");
  const store = join(root, "data");
  const callsFile = join(root, "calls.log");
  const fakeServer = join(bin, "docs-mcp-server");
  t.after(() => rm(root, { recursive: true, force: true }));

  await mkdir(bin);
  await writeFile(
    fakeServer,
    `#!/bin/sh
for arg in "$@"; do
  printf '[%s]' "$arg" >> "$CALLS_FILE"
done
printf '\n' >> "$CALLS_FILE"
`,
  );
  await chmod(fakeServer, 0o755);

  await execFileAsync("/bin/sh", [entrypoint], {
    env: {
      ...process.env,
      PATH: `${bin}:${process.env.PATH}`,
      CALLS_FILE: callsFile,
      MODE: "index",
      STORE_PATH: store,
      DOCS_URL: "https://docs.example.test",
      SDK_URL: "https://sdk.example.test/main/",
    },
  });

  const calls = (await readFile(callsFile, "utf8")).trim().split("\n");
  assert.equal(calls.length, 4);
  assert.match(calls[0], /^\[scrape\]\[genlayer-docs\]/);
  assert.match(calls[0], /\[--header\]\[Accept: text\/html\]/);
  assert.match(calls[0], /\[--exclude-pattern\]\[\/\\\.md/);
  assert.match(calls[1], /^\[scrape\]\[genlayer-sdk\]/);
  assert.doesNotMatch(calls[1], /\[--header\]/);
});
