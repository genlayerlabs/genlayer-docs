# Docs MCP operations

The Docs MCP service has three separately owned parts:

- this repository builds and publishes the server image;
- `genlayerlabs/devexp-apps-workload` deploys the image to Kubernetes through
  ArgoCD;
- `genlayerlabs/skills` exposes the public SSE endpoint from the
  `genlayer-dev` plugin.

Publishing an image is not a deployment. Production must reference an immutable
`sha-<commit>` image tag (or digest) in the workload repository. A deployment is
complete only after the new Kubernetes rollout succeeds and
`smoke-test.mjs` completes an MCP `initialize` and `tools/list` exchange against
the public endpoint.

## Health check

Run the protocol-level canary:

```bash
node docs-mcp/smoke-test.mjs https://docs-mcp.genlayer.com/sse
```

An HTTP-only `/healthz` check is insufficient. The production nginx sidecar can
answer that route even when the MCP container is unavailable.

## Incident triage

Check both the pod and the MCP container before restarting anything:

```bash
kubectl get pods -n studio-prd -l app=docs-mcp-server
kubectl describe pod -n studio-prd -l app=docs-mcp-server
kubectl logs -n studio-prd -l app=docs-mcp-server -c docs-mcp-server --tail=200
kubectl logs -n studio-prd -l app=docs-mcp-server -c docs-mcp-server \
  --previous --tail=200
kubectl get events -n studio-prd --sort-by=.lastTimestamp
```

Inspect PVC capacity and index size when logs mention SQLite, disk, migration,
or verification errors. `documents.db` is derived data; the entrypoint removes
an unusable database and rebuilds it from the configured docs sources.

## Required deployment guardrails

The workload repository should:

1. pin an immutable image tag or digest;
2. use a rolling deployment with at least two serving replicas;
3. move indexing into a separate Job that writes a new index before rollout;
4. make readiness and ingress health depend on the MCP process, not nginx;
5. wait for rollout completion and run the public protocol canary;
6. roll back automatically when the canary fails;
7. alert the owning channel when the scheduled canary fails.

Do not restore the removed `POST /web/jobs/scrape` workflow call. That route is
not exposed by the pinned `docs-mcp-server mcp` runtime. Refresh the index with a
dedicated indexing Job instead.
