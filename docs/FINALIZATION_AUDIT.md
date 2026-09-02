# DrawMCP finalization audit

Last updated: 2026-09-02

This is the release control sheet for the finalization plan. It distinguishes
local proof from production proof and records every remaining human-controlled
action. The current machine-readable local source of truth is
`public/evidence/latest.json`; benchmark and model details resolve through the
artifact paths in that manifest.

## Current proof levels

| Proof level | Status | Authoritative evidence |
| --- | --- | --- |
| Static contract | Passed locally | Generated `evals/tools.json`, lint, TypeScript build, and closed-schema tests |
| Unit and component behavior | Passed locally | 113/113 tests; durable unit summary linked by the release manifest |
| Real Chrome WebMCP behavior | Passed locally | 17/17 development-server steps, 17/17 production-build CSP steps, and 11/11 Chrome Labs smoke calls |
| Responsive product rendering | Passed locally | 8/8 desktop/mobile route checks with screenshots, asset checks, clipping detection, and zero console errors |
| Repeated model decisions | Passed locally | 125/125 accepted Qwen decisions, five runs per case, exact production-schema argument validation, and zero safety violations |
| Controlled component benchmark | Passed locally | 220/220 semantic trials, 100 warm plus 10 cold pairs per lane, raw checksummed rows, and qualified statistics |
| Live production task benchmark | Passed | 20 randomized pairs, 40/40 semantic successes, 20/20 rendered WebMCP changes, 6.58× p50 and 9.93× p90 observed task speedups |
| Shared tic-tac-toe journey | Passed locally and in production | Human Excalidraw input followed by a rendered WebMCP agent move on one revisioned canvas |
| Exact production deployment | Awaiting user approval | No candidate push or deployment has been performed |
| Production WebMCP and headers | Awaiting exact deployment | Packaged production deterministic, Chrome Labs, visual, header, and live-observation commands |
| Matched-model prompt journey | Evidence pending | The accepted live result starts at tool dispatch; model decision time remains outside the published speed claim |
| Repository visibility, recording, Devpost submit | User-controlled | Explicit checklist in `docs/DEVPOST_SUBMISSION.md` |
| Upstream Excalidraw MCP contribution | Paused by user | No active pull request or remote feature branch; local candidate details remain in `docs/UPSTREAM_CONTRIBUTION.md` |

## Requirements audit

| Requirement | Disposition |
| --- | --- |
| R1-R2: fallback and lifecycle | Proven by registry, StrictMode, disposal, and component tests; real Chrome sees exactly seven registrations |
| R3-R4: schemas, validation, outputs, annotations | Proven by exact fixture generation, AJV execution validation, 1,536-character result enforcement, and annotation tests |
| R5-R8: mutation liveness, Excalidraw API, revisions, stale guards | Proven across no-op, abort, editor failure, timeout, detach, competing edit, queue recovery, real browser mutations, and Undo/Redo |
| R9: local reload recovery | Proven for the versioned non-file scene subset; prior-session Undo/Redo is explicitly excluded |
| R10: connected supported diagrams | Proven for labeled nodes and bound connectors through add, update, organize, human continuation, Undo, and Redo; unsupported types are reported rather than claimed as parity |
| R11: deterministic coverage | Proven by 113 tests plus the 17-step semantic browser journey under both development and production CSP, the external 11-step smoke layer, and the shared game journey |
| R12: probabilistic and adversarial coverage | Proven locally for direct, ambiguous, recovery, no-tool, and injection cases; judged-host confirmation remains a production gate |
| R13: production verification | Packaged but not yet executed against the candidate because deployment requires explicit user approval |
| R14-R17: benchmark boundaries, controls, statistics, oracle | Proven for controlled local and live production strata; the live task speedup is published separately from unmeasured model decision time |
| R18: claim traceability | Public page values come from generated evidence; README and Devpost totals are checked during release validation; production fields remain pending |
| R19: challenge judge path | Implemented with no login and documented; exact candidate production proof awaits approval |
| R20: upstream contribution | Local narrow candidate and upstream-native test are prepared; publishing is now an explicit future human gate |
| R21: recording handoff | The safe sub-three-minute journey, receipts, claims, and exclusions are in `docs/DEMO_SCRIPT.md`; the user owns recording and upload |

## Audit-finding dispositions

| Finding | Disposition |
| --- | --- |
| FIND1-FIND2 | Mutation no-ops, failures, timeouts, detach, and exceptions settle and release the queue |
| FIND3 | Revision identity includes complete semantic element content and ordering while omitting only volatile Excalidraw fields |
| FIND4 | Read pages and mutation receipts are bounded; one finalizer enforces the output ceiling |
| FIND5 | All page-derived tool outputs carry `untrustedContentHint: true` |
| FIND6 | Project-owned browser assertions inspect domain results and visible scene state instead of trusting smoke completion |
| FIND7 | Exact production, Vercel-mapped, and Ollama-run schemas are separately named and hashed |
| FIND8 | Four versioned repeated model corpora and their accepted reports are committed and independently revalidated |
| FIND9 | The five-sample pilot is superseded by a 220-trial controlled run and a 40-trial live run with rendered-pixel proof and a checksummed task-specific speed claim |
| FIND10 | Versioned local non-file recovery is implemented and accurately documented |
| FIND11 | Bounded start/end bindings and connector-preserving organization are implemented and tested |
| FIND12 | Detection, registration, failure, disposal, and StrictMode lifecycle paths settle deterministically |
| FIND13 | Tool inventories, proof counters, benchmark values, and sample sizes are generated or read from evidence sources |
| FIND14 | Cancellation, revision, persistence, and benchmark copy now names the tested boundary and its limitations |

No local release blocker remains. The unresolved items are deliberately higher
proof levels or actions controlled by the user, not substitutes for failed local
work.

## Human-in-the-loop publication gate

Before any push or Vercel deployment, present the user with:

1. the exact local commit and branch;
2. the full diff summary and confirmation that the repository is still private;
3. the release-manifest proof totals and every remaining pending proof level;
4. the exact Git push and Vercel production actions proposed; and
5. a clear yes/no approval request.

After approval, verify `/release.json`, the deployed commit, deployment ID, domain alias, TLS and
security headers, seven-tool inventory, 17-step semantic journey, 11-step smoke
run, 8-route visual run, small throttled live-service observation, and the manual
human-edit continuation. Repository-public visibility and final Devpost submit
remain separate later confirmations.
