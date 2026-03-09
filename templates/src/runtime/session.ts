/**
 * Session Runtime
 * 
 * This module manages a single agent execution session and provides APIs for state and event queries.
 */

import {
  CanonicalEvent,
  HarnessState,
  HarnessSummary,
  EventListener,
  StateChangeListener,
  HarnessSession,
  RawEvent,
  EventSource,
} from '../types';
import { normalizeEvent } from '../normalize/canonical';
import { createInitialState, reduceEvent, replayEvents } from '../reducer/harness-reducer';

/**
 * Implementation of HarnessSession
 */
export class HarnessSessionImpl implements HarnessSession {
  private runId: string;
  private source: EventSource;
  private events: CanonicalEvent[] = [];
  private state: HarnessState;
  private eventListeners: EventListener[] = [];
  private stateChangeListeners: StateChangeListener[] = [];
  private startTime: number;

  constructor(source: EventSource) {
    this.runId = `run-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    this.source = source;
    this.state = createInitialState(this.runId, source);
    this.startTime = Date.now();
  }

  /**
   * Push a line of output
   */
  pushLine(line: string): void {
    const rawEvent: RawEvent = {
      source: this.source,
      ts: new Date().toISOString(),
      line,
      data: { line },
    };

    this.processRawEvent(rawEvent);
  }

  /**
   * Push raw data
   */
  pushRaw(data: unknown): void {
    const rawEvent: RawEvent = {
      source: this.source,
      ts: new Date().toISOString(),
      line: JSON.stringify(data),
      data,
    };

    this.processRawEvent(rawEvent);
  }

  /**
   * Get current state
   */
  getState(): HarnessState {
    return { ...this.state };
  }

  /**
   * Get all events
   */
  getEvents(): CanonicalEvent[] {
    return [...this.events];
  }

  /**
   * Get summary
   */
  getSummary(): HarnessSummary {
    const durationMs = Date.now() - this.startTime;
    const toolCalls = this.events.filter((e) => e.kind === 'tool_call').length;
    const filesWritten = this.events.filter((e) => e.kind === 'file_write').length;
    const commands = this.events.filter((e) => e.kind === 'bash').length;
    const approvals = this.events.filter(
      (e) => e.kind === 'approval_request' || e.kind === 'approval_response'
    ).length;

    return {
      runId: this.runId,
      source: this.source,
      durationMs,
      totalEvents: this.events.length,
      totalToolCalls: toolCalls,
      totalFilesWritten: filesWritten,
      totalCommands: commands,
      approvalsSeen: approvals,
      retries: this.state.retries,
      completed: this.state.phase === 'completed',
      failed: this.state.phase === 'failed',
    };
  }

  /**
   * Subscribe to events
   */
  onEvent(listener: EventListener): void {
    this.eventListeners.push(listener);
  }

  /**
   * Subscribe to state changes
   */
  onStateChange(listener: StateChangeListener): void {
    this.stateChangeListeners.push(listener);
  }

  /**
   * Process raw event
   */
  private processRawEvent(rawEvent: RawEvent): void {
    const canonicalEvent = normalizeEvent(rawEvent, this.runId);
    this.events.push(canonicalEvent);

    // Update state
    const previousPhase = this.state.phase;
    this.state = reduceEvent(this.state, canonicalEvent);

    // Notify event listeners
    this.eventListeners.forEach((listener) => {
      try {
        listener(canonicalEvent);
      } catch (error) {
        console.error('Error in event listener:', error);
      }
    });

    // Notify state change listeners if phase changed
    if (previousPhase !== this.state.phase) {
      this.stateChangeListeners.forEach((listener) => {
        try {
          listener(this.getState());
        } catch (error) {
          console.error('Error in state change listener:', error);
        }
      });
    }
  }
}

/**
 * Create a new harness session
 */
export function createSession(source: EventSource): HarnessSession {
  return new HarnessSessionImpl(source);
}
