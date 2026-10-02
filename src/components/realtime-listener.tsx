"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

export function RealtimeListener() {
  const router = useRouter();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  // No session on /login: the stream would redirect and retry every 4s
  const isLoginPage = usePathname() === "/login";

  useEffect(() => {
    if (isLoginPage) return;
    let eventSource: EventSource | null = null;
    let reconnectTimer: NodeJS.Timeout | null = null;
    let isUnmounted = false;

    function connect() {
      if (isUnmounted) return;

      try {
        eventSource = new EventSource("/api/realtime");

        const triggerRefresh = () => {
          if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
          }
          debounceTimerRef.current = setTimeout(() => {
            router.refresh();
          }, 400);
        };

        eventSource.addEventListener("revalidate", triggerRefresh);

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "revalidate") {
              triggerRefresh();
            }
          } catch {
            // Ignore parse errors on raw heartbeat/pings
          }
        };

        eventSource.onerror = () => {
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          if (!isUnmounted && !reconnectTimer) {
            reconnectTimer = setTimeout(() => {
              reconnectTimer = null;
              connect();
            }, 4000);
          }
        };
      } catch {
        if (!isUnmounted && !reconnectTimer) {
          reconnectTimer = setTimeout(() => {
            reconnectTimer = null;
            connect();
          }, 4000);
        }
      }
    }

    connect();

    return () => {
      isUnmounted = true;
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [router, isLoginPage]);

  return null;
}
