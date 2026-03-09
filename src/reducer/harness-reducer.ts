/**
 * Harness State Reducer
 * 
 * This module implements the state reducer that folds canonical events into harness state.
 */

import { CanonicalEvent, HarnessState, HarnessPhase, EventSource } from '../types';

/**
 * Create initial harness state
 */
export function createInitialState(runId: string, source: EventSource): HarnessState {
  return {
    runId,
    source,
    phase: 'idle',
    eventCount: 0,
    messages: 0,
    toolCalls: 0,
    toolFailures: 0,
    retries: 0,
    approvalsPending: 0,
    activeTools: [],
    activeMcpServers: [],
    activeSubagents: [],
    touchedFiles: [],
    writtenFiles: [],
    readFiles: [],
    recentCommands: [],
  };
}

/**
 * Reduce a canonical event into the harness state
 */
export function reduceEvent(state: HarnessState, event: CanonicalEvent): HarnessState {
  const newState = { ...state };
  newState.eventCount += 1;

  switch (event.kind) {
    case 'session_start':
      newState.phase = 'planning';
      newState.startedAt = event.ts;
      break;

    case 'session_end':
      newState.phase = 'completed';
      newState.endedAt = event.ts;
      break;

    case 'message':
      newState.messages += 1;
      break;

    case 'tool_call':
      newState.phase = 'tooling';
      newState.toolCalls += 1;
      const toolName = (event.payload?.tool as string) || 'unknown';
      if (!newState.activeTools.includes(toolName)) {
        newState.activeTools.push(toolName);
      }
      break;

    case 'tool_result':
      if (event.status === 'failed') {
        newState.toolFailures += 1;
        newState.lastError = event.payload?.error as string;
      }
      break;

    case 'bash':
      newState.phase = 'tooling';
      const command = event.payload?.command as string;
      if (command) {
        newState.recentCommands.push(command);
        // Keep only last 10 commands
        if (newState.recentCommands.length > 10) {
          newState.recentCommands.shift();
        }
      }
      break;

    case 'file_write':
      newState.phase = 'editing';
      const writePath = event.payload?.path as string;
      if (writePath) {
        newState.writtenFiles.push(writePath);
        if (!newState.touchedFiles.includes(writePath)) {
          newState.touchedFiles.push(writePath);
        }
      }
      break;

    case 'file_read':
      const readPath = event.payload?.path as string;
      if (readPath) {
        newState.readFiles.push(readPath);
        if (!newState.touchedFiles.includes(readPath)) {
          newState.touchedFiles.push(readPath);
        }
      }
      break;

    case 'mcp_call':
      const mcpServer = event.payload?.server as string;
      if (mcpServer && !newState.activeMcpServers.includes(mcpServer)) {
        newState.activeMcpServers.push(mcpServer);
      }
      break;

    case 'approval_request':
      newState.phase = 'awaiting_approval';
      newState.approvalsPending += 1;
      break;

    case 'approval_response':
      newState.approvalsPending = Math.max(0, newState.approvalsPending - 1);
      if (newState.approvalsPending === 0) {
        newState.phase = 'tooling'; // Resume to tooling phase
      }
      break;

    case 'subagent_start':
      const subagentName = event.payload?.name as string;
      if (subagentName && !newState.activeSubagents.includes(subagentName)) {
        newState.activeSubagents.push(subagentName);
      }
      break;

    case 'subagent_end':
      const endedSubagent = event.payload?.name as string;
      if (endedSubagent) {
        newState.activeSubagents = newState.activeSubagents.filter((s) => s !== endedSubagent);
      }
      break;

    case 'result':
      newState.phase = 'completed';
      newState.lastResult = event.payload?.result as string;
      newState.endedAt = event.ts;
      break;

    case 'error':
      newState.phase = 'failed';
      newState.lastError = event.payload?.message as string;
      newState.endedAt = event.ts;
      break;

    default:
      // Handle unknown events
      break;
  }

  return newState;
}

/**
 * Replay events to reconstruct state
 */
export function replayEvents(
  runId: string,
  source: EventSource,
  events: CanonicalEvent[]
): HarnessState {
  let state = createInitialState(runId, source);

  for (const event of events) {
    state = reduceEvent(state, event);
  }

  return state;
}
