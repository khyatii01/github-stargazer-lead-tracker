# Lead Sniper Executable Specification

## Goal

Notify a Discord channel when a newly created GitHub repository star belongs to a high-value user, enrich the event with the user's public profile, and generate a one-sentence AI sales pitch.

## Functional requirements

| ID | Requirement | Acceptance criterion |
|---|---|---|
| A1-FR-001 | Receive GitHub star events through a webhook. | A POST webhook accepts GitHub payloads; ping and non-created actions stop without downstream work. |
| A1-FR-002 | Enrich a new star with `GET /users/{username}`. | The profile request URL contains the event sender's encoded login. |
| A1-FR-003 | Qualify by exclusive thresholds. | A lead passes when `followers > 100 OR public_repos > 50`; values 100 and 50 do not pass. |
| A1-FR-004 | Generate a one-sentence sales pitch using an AI/LLM node. | The workflow contains an OpenAI node whose prompt uses bio and company and asks for exactly one sentence. |
| A1-FR-005 | Send a formatted Discord message. | The payload contains the user's name, bio, influence fields, and AI pitch. |

## Non-functional requirements

| ID | Requirement | Acceptance criterion |
|---|---|---|
| A1-NFR-001 | Limit GitHub API pressure and handle transient failures. | Event-driven webhook design makes one profile request per created star; the request uses authentication and three attempts with delay. |
| A1-NFR-002 | Do not commit secrets. | Token and webhook URL are environment references; exported workflow has no credentials or literal secret. |
| A1-NFR-003 | Make the logic testable outside n8n. | Pure domain functions and a workflow contract validator run with `node --test`. |

## Evidence requirements

| ID | Deliverable |
|---|---|
| A1-EV-001 | Importable `workflow/lead-sniper.n8n.json`. |
| A1-EV-002 | Local preview plus instructions to capture a real Discord screenshot. |
| A1-EV-003 | `docs/LOGIC_LOG.md` documenting rate-limit handling. |
| A1-EV-004 | `docs/DEMO_RECORDING_SCRIPT.md` for a reproducible recording. |

## Out of scope

- Automatic creation of the GitHub webhook, because repository admin access is account-specific.
- Shipping a live Discord screenshot without the owner's Discord webhook.
- Shipping an OpenAI credential inside the workflow export.
