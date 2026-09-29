"use client";

import { useState, useEffect, useActionState, useId } from "react";
import { recordMemberResponseAction, type ActionState } from "@/app/yono/actions";
import { TelegramPingButton } from "@/components/telegram-ping-button";
import { Button, Input } from "@/components/ui";
import { id } from "@/lib/id";

export interface PendingUser {
  id: string;
  name: string;
}

interface PendingMembersListProps {
  dateKey: string;
  menuDish: string;
  subDishes: string[];
  pendingUsers: PendingUser[];
}

export function PendingMembersList({
  dateKey,
  menuDish,
  subDishes,
  pendingUsers,
}: PendingMembersListProps) {
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const t = id.yono;

  if (pendingUsers.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 border-t-2 border-black pt-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="neo-label text-xs text-rose-700">
          {t.pendingList} ({pendingUsers.length} orang)
        </p>
        <TelegramPingButton
          dateKey={dateKey}
          pendingCount={pendingUsers.length}
        />
      </div>

      <p className="mt-1 text-xs text-[var(--text-muted)] font-medium">
        💡 {t.pendingHint}
      </p>

      <ul className="mt-2.5 flex flex-wrap gap-2">
        {pendingUsers.map((user) => (
          <li key={user.id}>
            <button
              type="button"
              onClick={() => setSelectedUser(user)}
              className="border-2 border-black bg-rose-100 hover:bg-rose-200 active:translate-y-0.5 px-3 py-1.5 text-xs font-bold transition-all shadow-[2px_2px_0px_0px_#000] flex items-center gap-1.5 cursor-pointer rounded-none min-h-[36px]"
              title={t.pendingBadgeTooltip(user.name)}
              aria-label={t.pendingBadgeTooltip(user.name)}
            >
              <span>{user.name}</span>
              <span className="text-[10px] bg-rose-200 border border-black px-1 rounded-none font-bold">
                ✎
              </span>
            </button>
          </li>
        ))}
      </ul>

      {selectedUser && (
        <RecordResponseModal
          user={selectedUser}
          dateKey={dateKey}
          menuDish={menuDish}
          subDishes={subDishes}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
}

function RecordResponseModal({
  user,
  dateKey,
  menuDish,
  subDishes,
  onClose,
}: {
  user: PendingUser;
  dateKey: string;
  menuDish: string;
  subDishes: string[];
  onClose: () => void;
}) {
  const [wants, setWants] = useState(true);
  const [selectedSubDish, setSelectedSubDish] = useState(subDishes[0] ?? "");
  const [note, setNote] = useState("");
  const noteId = useId();
  const t = id.yono;

  const [state, formAction, pending] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const res = await recordMemberResponseAction(prev, formData);
      if (res.ok) {
        onClose();
      }
      return res;
    },
    {}
  );

  // Close on Escape key press
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const notePresets = id.response.notePresets;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="record-modal-title"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="border-4 border-black bg-white shadow-[6px_6px_0px_0px_#000] p-5 max-w-md w-full relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b-2 border-black pb-3">
          <div>
            <h2 id="record-modal-title" className="neo-label text-base">
              {t.recordResponseTitle(user.name)}
            </h2>
            <p className="mt-0.5 text-xs text-[var(--text-muted)] font-medium">
              {t.recordResponseSubtitle(user.name, menuDish)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="border-2 border-black bg-stone-100 hover:bg-stone-200 w-8 h-8 flex items-center justify-center font-bold text-sm cursor-pointer"
            aria-label="Tutup modal"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form action={formAction} className="mt-4 flex flex-col gap-4">
          <input type="hidden" name="dateKey" value={dateKey} />
          <input type="hidden" name="userId" value={user.id} />
          <input type="hidden" name="wants" value={wants ? "yes" : "no"} />
          {wants && (
            <input type="hidden" name="subDish" value={selectedSubDish} />
          )}

          {/* Status Selection Cards */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
              Status Kehadiran Makan
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setWants(true)}
                className={`border-2 border-black p-3 text-left font-bold text-sm transition-all cursor-pointer min-h-[44px] flex items-center justify-between ${
                  wants
                    ? "bg-emerald-200 shadow-[3px_3px_0px_0px_#000]"
                    : "bg-white hover:bg-stone-50 opacity-70"
                }`}
              >
                <span>🍽️ {t.recordEating}</span>
                {wants && <span className="font-black">✓</span>}
              </button>

              <button
                type="button"
                onClick={() => setWants(false)}
                className={`border-2 border-black p-3 text-left font-bold text-sm transition-all cursor-pointer min-h-[44px] flex items-center justify-between ${
                  !wants
                    ? "bg-rose-200 shadow-[3px_3px_0px_0px_#000]"
                    : "bg-white hover:bg-stone-50 opacity-70"
                }`}
              >
                <span>❌ {t.recordNotEating}</span>
                {!wants && <span className="font-black">✓</span>}
              </button>
            </div>
          </div>

          {/* Sub-menu / Variant Selection if wants is true and subDishes exist */}
          {wants && subDishes.length > 0 && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                {id.response.chooseVariant}
              </label>
              <div className="flex flex-wrap gap-2">
                {subDishes.map((variant) => {
                  const isSelected = selectedSubDish === variant;
                  return (
                    <button
                      key={variant}
                      type="button"
                      onClick={() => setSelectedSubDish(variant)}
                      className={`border-2 border-black px-3 py-1.5 text-xs font-bold transition-all cursor-pointer min-h-[36px] ${
                        isSelected
                          ? "bg-[var(--primary)] shadow-[2px_2px_0px_0px_#000]"
                          : "bg-white hover:bg-stone-100"
                      }`}
                    >
                      {variant}
                      {isSelected ? " ✓" : ""}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Optional Note */}
          <div>
            <label
              htmlFor={noteId}
              className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1"
            >
              {id.response.noteLabel}
            </label>
            <Input
              id={noteId}
              name="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="contoh: pedas, bungkus, tanpa sayur"
              className="w-full text-sm min-h-[40px]"
            />

            {/* Quick Note Presets */}
            <div className="mt-2 flex flex-wrap gap-1.5 items-center">
              <span className="text-[11px] font-semibold text-[var(--text-muted)]">
                {id.response.noteQuick}
              </span>
              {notePresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() =>
                    setNote((prev) => (prev ? `${prev}, ${preset}` : preset))
                  }
                  className="border border-black bg-stone-100 hover:bg-stone-200 px-2 py-0.5 text-[11px] font-bold cursor-pointer"
                >
                  +{preset}
                </button>
              ))}
            </div>
          </div>

          {state?.error && (
            <p className="border-2 border-black bg-red-100 p-2 text-xs font-bold text-[var(--danger)]">
              {state.error}
            </p>
          )}

          {/* Action Buttons */}
          <div className="mt-2 flex items-center justify-end gap-2 border-t-2 border-black pt-3">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={pending}
              className="min-h-[44px] text-xs font-bold"
            >
              {id.settings.cancel}
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={pending || (wants && subDishes.length > 0 && !selectedSubDish)}
              className="min-h-[44px] text-xs font-bold"
            >
              {pending ? t.recordSaving : t.recordSave}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
