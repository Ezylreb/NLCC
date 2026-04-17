/**
 * Event Bus
 * Central pub/sub system for handling events asynchronously
 */

import type { Event, EventHandler, EventType } from './types';

export class EventBus {
  private static instance: EventBus;
  private handlers: Map<EventType, EventHandler[]> = new Map();
  private eventQueue: Event[] = [];
  private isProcessing: boolean = false;
  private maxRetries: number = 3;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Subscribe a handler to an event type
   */
  subscribe(eventType: EventType, handler: EventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
  }

  /**
   * Emit an event asynchronously
   */
  async emit(event: Event): Promise<void> {
    this.eventQueue.push(event);

    // Start processing queue if not already running
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  /**
   * Emit an event synchronously (for critical operations)
   */
  async emitSync(event: Event): Promise<void> {
    const handlers = this.handlers.get(event.type) || [];

    for (const handler of handlers) {
      if (handler.canHandle(event)) {
        try {
          await handler.handle(event);
        } catch (error) {
          console.error(`Error handling event ${event.type}:`, error);
        }
      }
    }
  }

  /**
   * Process event queue asynchronously
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.eventQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift()!;

      const handlers = this.handlers.get(event.type) || [];

      for (const handler of handlers) {
        if (handler.canHandle(event)) {
          await this.executeHandler(handler, event);
        }
      }
    }

    this.isProcessing = false;
  }

  /**
   * Execute handler with retry logic
   */
  private async executeHandler(handler: EventHandler, event: Event, attempt: number = 0): Promise<void> {
    try {
      await handler.handle(event);
    } catch (error) {
      console.error(`Error handling event ${event.type} (attempt ${attempt + 1}):`, error);

      // Retry with exponential backoff
      if (attempt < this.maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s, 8s
        await new Promise((resolve) => setTimeout(resolve, delay));
        await this.executeHandler(handler, event, attempt + 1);
      }
    }
  }

  /**
   * Get handlers for event type
   */
  getHandlers(eventType: EventType): EventHandler[] {
    return this.handlers.get(eventType) || [];
  }

  /**
   * Clear all handlers (for testing)
   */
  clear(): void {
    this.handlers.clear();
    this.eventQueue = [];
    this.isProcessing = false;
  }

  /**
   * Get queue size (for monitoring)
   */
  getQueueSize(): number {
    return this.eventQueue.length;
  }
}

// Export singleton instance
export const eventBus = EventBus.getInstance();

export default eventBus;
