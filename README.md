# Harness Tracker Skill

**Output-driven harness visualization and reconstruction engine for Claude Code and Codex**

## Overview

Harness Tracker Skill is a TypeScript library that analyzes external output from agent runtimes like **Claude Code** and **Codex** to reconstruct the agent's execution harness, tools used, and workflow. Instead of directly instrumenting the agent's internal execution environment, this system uses only `stdout`, `JSON events`, `tool call metadata`, and `CLI structured output` to understand and visualize agent behavior.

This is not a simple observability system—it's an **Output Driven Harness Reconstruction Engine**.

## Key Features

- **Claude Code / Codex Output Ingestion**: Collect various output formats from Claude Code and Codex CLI
- **Event Parsing**: Parse collected output into structured events
- **Canonical Event Normalization**: Convert events from different sources into a unified schema
- **Harness State Reconstruction**: Reconstruct the agent's current harness state from normalized events
- **Runtime Session Management**: Manage sessions for single agent executions and track event streams and state changes
- **State Query API**: Provide query interfaces for reconstructed harness state
- **Internal Module Embedding**: Provided as a library for easy integration into other systems

## Design Principles

- **Output Only Architecture**: Uses only `stdout`, `JSON events`, `tool call metadata`, and `CLI structured output`; does not access internal runtime hooks, agent memory, or container inspection
- **Event Sourcing Model**: All harness state is reconstructed from event streams; state can always be replayed
- **Source Agnostic Architecture**: Uses `Canonical Event Schema` for compatibility with Claude Code, Codex CLI, and future agent runtimes
- **Two Channel Observation Model**: Distinguishes between `Machine Reliable Channel` (tool use, JSON events) and `Model Annotation Channel` (phase hints, reasoning hints)

## Installation

```bash
npm install harness-tracker-skill
```

## Quick Start

```typescript
import { createSession } from 'harness-tracker-skill';

// Create a new session
const session = createSession('codex');

// Push agent output line by line
session.pushLine('Starting execution...');

// Or push raw data directly
session.pushRaw({ event: 'tool_call', tool: 'shell', command: 'ls -l' });

// Subscribe to state changes
session.onStateChange((newState) => {
  console.log('Current Harness State:', newState);
});

// Subscribe to events
session.onEvent((event) => {
  console.log('New Event:', event);
});

// Query current state
const currentState = session.getState();
console.log('Final State:', currentState);

// Get session summary
const summary = session.getSummary();
console.log('Session Summary:', summary);
```

## Architecture

```
Agent CLI (Claude / Codex)
      ↓
Output Ingestion Layer
      ↓
Event Parser
      ↓
Canonical Event Layer
      ↓
State Reducer
      ↓
Session Runtime
      ├─ State API
      ├─ Event Stream
      └─ Summary API
```

## Data Models

### Canonical Event

Normalized event structure representing a single action or state change:

```typescript
interface CanonicalEvent {
  id: string;
  runId: string;
  stepId?: string;
  parentStepId?: string;
  source: 'claude' | 'codex';
  kind: CanonicalEventKind;
  ts: string;
  title: string;
  status?: 'running' | 'success' | 'failed';
  payload: Record<string, unknown>;
  raw?: RawEvent;
}
```

### Harness State

Current state of agent execution:

```typescript
interface HarnessState {
  runId: string;
  source: 'claude' | 'codex';
  phase: HarnessPhase;
  startedAt?: string;
  endedAt?: string;
  eventCount: number;
  messages: number;
  toolCalls: number;
  toolFailures: number;
  retries: number;
  approvalsPending: number;
  activeTools: string[];
  activeMcpServers: string[];
  activeSubagents: string[];
  touchedFiles: string[];
  writtenFiles: string[];
  readFiles: string[];
  recentCommands: string[];
  lastResult?: string;
  lastError?: string;
}
```

### Harness Summary

Summary of a session:

```typescript
interface HarnessSummary {
  runId: string;
  source: 'claude' | 'codex';
  durationMs?: number;
  totalEvents: number;
  totalToolCalls: number;
  totalFilesWritten: number;
  totalCommands: number;
  approvalsSeen: number;
  retries: number;
  completed: boolean;
  failed: boolean;
}
```

## Event Kinds

The system recognizes the following canonical event kinds:

- `session_start`: Session started
- `session_end`: Session ended
- `message`: Message from agent
- `tool_call`: Tool invocation
- `tool_result`: Tool execution result
- `bash`: Shell command execution
- `file_read`: File read operation
- `file_write`: File write operation
- `mcp_call`: MCP server call
- `approval_request`: Approval requested
- `approval_response`: Approval responded
- `subagent_start`: Subagent started
- `subagent_end`: Subagent ended
- `result`: Final result
- `error`: Error occurred
- `unknown`: Unknown event

## Harness Phases

The system tracks the following phases:

- `idle`: No activity
- `planning`: Planning phase
- `tooling`: Tool execution phase
- `editing`: File editing phase
- `testing`: Testing phase
- `awaiting_approval`: Waiting for approval
- `completed`: Execution completed
- `failed`: Execution failed

## Building

```bash
npm run build
```

This generates TypeScript definitions and compiled JavaScript in the `dist/` directory.

## License

ISC

## Author

Manus AI
