"use client";

import Image from "next/image";
import { useActionState, useState, useRef } from "react";
import { loginAction } from "./actions";
import { id } from "@/lib/id";
import { Button, Input, Label, Select } from "@/components/ui";

export function LoginForm({
  names,
  yonoName,
}: {
  names: string[];
  yonoName?: string;
}) {
  const [state, action, pending] = useActionState(loginAction, {});
  const [selectedName, setSelectedName] = useState("");
  const pinInputRef = useRef<HTMLInputElement>(null);
  const t = id.login;

  if (names.length === 0) {
    return (
      <div className="login-page">
        <div className="login-wrap">
          <div className="login-form-card">
            <p className="font-extrabold">{t.noUsers}</p>
            <p className="mt-2 text-sm font-semibold text-[var(--text-muted)]">{t.seedHint}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-wrap">
        <figure className="login-portrait">
          <div className="login-portrait-frame">
            <Image
              src="/yono.jpg"
              alt={t.avatarAlt}
              fill
              sizes="(max-width: 480px) 72vw, 240px"
              className="login-portrait-img"
              priority
            />
          </div>
          <figcaption className="login-portrait-name">{t.avatarAlt}</figcaption>
        </figure>

        <header className="login-intro">
          <span className="login-badge">{id.app.tagline}</span>
          <h1>{t.heading}</h1>
          <p>{t.subtitle}</p>
        </header>

        <section className="login-form-card" aria-labelledby="login-heading">
          <h2 id="login-heading" className="sr-only">
            {t.title}
          </h2>

          <form action={action} className="flex flex-col gap-5">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <Label htmlFor="name">{t.who}</Label>
                {yonoName && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedName(yonoName);
                      pinInputRef.current?.focus();
                    }}
                    className="text-xs font-bold bg-amber-100 hover:bg-amber-200 border border-black px-2 py-0.5 cursor-pointer flex items-center gap-1 transition-colors"
                    title={`Pilih langsung ${yonoName}`}
                  >
                    👨‍🍳 Saya {yonoName}
                  </button>
                )}
              </div>
              <Select
                id="name"
                name="name"
                required
                value={selectedName}
                onChange={(e) => setSelectedName(e.target.value)}
              >
                <option value="" disabled>
                  {t.pickName}
                </option>
                {names.map((name) => (
                  <option key={name} value={name}>
                    {name === yonoName ? `⭐ ${name} (Koki)` : name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label htmlFor="pin">{t.pin}</Label>
              <Input
                ref={pinInputRef}
                id="pin"
                name="pin"
                type="password"
                inputMode="numeric"
                autoComplete="current-password"
                placeholder="••••"
                required
                className="login-pin"
              />
            </div>

            {state.error && (
              <p className="login-error" role="alert">
                {state.error}
              </p>
            )}

            <Button type="submit" variant="primary" disabled={pending} className="login-submit">
              {pending ? t.submitting : t.submit}
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}