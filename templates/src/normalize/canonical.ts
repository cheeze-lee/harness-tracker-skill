/**
 * Canonical Event Normalization Layer
 * 
 * This module normalizes raw events from different sources into a unified CanonicalEvent format.
 */

import { CanonicalEvent, RawEvent, EventSource, CanonicalEventKind } from '../types';

/**
 * Generate a unique ID
 */
function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

/**
 * Normalize a raw event into a canonical event
 */
export function normalizeEvent(
  rawEvent: RawEvent,
  runId: string,
  stepId?: string,
  parentStepId?: string
): CanonicalEvent {
  const kind = inferEventKind(rawEvent);
  const title = inferEventTitle(rawEvent, kind);
  const status = inferEventStatus(rawEvent, kind);
  const payload = extractPayload(rawEvent, kind);

  return {
    id: generateId(),
    runId,
    stepId,
    parentStepId,
    source: rawEvent.source,
    kind,
    ts: rawEvent.ts,
    title,
    status,
    payload,
    raw: rawEvent,
  };
}

/**
 * Infer the event kind from raw event
 */
function inferEventKind(rawEvent: RawEvent): CanonicalEventKind {
  const line = rawEvent.line.toLowerCase();
  const data = rawEvent.data as Record<string, unknown>;

  // Check for known patterns
  if (line.includes('session start') || data?.event === 'session_start') {
    return 'session_start';
  }
  if (line.includes('session end') || data?.event === 'session_end') {
    return 'session_end';
  }
  if (line.includes('tool call') || data?.event === 'tool_call') {
    return 'tool_call';
  }
  if (line.includes('tool result') || data?.event === 'tool_result') {
    return 'tool_result';
  }
  if (line.includes('bash') || line.includes('shell') || data?.event === 'bash') {
    return 'bash';
  }
  if (line.includes('file write') || data?.event === 'file_write') {
    return 'file_write';
  }
  if (line.includes('file read') || data?.event === 'file_read') {
    return 'file_read';
  }
  if (line.includes('mcp') || data?.event === 'mcp_call') {
    return 'mcp_call';
  }
  if (line.includes('approval') && line.includes('request')) {
    return 'approval_request';
  }
  if (line.includes('approval') && line.includes('response')) {
    return 'approval_response';
  }
  if (line.includes('subagent') && line.includes('start')) {
    return 'subagent_start';
  }
  if (line.includes('subagent') && line.includes('end')) {
    return 'subagent_end';
  }
  if (line.includes('result') || data?.event === 'result') {
    return 'result';
  }
  if (line.includes('error') || data?.event === 'error') {
    return 'error';
  }
  if (line.includes('message') || data?.event === 'message') {
    return 'message';
  }

  return 'unknown';
}

/**
 * Infer event title from raw event
 */
function inferEventTitle(rawEvent: RawEvent, kind: CanonicalEventKind): string {
  const data = rawEvent.data as Record<string, unknown>;

  switch (kind) {
    case 'session_start':
      return 'Session Started';
    case 'session_end':
      return 'Session Ended';
    case 'tool_call':
      return `Tool Call: ${data?.tool || 'unknown'}`;
    case 'tool_result':
      return `Tool Result: ${data?.tool || 'unknown'}`;
    case 'bash':
      return `Bash: ${data?.command || 'unknown'}`;
    case 'file_write':
      return `File Write: ${data?.path || 'unknown'}`;
    case 'file_read':
      return `File Read: ${data?.path || 'unknown'}`;
    case 'mcp_call':
      return `MCP Call: ${data?.server || 'unknown'}`;
    case 'approval_request':
      return 'Approval Requested';
    case 'approval_response':
      return 'Approval Responded';
    case 'subagent_start':
      return `Subagent Started: ${data?.name || 'unknown'}`;
    case 'subagent_end':
      return `Subagent Ended: ${data?.name || 'unknown'}`;
    case 'result':
      return 'Result';
    case 'error':
      return `Error: ${data?.message || 'unknown'}`;
    case 'message':
      return 'Message';
    default:
      return 'Unknown Event';
  }
}

/**
 * Infer event status from raw event
 */
function inferEventStatus(rawEvent: RawEvent, kind: CanonicalEventKind) {
  const data = rawEvent.data as Record<string, unknown>;

  if (data?.status) {
    return data.status as 'running' | 'success' | 'failed';
  }

  if (kind === 'error') {
    return 'failed';
  }

  if (kind === 'result' || kind === 'tool_result') {
    return 'success';
  }

  return undefined;
}

/**
 * Extract payload from raw event
 */
function extractPayload(rawEvent: RawEvent, kind: CanonicalEventKind): Record<string, unknown> {
  const data = rawEvent.data as Record<string, unknown>;

  return {
    ...data,
    kind,
    source: rawEvent.source,
  };
}
