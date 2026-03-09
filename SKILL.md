---
name: harness-tracker-skill
description: Output-driven harness visualization and reconstruction engine for Claude Code and Codex. Use for analyzing agent output, reconstructing execution harness, tracking tool usage, and visualizing agent workflows from stdout/JSON events.
---

# Harness Tracker Skill

This skill provides a specialized engine to reconstruct and visualize an agent's execution harness by analyzing its external output (stdout, JSON events, tool metadata).

## Core Functionality

The Harness Tracker Skill transforms raw agent output into a structured `HarnessState` using an event-sourcing model. It is designed to be "output-only," meaning it does not require internal instrumentation of the agent runtime.

### Key Components

1.  **Ingestion Layer**: Collects output from Claude Code or Codex.
2.  **Event Parser**: Normalizes source-specific output into `CanonicalEvent` objects.
3.  **State Reducer**: Folds events into a comprehensive `HarnessState`.
4.  **Session Runtime**: Manages the lifecycle of a single agent run.

## Usage Instructions

### Initializing a Session

To start tracking an agent run, create a new session specifying the source.

```typescript
import { createSession } from './templates/src/runtime/session';

const session = createSession('claude'); // or 'codex'
```

### Processing Output

Feed the agent's output into the session. You can push raw strings (lines) or structured data.

```typescript
// Push a line from stdout
session.pushLine("Running shell command: ls -l");

// Push a structured JSON event
session.pushRaw({
  event: "tool_call",
  tool: "shell",
  payload: { command: "npm install" }
});
```

### Querying State

Access the reconstructed state or get a summary of the session.

```typescript
const state = session.getState();
console.log(`Current Phase: ${state.phase}`);
console.log(`Tool Calls: ${state.toolCalls}`);

const summary = session.getSummary();
console.log(`Total Files Written: ${summary.totalFilesWritten}`);
```

### Subscribing to Changes

Listen for specific events or state transitions.

```typescript
session.onEvent((event) => {
  if (event.kind === 'error') {
    console.error(`Agent Error: ${event.title}`);
  }
});

session.onStateChange((newState) => {
  console.log(`Transitioned to phase: ${newState.phase}`);
});
```

## Data Models

### Harness Phases

The engine tracks the agent through these logical phases:
- `idle`, `planning`, `tooling`, `editing`, `testing`, `awaiting_approval`, `completed`, `failed`.

### Canonical Event Kinds

Supported event types include:
- `session_start`, `session_end`, `message`, `tool_call`, `tool_result`, `bash`, `file_read`, `file_write`, `mcp_call`, `approval_request`, `approval_response`, `subagent_start`, `subagent_end`, `result`, `error`.

## Implementation Resources

The core logic is provided as TypeScript templates in the `templates/` directory:
- `templates/src/types.ts`: Core interfaces.
- `templates/src/normalize/canonical.ts`: Normalization logic.
- `templates/src/reducer/harness-reducer.ts`: State reconstruction logic.
- `templates/src/runtime/session.ts`: Session management.
