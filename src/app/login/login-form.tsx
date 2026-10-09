"use client";

import Image from "next/image";
import { useActionState, useState, useRef } from "react";
import type { Role } from "@prisma/client";
import { loginAction } from "./actions";
import { id } from "@/lib/id";
import { Button, Input, Label, Select } from "@/components/ui";

export type LoginUserItem = {
  name: string;
  role: Role;
  groupName?: string | null;
};

export function LoginForm({
  users,
  groups = [],
  yonoName,
}: {
  users: LoginUserItem[];
  groups?: string[];
  yonoName?: string;
}) {
  const [state, action, pending] = useActionState(loginAction, {});
  const [selectedName, setSelectedName] = useState("");
  const [selectedGroupFilter, setSelectedGroupFilter] = useState("ALL");
  const pinInputRef = useRef<HTMLInputElement>(null);
  const t = id.login;

  if (users.length === 0) {
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

  // Active groups that actually have members
  const activeGroups = groups.filter((g) => users.some((u) => u.groupName === g));
  const ungroupedUsers = users.filter((u) => !u.groupName);

  // Group filter pills data
  const filterPills = [
    { key: "ALL", label: t.filterAllGroups, count: users.length },
    ...activeGroups.map((g) => ({
      key: g,
      label: g,
      count: users.filter((u) => u.groupName === g).length,
    })),
    ...(ungroupedUsers.length > 0 && activeGroups.length > 0
      ? [{ key: "NONE", label: t.noGroup, count: ungroupedUsers.length }]
      : []),
  ];

  // Users filtered by group pill
  const filteredUsers =
    selectedGroupFilter === "ALL"
      ? users
      : selectedGroupFilter === "NONE"
        ? ungroupedUsers
        : users.filter((u) => u.groupName === selectedGroupFilter);

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
              <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                <Label htmlFor="name">{t.who}</Label>
                {yonoName && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedGroupFilter("ALL");
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

              {/* Group Filter Pills if groups exist */}
              {activeGroups.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {filterPills.map((pill) => {
                    const isSelected = selectedGroupFilter === pill.key;
                    return (
                      <button
                        key={pill.key}
                        type="button"
                        onClick={() => setSelectedGroupFilter(pill.key)}
                        className={`text-[11px] font-extrabold px-2 py-0.5 border-2 border-black transition-colors ${
                          isSelected
                            ? "bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.25)]"
                            : "bg-stone-50 text-stone-800 hover:bg-stone-100"
                        }`}
                      >
                        {pill.label} ({pill.count})
                      </button>
                    );
                  })}
                </div>
              )}

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

                {selectedGroupFilter === "ALL" && activeGroups.length > 0 ? (
                  <>
                    {/* Yono kitchen option at top if present */}
                    {yonoName && (
                      <option value={yonoName}>
                        ⭐ {yonoName} (Koki)
                      </option>
                    )}

                    {/* Optgroups per active group */}
                    {activeGroups.map((grp) => {
                      const grpUsers = users.filter(
                        (u) => u.groupName === grp && u.name !== yonoName
                      );
                      if (grpUsers.length === 0) return null;
                      return (
                        <optgroup key={grp} label={`📁 ${grp}`}>
                          {grpUsers.map((u) => (
                            <option key={u.name} value={u.name}>
                              {u.name}
                            </option>
                          ))}
                        </optgroup>
                      );
                    })}

                    {/* Ungrouped users */}
                    {ungroupedUsers.filter((u) => u.name !== yonoName).length > 0 && (
                      <optgroup label={t.noGroup}>
                        {ungroupedUsers
                          .filter((u) => u.name !== yonoName)
                          .map((u) => (
                            <option key={u.name} value={u.name}>
                              {u.name}
                            </option>
                          ))}
                      </optgroup>
                    )}
                  </>
                ) : (
                  /* Filtered specific group or flat list */
                  filteredUsers.map((u) => (
                    <option key={u.name} value={u.name}>
                      {u.name === yonoName ? `⭐ ${u.name} (Koki)` : u.name}
                    </option>
                  ))
                )}
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