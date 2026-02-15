/**
 * WebSocket Integration for Real-time Automation Updates
 * Provides live notifications for task completion, compliance updates, and automation events
 */

import { io, Socket } from 'socket.io-client';
import { useEffect, useRef, useCallback } from 'react';

const WS_URL = process.env.VITE_WS_URL || 'http://localhost:3000';

// Event types
export const AUTOMATION_EVENTS = {
  // Task events
  TASK_COMPLETED: 'task:completed',
  TASK_CREATED: 'task:created',
  TASK_STATUS_CHANGED: 'task:statusChanged',

  // Compliance events
  COMPLIANCE_UPDATED: 'compliance:updated',
  COMPLIANCE_STREAK_MILESTONE: 'compliance:streakMilestone',

  // Readiness events
  READINESS_CALCULATED: 'readiness:calculated',
  READINESS_CHANGED: 'readiness:changed',

  // Automation events
  AUTOMATION_TRIGGERED: 'automation:triggered',
  AUTOMATION_COMPLETED: 'automation:completed',
  AUTOMATION_FAILED: 'automation:failed',

  // Plan events
  PLAN_GENERATED: 'plan:generated',
  PLAN_EXECUTED: 'plan:executed',
};

type EventCallback = (data: any) => void;

class WebSocketManager {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(userId: string, token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(WS_URL, {
          auth: {
            token,
            userId,
          },
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: this.maxReconnectAttempts,
          transports: ['websocket', 'polling'],
        });

        this.socket.on('connect', () => {
          console.log('✅ WebSocket connected');
          this.reconnectAttempts = 0;
          resolve();
        });

        this.socket.on('disconnect', () => {
          console.log('❌ WebSocket disconnected');
        });

        this.socket.on('error', error => {
          console.error('WebSocket error:', error);
          reject(error);
        });

        // Register all event listeners
        Object.values(AUTOMATION_EVENTS).forEach(event => {
          this.socket?.on(event, (data: any) => {
            this.emit(event, data);
          });
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event: string, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  private emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

// Singleton instance
const wsManager = new WebSocketManager();

/**
 * Hook: Use WebSocket connection
 */
export function useWebSocket(token?: string, userId?: string) {
  const isInitialized = useRef(false);

  useEffect(() => {
    if (!token || !userId || isInitialized.current) return;

    isInitialized.current = true;

    wsManager
      .connect(userId, token)
      .catch(error => {
        console.error('Failed to connect to WebSocket:', error);
      });

    return () => {
      // Don't disconnect on unmount, keep connection alive
      // wsManager.disconnect();
    };
  }, [token, userId]);

  return {
    on: wsManager.on.bind(wsManager),
    disconnect: wsManager.disconnect.bind(wsManager),
    isConnected: wsManager.isConnected.bind(wsManager),
  };
}

/**
 * Hook: Listen to specific automation event
 */
export function useAutomationEvent(event: string, callback: EventCallback) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const unsubscribe = wsManager.on(event, (data: any) => {
      callbackRef.current(data);
    });

    return unsubscribe;
  }, [event]);
}

/**
 * Hook: Listen to task completion events
 */
export function useTaskCompletedListener(onTaskCompleted: (taskId: string) => void) {
  useAutomationEvent(AUTOMATION_EVENTS.TASK_COMPLETED, (data: { taskId: string }) => {
    onTaskCompleted(data.taskId);
  });
}

/**
 * Hook: Listen to compliance updates
 */
export function useComplianceUpdatedListener(
  onComplianceUpdated: (compliance: any) => void
) {
  useAutomationEvent(AUTOMATION_EVENTS.COMPLIANCE_UPDATED, onComplianceUpdated);
}

/**
 * Hook: Listen to readiness calculations
 */
export function useReadinessCalculatedListener(onReadinessCalculated: (readiness: any) => void) {
  useAutomationEvent(AUTOMATION_EVENTS.READINESS_CALCULATED, onReadinessCalculated);
}

/**
 * Hook: Listen to plan generation
 */
export function usePlanGeneratedListener(onPlanGenerated: (plan: any) => void) {
  useAutomationEvent(AUTOMATION_EVENTS.PLAN_GENERATED, onPlanGenerated);
}

export default wsManager;
