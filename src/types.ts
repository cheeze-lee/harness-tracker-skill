/**
 * Harness Tracker Skill - Type Definitions
 * 
 * This file defines all core types and interfaces for the harness reconstruction system.
 */

/**
 * Event source type
 */
export type EventSource = 'claude' | 'codex';

/**
 * Canonical event kind
 */
export type CanonicalEventKind =
  | 'session_start'
  | 'session_end'
  | 'message'
  | 'tool_call'
  | 'tool_result'
  | 'bash'
  | 'file_read'
  | 'file_write'
  | 'mcp_call'
  | 'approval_request'
  | 'approval_response'
  | 'subagent_start'
  | 'subagent_end'
  | 'result'
  | 'error'
  | 'unknown';

/**
 * Event status
 */
export type EventStatus = 'running' | 'success' | 'failed';

/**
 * Harness phase
 */
export type HarnessPhase =
  | 'idle'
  | 'planning'
  | 'tooling'
  | 'editing'
  | 'testing'
  | 'awaiting_approval'
  | 'completed'
  | 'failed';

/**
 * Raw event from agent output
 */
export interface RawEvent {
  source: EventSource;
  ts: string;
  line: string;
  data: unknown;
}

/**
 * Canonical event - normalized event structure
 */
export interface CanonicalEvent {
  id: string;
  runId: string;
  stepId?: string;
  parentStepId?: string;
  source: EventSource;
  kind: CanonicalEventKind;
  ts: string;
  title: string;
  status?: EventStatus;
  payload: Record<string, unknown>;
  raw?: RawEvent;
}

/**
 * Harness state - current state of agent execution
 */
export interface HarnessState {
  runId: string;
  source: EventSource;
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

/**
 * Harness summary - summary of a session
 */
export interface HarnessSummary {
  runId: string;
  source: EventSource;
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

/**
 * Event listener callback
 */
export type EventListener = (event: CanonicalEvent) => void;

/**
 * State change listener callback
 */
export type StateChangeListener = (state: HarnessState) => void;

/**
 * Harness session interface
 */
export interface HarnessSession {
  pushLine(line: string): void;
  pushRaw(data: unknown): void;
  getState(): HarnessState;
  getEvents(): CanonicalEvent[];
  getSummary(): HarnessSummary;
  onEvent(listener: EventListener): void;
  onStateChange(listener: StateChangeListener): void;
}
