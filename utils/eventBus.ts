type EventHandler<T = any> = (payload: T) => void;

class EventBus {
  private listeners: Map<string, Set<EventHandler>> = new Map();

  on<T = any>(eventName: string, handler: EventHandler<T>): () => void {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    const set = this.listeners.get(eventName)!;
    set.add(handler as EventHandler);
    return () => this.off(eventName, handler);
  }

  off<T = any>(eventName: string, handler: EventHandler<T>): void {
    const set = this.listeners.get(eventName);
    if (set) {
      set.delete(handler as EventHandler);
      if (set.size === 0) {
        this.listeners.delete(eventName);
      }
    }
  }

  emit<T = any>(eventName: string, payload?: T): void {
    const set = this.listeners.get(eventName);
    if (set) {
      // Copy to array to avoid mutation during iteration
      Array.from(set).forEach((handler) => {
        try {
          handler(payload);
        } catch {
          // no-op
        }
      });
    }
  }
}

export const eventBus = new EventBus();

