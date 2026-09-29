"use client";

import { useActionState, useId, useState } from "react";
import type { Role } from "@prisma/client";
import {
  addMemberAction,
  updateRoleAction,
  updateTelegramIdAction,
  resetPinAction,
  removeMemberAction,
  type ActionState,
} from "./actions";
import { id } from "@/lib/id";
import { Button, Input, Card } from "@/components/ui";

type UserItem = {
  id: string;
  name: string;
  role: Role;
  telegramChatId?: string | null;
  createdAt: string;
};

export function UsersTable({
  users,
  currentUserId,
}: {
  users: UserItem[];
  currentUserId: string;
}) {
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const t = id.users;

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Search and Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex-1">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full text-sm"
          />
        </div>
        <Button
          type="button"
          variant={showAddForm ? "ghost" : "primary"}
          onClick={() => setShowAddForm((v) => !v)}
          className="whitespace-nowrap min-h-[44px]"
        >
          {showAddForm ? "Tutup Form" : `+ ${t.addUser}`}
        </Button>
      </div>

      {/* Add User Form Section */}
      {showAddForm && (
        <Card className="border-2 border-black bg-amber-50">
          <AddUserForm onSuccess={() => setShowAddForm(false)} />
        </Card>
      )}

      {/* User Count summary */}
      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
        <span>{t.totalUsers(users.length)}</span>
        {search && (
          <span>
            Ditemukan: {filteredUsers.length}
          </span>
        )}
      </div>

      {/* Responsive Table / Card Layout */}
      <div className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_#000]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-black bg-stone-100 text-xs font-black uppercase tracking-wider">
                <th className="p-3 w-12 text-center">{t.tableNo}</th>
                <th className="p-3 min-w-[140px]">{t.tableName}</th>
                <th className="p-3 min-w-[110px]">{t.tableRole}</th>
                <th className="p-3 min-w-[190px]">{t.changeRole}</th>
                <th className="p-3 min-w-[200px]">{t.tableTelegram}</th>
                <th className="p-3 min-w-[190px]">{t.resetPin}</th>
                <th className="p-3 min-w-[90px] text-right">{t.tableActions}</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user, idx) => (
                  <UserTableRow
                    key={user.id}
                    index={idx + 1}
                    user={user}
                    isSelf={user.id === currentUserId}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-6 text-center italic text-stone-500 font-semibold">
                    {t.noUsersFound}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AddUserForm({ onSuccess }: { onSuccess?: () => void }) {
  const [state, action, pending] = useActionState(async (prev: ActionState, formData: FormData) => {
    const res = await addMemberAction(prev, formData);
    if (res.ok && onSuccess) onSuccess();
    return res;
  }, {});
  const t = id.users;
  const nameId = useId();
  const pinId = useId();
  const roleId = useId();
  const telegramId = useId();

  return (
    <form action={action} className="flex flex-col gap-3">
      <h3 className="font-extrabold text-base uppercase">{t.addUser}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label htmlFor={nameId} className="block text-xs font-bold uppercase mb-1">
            {t.name}
          </label>
          <Input id={nameId} name="name" placeholder="contoh: Raihan" required className="w-full" />
        </div>
        <div>
          <label htmlFor={pinId} className="block text-xs font-bold uppercase mb-1">
            {t.initialPin}
          </label>
          <Input
            id={pinId}
            name="pin"
            type="password"
            placeholder="4 digit PIN"
            minLength={4}
            required
            className="w-full"
          />
        </div>
        <div>
          <label htmlFor={roleId} className="block text-xs font-bold uppercase mb-1">
            {t.role}
          </label>
          <select
            id={roleId}
            name="role"
            className="neo-select w-full min-h-[44px]"
            defaultValue="member"
          >
            <option value="member">{t.roleMember}</option>
            <option value="admin">{t.roleAdmin}</option>
          </select>
        </div>
        <div>
          <label htmlFor={telegramId} className="block text-xs font-bold uppercase mb-1">
            {t.telegramId} <span className="text-[var(--text-muted)] font-normal text-[10px]">(opsional)</span>
          </label>
          <Input
            id={telegramId}
            name="telegramChatId"
            placeholder={t.telegramPlaceholder}
            className="w-full"
          />
        </div>
      </div>

      <p className="text-[11px] text-[var(--text-muted)] font-medium">
        💡 {t.telegramHint}{" "}
        <a
          href="https://t.me/yonocateringbot"
          target="_blank"
          rel="noreferrer"
          className="font-bold underline text-[var(--secondary)]"
        >
          @yonocateringbot
        </a>
      </p>

      {state?.error && (
        <p className="border-2 border-black bg-red-100 p-2 text-sm font-bold text-[var(--danger)]">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p className="border-2 border-black bg-emerald-100 p-2 text-sm font-bold text-[var(--success)]">
          {t.userAdded}
        </p>
      )}

      <div className="mt-2 flex justify-end">
        <Button type="submit" variant="primary" disabled={pending} className="min-h-[44px]">
          {pending ? "Menyimpan…" : t.add}
        </Button>
      </div>
    </form>
  );
}

function UserTableRow({
  index,
  user,
  isSelf,
}: {
  index: number;
  user: UserItem;
  isSelf: boolean;
}) {
  const [roleState, roleAction, rolePending] = useActionState(updateRoleAction, {});
  const [telegramState, telegramAction, telegramPending] = useActionState(updateTelegramIdAction, {});
  const [pinState, pinAction, pinPending] = useActionState(resetPinAction, {});
  const [removeState, removeAction, removePending] = useActionState(removeMemberAction, {});
  const [newPin, setNewPin] = useState("");
  const [telegramChatId, setTelegramChatId] = useState(user.telegramChatId ?? "");

  const t = id.users;
  const isYono = user.role === "yono";
  const canModifyRole = !isSelf && !isYono;
  const canRemove = !isSelf && !isYono;

  const roleBadgeStyle =
    user.role === "yono"
      ? "bg-[var(--primary)] text-black"
      : user.role === "admin"
        ? "bg-[var(--secondary)] text-white"
        : "bg-stone-100 text-stone-900";

  const roleLabel =
    user.role === "yono" ? t.roleYono : user.role === "admin" ? t.roleAdmin : t.roleMember;

  return (
    <tr className="border-b border-stone-200 hover:bg-stone-50 transition-colors">
      {/* No */}
      <td className="p-3 text-center text-xs font-bold text-stone-500">{index}</td>

      {/* Name */}
      <td className="p-3 font-extrabold text-sm">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span>{user.name}</span>
          {isSelf && (
            <span className="text-[10px] bg-stone-200 border border-black px-1.5 py-0.2 font-bold uppercase">
              Kamu
            </span>
          )}
        </div>
      </td>

      {/* Role Badge */}
      <td className="p-3">
        <span
          className={`inline-block border-2 border-black px-2 py-0.5 text-xs font-black uppercase ${roleBadgeStyle}`}
        >
          {roleLabel}
        </span>
      </td>

      {/* Role Changer */}
      <td className="p-3">
        {canModifyRole ? (
          <form action={roleAction} className="flex items-center gap-1.5">
            <input type="hidden" name="memberId" value={user.id} />
            <select
              name="role"
              defaultValue={user.role}
              disabled={rolePending}
              className="neo-select text-xs py-1 px-2 h-9 min-w-[110px]"
            >
              <option value="member">{t.roleMember}</option>
              <option value="admin">{t.roleAdmin}</option>
            </select>
            <Button
              type="submit"
              variant="ghost"
              disabled={rolePending}
              className="text-xs px-2 py-1 h-9 min-h-[36px]"
            >
              {rolePending ? "…" : "Ubah"}
            </Button>
            {roleState?.error && (
              <span className="text-[11px] font-bold text-red-600 block">{roleState.error}</span>
            )}
            {roleState?.ok && (
              <span className="text-[11px] font-bold text-green-600 block">✓</span>
            )}
          </form>
        ) : (
          <span className="text-xs text-stone-400 font-semibold italic">
            {isYono ? "Terkunci" : "Akun Sendiri"}
          </span>
        )}
      </td>

      {/* Telegram Chat ID */}
      <td className="p-3">
        <form action={telegramAction} className="flex items-center gap-1.5">
          <input type="hidden" name="memberId" value={user.id} />
          <Input
            name="telegramChatId"
            placeholder="Chat ID"
            value={telegramChatId}
            onChange={(e) => setTelegramChatId(e.target.value)}
            className="text-xs py-1 px-2 h-9 max-w-[120px]"
          />
          <Button
            type="submit"
            variant="ghost"
            disabled={telegramPending}
            className="text-xs px-2 py-1 h-9 min-h-[36px] whitespace-nowrap"
            title="Simpan Telegram Chat ID"
          >
            {telegramPending ? "…" : "Simpan"}
          </Button>
          {telegramState?.error && (
            <span className="text-[11px] font-bold text-red-600 block">{telegramState.error}</span>
          )}
          {telegramState?.ok && (
            <span className="text-[11px] font-bold text-green-600 block">✓</span>
          )}
        </form>
      </td>

      {/* Reset PIN */}
      <td className="p-3">
        <form action={pinAction} className="flex items-center gap-1.5">
          <input type="hidden" name="memberId" value={user.id} />
          <Input
            name="pin"
            type="password"
            placeholder="PIN baru"
            minLength={4}
            value={newPin}
            onChange={(e) => setNewPin(e.target.value)}
            required
            className="text-xs py-1 px-2 h-9 max-w-[100px]"
          />
          <Button
            type="submit"
            variant="ghost"
            disabled={pinPending || newPin.length < 4}
            className="text-xs px-2 py-1 h-9 min-h-[36px] whitespace-nowrap"
          >
            {pinPending ? "…" : t.resetPin}
          </Button>
          {pinState?.error && (
            <span className="text-[11px] font-bold text-red-600 block">{pinState.error}</span>
          )}
          {pinState?.ok && (
            <span className="text-[11px] font-bold text-green-600 block">✓</span>
          )}
        </form>
      </td>

      {/* Remove Button */}
      <td className="p-3 text-right">
        {canRemove ? (
          <form
            action={removeAction}
            onSubmit={(e) => {
              if (!window.confirm(t.confirmRemove(user.name))) {
                e.preventDefault();
              }
            }}
          >
            <input type="hidden" name="memberId" value={user.id} />
            <Button
              type="submit"
              variant="danger"
              disabled={removePending}
              className="text-xs px-2 py-1 h-9 min-h-[36px]"
            >
              {removePending ? "…" : t.remove}
            </Button>
            {removeState?.error && (
              <span className="text-[11px] font-bold text-red-600 block">{removeState.error}</span>
            )}
          </form>
        ) : (
          <span className="text-xs text-stone-300 font-bold">—</span>
        )}
      </td>
    </tr>
  );
}
