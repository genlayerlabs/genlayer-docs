# Docs MCP operations

The Docs MCP service has three separately owned parts:

- this repository builds and publishes the server image to GHCR;
- `genlayerlabs/devexp-argocd-apps` deploys the production workload on AWS EKS;
- `genlayerlabs/argocd-aws-apps` registers that workload with ArgoCD;
- `genlayerlabs/skills` exposes the hosted connection through the GenLayer Docs plugin.

The primary endpoint is stateless Streamable HTTP at
`https://docs-mcp.genlayer.com/mcp`. Legacy SSE remains available at `/sse` and
`/messages` for clients that do not support Streamable HTTP yet.

## Release and deployment flow

Merges to `main` that change `docs-mcp/**` or `pages/**` publish `latest` and
`sha-<commit>` to GHCR. The image embeds the full source commit as the OCI
`org.opencontainers.image.revision` label, so a docs-only change produces a new
image digest even when the server files are unchanged.

`devexp-argocd-apps` reads the current `genlayer-docs` `main` revision, waits
for its matching `sha-<commit>` image, validates the image's embedded source
provenance through its immutable digest, opens and auto-merges the workload
bump PR, and lets ArgoCD roll the StatefulSet. The promoter remains active
until production verification finishes, so a later release cannot enter the
lane while the current one is still being verified. The deployment is complete
only after:

1. ArgoCD reports the exact GitOps revision synced and healthy;
2. the workload is running the expected immutable digest;
3. the public `/mcp` canary initializes without a session, lists tools, and runs
   real `search_docs` queries against both indexes without duplicate
   Markdown-mirror results or undefined result metadata; and
4. the legacy `/sse` compatibility handshake still succeeds.

The GitOps verification workflow restores the previous `docs-mcp` manifests
when a rollout or its public canaries fail. Those deployment incidents are
owned and tracked in `devexp-argocd-apps`. Separately,
`docs-mcp-health.yml` runs the three public canaries every 15 minutes; ongoing
service-health incidents are owned and tracked in this repository. Each
workflow closes only the incident type it owns after recovery.

## Index lifecycle

The AWS cluster provides EBS block storage, not a shared filesystem suitable
for SQLite. Each StatefulSet pod therefore uses its own `emptyDir` volume:

1. an init container scrapes `docs.genlayer.com` and `sdk.genlayer.com` into a
   fresh local SQLite index;
2. it verifies that both libraries are usable;
3. the serving container starts read-only from that immutable local copy.

The rolling update creates and readies one freshly indexed pod at a time. This
avoids concurrent SQLite writers, removes the stale shared-PVC failure mode,
and allows the two serving replicas to run on different nodes. The previous
EBS PVC is intentionally retained, unmounted, for short-term rollback evidence;
it is not part of the active data path.

Rendered pages and their `.md` mirrors contain the same content. The docs
scrape explicitly requests HTML and excludes direct `.md` links so each
canonical page is indexed once. Without the explicit `Accept` header, the v3
scraper can store a Markdown final URL after its pre-fetch exclusion check. The
canary rejects an HTML/Markdown pair for the same page, not a lone Markdown
source URL.

## Health checks

Run the primary protocol and search-quality canary:

```bash
node docs-mcp/smoke-test.mjs https://docs-mcp.genlayer.com/mcp
```

Run the legacy compatibility canary without a duplicate search call:

```bash
DOCS_MCP_SKIP_SEARCH=true \
  node docs-mcp/smoke-test.mjs https://docs-mcp.genlayer.com/sse
```

Run the SDK-index canary:

```bash
DOCS_MCP_SEARCH_LIBRARY=genlayer-sdk \
DOCS_MCP_SEARCH_QUERY='manager socket protocol' \
DOCS_MCP_SEARCH_EXPECTED_TEXT='Manager Socket Protocol' \
  node docs-mcp/smoke-test.mjs https://docs-mcp.genlayer.com/mcp
```

An HTTP-only `/healthz` check is insufficient. The ingress health route proves
that nginx can reach the MCP process, while the protocol canary proves that the
server and index can answer real MCP traffic.

## Incident triage

Check ArgoCD, both StatefulSet pods, and their init-container logs before
restarting anything:

```bash
kubectl --context devexp-prd -n argocd get application docs-mcp
kubectl --context devexp-prd -n studio-prd get statefulset,pods \
  -l app=docs-mcp-server
kubectl --context devexp-prd -n studio-prd describe pod \
  -l app=docs-mcp-server
kubectl --context devexp-prd -n studio-prd logs \
  -l app=docs-mcp-server -c index-docs --tail=200
kubectl --context devexp-prd -n studio-prd logs \
  -l app=docs-mcp-server -c docs-mcp-server --tail=200
kubectl --context devexp-prd -n studio-prd get events \
  --sort-by=.lastTimestamp
```

The index is derived data. A failed init container should be diagnosed from its
scrape and verification output; deleting or repairing a shared database is no
longer part of normal recovery.

## Deployment guardrails

The production workload must continue to:

1. pin immutable image digests;
2. run at least two Streamable HTTP serving replicas with rolling updates and
   one pod available throughout the rollout;
3. build a fresh pod-local index before each server starts;
4. route `/sse` and `/messages` to one stable StatefulSet pod while legacy
   sessions are supported;
5. make readiness and ingress health depend on the MCP process;
6. wait for ArgoCD convergence and run both public protocol canaries;
7. restore the previous manifests automatically when verification fails; and
8. track rollout-verification incidents in `devexp-argocd-apps` and scheduled
   production-health incidents in `genlayer-docs`.

Do not restore the removed `POST /web/jobs/scrape` workflow call. That route is
not exposed by the read-only `docs-mcp-server mcp` runtime.
