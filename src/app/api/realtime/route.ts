import { realtime } from "@/lib/realtime";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const encoder = new TextEncoder();
  let cleanup: (() => void) | undefined;
  let heartbeat: NodeJS.Timeout | undefined;

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection event
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "connected" })}\n\n`));

      cleanup = realtime.subscribe(({ event, payload }) => {
        try {
          const message = `event: ${event}\ndata: ${JSON.stringify(payload ?? {})}\n\n`;
          controller.enqueue(encoder.encode(message));
        } catch {
          // Stream error or client disconnect
        }
      });

      // Heartbeat every 20 seconds to keep connection alive
      heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: keepalive\n\n`));
        } catch {
          clearInterval(heartbeat);
        }
      }, 20000);

      // Clean up when client disconnects
      request.signal.addEventListener("abort", () => {
        if (heartbeat) clearInterval(heartbeat);
        if (cleanup) cleanup();
        try {
          controller.close();
        } catch {}
      });
    },
    cancel() {
      if (heartbeat) clearInterval(heartbeat);
      if (cleanup) cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
