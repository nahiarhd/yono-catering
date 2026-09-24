"use client";

import { useState } from "react";
import { Card, Button } from "./ui";
import { id } from "@/lib/id";

export function WhatsAppShareCard({
  message,
  whatsappUrl,
  totalOrders,
}: {
  message: string;
  whatsappUrl: string;
  totalOrders: number;
}) {
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const t = id.whatsapp;

  async function handleCopy() {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(message);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = message;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Card className="border-2 border-black">
      <div className="flex items-center justify-between gap-2">
        <h2 className="neo-label text-base">{t.cardTitle}</h2>
        <span className="inline-block border-2 border-black bg-[var(--primary)] px-2 py-0.5 text-xs font-black uppercase">
          {totalOrders} Pesanan
        </span>
      </div>

      <p className="mt-1 text-xs text-[var(--text-muted)] font-medium">
        {t.cardDescription}
      </p>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="neo-btn flex-1 text-center font-black !bg-[#25D366] !text-black hover:brightness-105 active:translate-x-[2px] active:translate-y-[2px]"
        >
          {t.sendButton}
        </a>
        <Button
          type="button"
          onClick={handleCopy}
          className="flex-1 font-bold"
          aria-label={t.copyButton}
        >
          {copied ? t.copied : t.copyButton}
        </Button>
      </div>

      <div aria-live="polite" className="sr-only">
        {copied ? t.copied : ""}
      </div>

      <div className="mt-4 border-t-2 border-black pt-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-[var(--text-muted)]">
            {t.previewTitle}
          </p>
          <button
            type="button"
            onClick={() => setShowPreview((prev) => !prev)}
            className="text-xs font-bold underline hover:text-[var(--primary-dark,#ca8a04)] focus:outline-2 focus:outline-black"
          >
            {showPreview ? "Sembunyikan" : "Tampilkan teks"}
          </button>
        </div>

        {showPreview && (
          <div className="mt-2 border-2 border-black bg-[var(--surface-sunken)] p-3 text-xs font-mono">
            <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap break-words leading-relaxed select-all">
              {message}
            </pre>
          </div>
        )}
      </div>
    </Card>
  );
}
