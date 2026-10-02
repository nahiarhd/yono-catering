type RealtimeCallback = (data: { event: string; payload?: unknown }) => void;

class RealtimeHub {
  private listeners: Set<RealtimeCallback> = new Set();

  subscribe(callback: RealtimeCallback): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  broadcast(event: string = "revalidate", payload?: unknown) {
    for (const listener of this.listeners) {
      try {
        listener({ event, payload });
      } catch (err) {
        console.error("Error in realtime listener:", err);
      }
    }
  }
}

const globalForRealtime = globalThis as unknown as {
  realtimeHub?: RealtimeHub;
};

export const realtime = globalForRealtime.realtimeHub ?? new RealtimeHub();
globalForRealtime.realtimeHub = realtime;

export function broadcastRealtime(event: string = "revalidate", payload?: unknown) {
  realtime.broadcast(event, payload);
}
