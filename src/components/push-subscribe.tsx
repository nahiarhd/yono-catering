"use client";

import { useEffect, useState } from "react";
import { id } from "@/lib/id";
import { Button } from "./ui";

function initialStatus(): "idle" | "unsupported" {
  if (typeof window === "undefined") return "idle";
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return "unsupported";
  return "idle";
}

export function PushSubscribe({ onSave }: { onSave: (sub: PushSubscriptionJSON) => Promise<void> }) {
  const [status, setStatus] = useState<"idle" | "ready" | "done" | "unsupported">(initialStatus);

  useEffect(() => {
    if (status === "unsupported" || status === "done") return;
    navigator.serviceWorker.register("/sw.js").then(() => setStatus("ready"));
  }, [status]);

  if (status === "unsupported") return null;

  if (status === "done") {
    return <p className="text-sm font-semibold text-[var(--success)]">{id.home.pushOn}</p>;
  }

  return (
    <Button
      type="button"
      variant="ghost"
      disabled={status !== "ready"}
      onClick={async () => {
        const reg = await navigator.serviceWorker.ready;
        const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!key) return;
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(key),
        });
        await onSave(sub.toJSON());
        setStatus("done");
      }}
    >
      {id.home.pushEnable}
    </Button>
  );
}

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}