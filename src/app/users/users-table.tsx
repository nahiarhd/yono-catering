"use client";

import { useActionState, useId, useState, useTransition } from "react";
import type { Role } from "@prisma/client";
import {
  addMemberAction,
  updateRoleAction,
  updateTelegramIdAction,
  resetPinAction,
  removeMemberAction,
  createGroupAction,
  deleteGroupAction,
  updateUserGroupAction,
  setUserActiveAction,
  checkTelegramAction,
  type ActionState,
} from "./actions";
import { id } from "@/lib/id";
import type { TelegramStatus } from "@/lib/telegram-status";
import { Button, Input, Card } from "@/components/ui";
import { TelegramStatusBadge } from "@/components/account-status-cards";

export type UserItem = {
  id: string;
  name: string;
  role: Role;
  telegramChatId?: string | null;
  telegramStatus: TelegramStatus;
  telegramLink: string;
  active: boolean;
  groupId?: string | null;
  groupName?: string | null;
  createdAt: string;
};

export type GroupItem = {
  id: string;
  name: string;
  userCount: number;
};

type StatusFilter = "all" | "telegram" | "away";

export function UsersTable({
  users,
  groups,
  currentUserId,
}: {
  users: UserItem[];
  groups: GroupItem[];
  currentUserId: string;
}) {
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showGroups, setShowGroups] = useState(false);
  const t = id.users;

  // Yono does not order, so only orderers count toward Telegram problems
  const needsTelegram = (u: UserItem) => u.role !== "yono" && u.active && u.telegramStatus !== "ok";
  const attentionCount = users.filter(needsTelegram).length;

  const filteredUsers = users.filter((u) => {
    if (!u.name.toLowerCase().includes(search.trim().toLowerCase())) return false;
    if (statusFilter === "telegram" && !needsTelegram(u)) return false;
    if (statusFilter === "away" && u.active) return false;
    if (groupFilter === "ALL") return true;
    if (groupFilter === "NONE") return !u.groupId;
    return u.groupId === groupFilter;
  });

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.searchPlaceholder}
            aria-label={t.searchPlaceholder}
            className="w-full text-base sm:min-w-[200px] sm:flex-1"
          />
          <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:flex">
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="neo-select min-h-[44px] text-sm sm:w-44"
              aria-label={t.filterGroup}
            >
              <option value="ALL">{t.allGroups}</option>
              <option value="NONE">{t.noGroup}</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.userCount})
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="neo-select min-h-[44px] text-sm sm:w-48"
              aria-label={t.filterStatus}
            >
              <option value="all">{t.allStatus}</option>
              <option value="telegram">{t.tgBadgeNone} / {t.tgBadgeFailed}</option>
              <option value="away">{t.away}</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <Button
            type="button"
            variant={showAddForm ? "default" : "primary"}
            onClick={() => setShowAddForm((v) => !v)}
            aria-expanded={showAddForm}
            className="min-h-[44px] text-sm"
          >
            {showAddForm ? t.closeForm : `+ ${t.addUser}`}
          </Button>
          {/* Wrapper carries lg:hidden because .neo-btn sets display and would win over it */}
          <div className="lg:hidden">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowGroups((v) => !v)}
              aria-expanded={showGroups}
              className="min-h-[44px] w-full text-sm"
            >
              {t.manageGroups} ({groups.length})
            </Button>
          </div>
          <TelegramCheckButton />
        </div>

        {attentionCount > 0 && statusFilter !== "telegram" && (
          <div className="flex flex-col gap-2 border-2 border-black bg-amber-100 p-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-bold">
              {t.needsAttention(attentionCount)}. {t.needsAttentionHint}
            </p>
            <Button
              type="button"
              onClick={() => setStatusFilter("telegram")}
              className="min-h-[44px] shrink-0 text-sm"
            >
              {t.showThem}
            </Button>
          </div>
        )}

        {showAddForm && (
          <Card className="bg-amber-50">
            <AddUserForm groups={groups} onSuccess={() => setShowAddForm(false)} />
          </Card>
        )}

        <p className="text-xs font-bold text-[var(--text-muted)]">
          {t.totalUsers(users.length)}
          {filteredUsers.length !== users.length && ` · ${t.shown(filteredUsers.length)}`}
        </p>

        {filteredUsers.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {filteredUsers.map((user) => (
              <UserRow key={user.id} user={user} groups={groups} isSelf={user.id === currentUserId} />
            ))}
          </ul>
        ) : (
          <p className="border-2 border-dashed border-black p-6 text-center font-semibold text-[var(--text-muted)]">
            {t.noUsersFound}
          </p>
        )}
      </div>

      <aside className={`${showGroups ? "block" : "hidden"} lg:sticky lg:top-4 lg:block`}>
        <GroupsPanel
          groups={groups}
          activeFilter={groupFilter}
          onFilter={(groupId) => setGroupFilter(groupId)}
        />
      </aside>
    </div>
  );
}

function TelegramCheckButton() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionState & { summary?: string }>({});
  const t = id.users;

  return (
    <div className="col-span-2 flex flex-col gap-1 sm:col-span-1">
      <Button
        type="button"
        variant="ghost"
        disabled={pending}
        onClick={() => startTransition(async () => setResult(await checkTelegramAction()))}
        className="min-h-[44px] text-sm"
      >
        {pending ? t.telegramChecking : t.telegramCheck}
      </Button>
      <p role="status" className="text-xs font-bold">
        {result.error ? <span className="text-[var(--danger)]">{result.error}</span> : result.summary}
      </p>
    </div>
  );
}

function RoleBadge({ role }: { role: Role }) {
  const t = id.users;
  const style =
    role === "yono"
      ? "bg-[var(--primary)] text-black"
      : role === "admin"
        ? "bg-[var(--secondary)] text-white"
        : "bg-white text-black";
  const label = role === "yono" ? t.roleYono : role === "admin" ? t.roleAdmin : t.roleMember;
  return <span className={`border-2 border-black px-2 py-0.5 text-xs font-black ${style}`}>{label}</span>;
}

function UserRow({ user, groups, isSelf }: { user: UserItem; groups: GroupItem[]; isSelf: boolean }) {
  const t = id.users;
  const isYono = user.role === "yono";

  return (
    <li className={`border-2 border-black ${user.active ? "bg-white" : "bg-stone-100"}`}>
      <details className="group">
        <summary className="flex min-h-[56px] cursor-pointer list-none items-center gap-3 p-3 hover:bg-amber-50 [&::-webkit-details-marker]:hidden">
          <div className="min-w-0 flex-1 md:grid md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] md:items-center md:gap-4">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="break-words font-black">{user.name}</span>
              {isSelf && <span className="text-xs font-bold text-[var(--text-muted)]">({t.you})</span>}
              <RoleBadge role={user.role} />
            </div>
            <p className="mt-1 truncate text-sm font-semibold text-[var(--text-muted)] md:mt-0">
              {isYono ? "" : user.groupName ?? t.noGroup}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5 md:mt-0 md:justify-end">
              {!user.active && (
                <span className="border-2 border-black bg-stone-300 px-2 py-0.5 text-xs font-black">{t.away}</span>
              )}
              {!isYono && <TelegramStatusBadge status={user.telegramStatus} />}
            </div>
          </div>
          <span
            aria-hidden="true"
            className="shrink-0 border-2 border-black px-2 py-1 text-xs font-black group-open:bg-black group-open:text-white"
          >
            {t.manage}
          </span>
        </summary>
        <UserEditor user={user} groups={groups} isSelf={isSelf} />
      </details>
    </li>
  );
}

function FormMessage({ state, ok }: { state: ActionState; ok: string }) {
  if (state.error) return <p className="text-xs font-bold text-[var(--danger)]">{state.error}</p>;
  if (state.ok) return <p className="text-xs font-bold text-[var(--success)]">{ok}</p>;
  return null;
}

function UserEditor({ user, groups, isSelf }: { user: UserItem; groups: GroupItem[]; isSelf: boolean }) {
  const [roleState, roleAction, rolePending] = useActionState(updateRoleAction, {});
  const [groupState, groupAction, groupPending] = useActionState(updateUserGroupAction, {});
  const [telegramState, telegramAction, telegramPending] = useActionState(updateTelegramIdAction, {});
  const [pinState, pinAction, pinPending] = useActionState(resetPinAction, {});
  const [activeState, activeAction, activePending] = useActionState(setUserActiveAction, {});
  const [removeState, removeAction, removePending] = useActionState(removeMemberAction, {});
  const [copied, setCopied] = useState<"yes" | "failed" | null>(null);
  const ids = { group: useId(), role: useId(), tg: useId(), pin: useId() };
  const t = id.users;
  const isYono = user.role === "yono";
  const fieldLabel = "mb-1 block text-xs font-bold text-[var(--text-muted)]";
  const box = "flex flex-col gap-1.5 border-2 border-black bg-[var(--surface)] p-3";

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(user.telegramLink);
      setCopied("yes");
    } catch {
      setCopied("failed");
    }
  }

  return (
    <div className="grid grid-cols-1 gap-3 border-t-2 border-black p-3 sm:grid-cols-2">
      {!isYono && (
        <div className={`${box} sm:col-span-2`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-black">{t.tableTelegram}</p>
            <TelegramStatusBadge status={user.telegramStatus} />
          </div>
          <p className="text-xs font-semibold text-[var(--text-muted)]">{t.telegramLinkHint}</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="button" variant="primary" onClick={copyLink} className="min-h-[44px] text-sm">
              {t.copyLink}
            </Button>
            <form action={telegramAction} className="flex flex-1 gap-2">
              <input type="hidden" name="memberId" value={user.id} />
              <label htmlFor={ids.tg} className="sr-only">
                {t.telegramId}
              </label>
              <Input
                id={ids.tg}
                name="telegramChatId"
                inputMode="numeric"
                placeholder={t.telegramPlaceholder}
                defaultValue={user.telegramChatId ?? ""}
                className="min-w-0 flex-1 text-sm"
              />
              <Button type="submit" disabled={telegramPending} className="min-h-[44px] shrink-0 text-sm">
                {telegramPending ? "…" : t.save}
              </Button>
            </form>
          </div>
          {copied === "yes" && <p className="text-xs font-bold text-[var(--success)]">{t.linkCopied}</p>}
          {copied === "failed" && (
            <Input readOnly value={user.telegramLink} onFocus={(e) => e.target.select()} className="text-xs" aria-label={t.copyLink} />
          )}
          <FormMessage state={telegramState} ok={t.telegramUpdated} />
        </div>
      )}

      {!isYono && (
        <form action={groupAction} className={box}>
          <input type="hidden" name="memberId" value={user.id} />
          <label htmlFor={ids.group} className={fieldLabel}>
            {t.group}
          </label>
          <div className="flex gap-2">
            <select
              id={ids.group}
              name="groupId"
              defaultValue={user.groupId ?? ""}
              className="neo-select min-h-[44px] min-w-0 flex-1 text-sm"
            >
              <option value="">{t.noGroup}</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
            <Button type="submit" disabled={groupPending} className="min-h-[44px] shrink-0 text-sm">
              {groupPending ? "…" : t.save}
            </Button>
          </div>
          <FormMessage state={groupState} ok={t.groupMoved} />
        </form>
      )}

      {!isYono && !isSelf && (
        <form action={roleAction} className={box}>
          <input type="hidden" name="memberId" value={user.id} />
          <label htmlFor={ids.role} className={fieldLabel}>
            {t.role}
          </label>
          <div className="flex gap-2">
            <select
              id={ids.role}
              name="role"
              defaultValue={user.role}
              className="neo-select min-h-[44px] min-w-0 flex-1 text-sm"
            >
              <option value="member">{t.roleMember}</option>
              <option value="admin">{t.roleAdmin}</option>
            </select>
            <Button type="submit" disabled={rolePending} className="min-h-[44px] shrink-0 text-sm">
              {rolePending ? "…" : t.save}
            </Button>
          </div>
          <FormMessage state={roleState} ok={t.roleUpdated} />
        </form>
      )}

      <form action={pinAction} className={box}>
        <input type="hidden" name="memberId" value={user.id} />
        <label htmlFor={ids.pin} className={fieldLabel}>
          {t.newPin}
        </label>
        <div className="flex gap-2">
          <Input
            id={ids.pin}
            name="pin"
            type="password"
            inputMode="numeric"
            minLength={4}
            required
            placeholder="min. 4 digit"
            className="min-w-0 flex-1 text-sm"
          />
          <Button type="submit" disabled={pinPending} className="min-h-[44px] shrink-0 text-sm">
            {pinPending ? "…" : t.resetPin}
          </Button>
        </div>
        <FormMessage state={pinState} ok={t.pinUpdated} />
      </form>

      {!isYono && (
        <form action={activeAction} className={box}>
          <input type="hidden" name="memberId" value={user.id} />
          <input type="hidden" name="active" value={user.active ? "no" : "yes"} />
          <p className="text-sm font-black">{user.active ? t.presentTitle : t.away}</p>
          <p className="text-xs font-semibold text-[var(--text-muted)]">{t.awayHint}</p>
          <Button
            type="submit"
            variant={user.active ? "default" : "primary"}
            disabled={activePending}
            className="min-h-[44px] text-sm"
          >
            {activePending ? "…" : user.active ? t.setAway : t.setActive}
          </Button>
          <FormMessage state={activeState} ok={t.saved} />
        </form>
      )}

      {!isYono && !isSelf && (
        <form
          action={removeAction}
          onSubmit={(e) => {
            if (!window.confirm(t.confirmRemove(user.name))) e.preventDefault();
          }}
          className="flex flex-col gap-1.5 sm:col-span-2 sm:items-end"
        >
          <input type="hidden" name="memberId" value={user.id} />
          <Button type="submit" variant="danger" disabled={removePending} className="min-h-[44px] text-sm">
            {removePending ? "…" : `${t.remove} ${user.name}`}
          </Button>
          <FormMessage state={removeState} ok="" />
        </form>
      )}
    </div>
  );
}

function GroupsPanel({
  groups,
  activeFilter,
  onFilter,
}: {
  groups: GroupItem[];
  activeFilter: string;
  onFilter: (groupId: string) => void;
}) {
  const [createState, createAction, createPending] = useActionState(createGroupAction, {});
  const [deleteState, deleteAction, deletePending] = useActionState(deleteGroupAction, {});
  const t = id.users;
  const inputId = useId();

  return (
    <Card className="flex flex-col gap-4">
      <div>
        <h2 className="font-black">
          {t.manageGroups} ({groups.length})
        </h2>
        <p className="text-xs font-semibold text-[var(--text-muted)]">{t.groupsHint}</p>
      </div>

      <form action={createAction} className="flex flex-col gap-1.5">
        <label htmlFor={inputId} className="text-xs font-bold text-[var(--text-muted)]">
          {t.groupName}
        </label>
        <div className="flex gap-2">
          <Input id={inputId} name="name" placeholder={t.groupPlaceholder} required className="min-w-0 flex-1 text-sm" />
          <Button type="submit" variant="primary" disabled={createPending} className="min-h-[44px] shrink-0 text-sm">
            {createPending ? "…" : t.addGroupBtn}
          </Button>
        </div>
        <FormMessage state={createState} ok={t.groupAdded} />
      </form>

      {groups.length === 0 ? (
        <p className="border-2 border-dashed border-black p-3 text-sm font-semibold text-[var(--text-muted)]">
          {t.noGroups}
        </p>
      ) : (
        <ul className="flex flex-col divide-y-2 divide-black border-2 border-black">
          {groups.map((group) => {
            const selected = activeFilter === group.id;
            return (
              <li key={group.id} className={`flex items-center gap-2 p-2 ${selected ? "bg-amber-100" : "bg-white"}`}>
                <button
                  type="button"
                  onClick={() => onFilter(selected ? "ALL" : group.id)}
                  aria-pressed={selected}
                  className="min-h-[44px] min-w-0 flex-1 text-left hover:underline"
                >
                  <span className="block truncate font-black">{group.name}</span>
                  <span className="text-xs font-semibold text-[var(--text-muted)]">
                    {t.groupMembers(group.userCount)}
                    {selected ? ` · ${t.filtering}` : ""}
                  </span>
                </button>
                <form
                  action={deleteAction}
                  onSubmit={(e) => {
                    if (!window.confirm(t.confirmRemoveGroup(group.name))) e.preventDefault();
                  }}
                >
                  <input type="hidden" name="groupId" value={group.id} />
                  <Button
                    type="submit"
                    variant="danger"
                    disabled={deletePending}
                    className="min-h-[44px] text-xs"
                    aria-label={`${t.remove} group ${group.name}`}
                  >
                    {t.remove}
                  </Button>
                </form>
              </li>
            );
          })}
        </ul>
      )}
      <FormMessage state={deleteState} ok={t.groupRemoved} />
    </Card>
  );
}

function AddUserForm({ groups, onSuccess }: { groups: GroupItem[]; onSuccess?: () => void }) {
  const [state, action, pending] = useActionState(async (prev: ActionState, formData: FormData) => {
    const res = await addMemberAction(prev, formData);
    if (res.ok && onSuccess) onSuccess();
    return res;
  }, {});
  const t = id.users;
  const ids = { name: useId(), pin: useId(), role: useId(), group: useId() };
  const fieldLabel = "mb-1 block text-xs font-bold text-[var(--text-muted)]";

  return (
    <form action={action} className="flex flex-col gap-3">
      <h2 className="font-black">{t.addUser}</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div>
          <label htmlFor={ids.name} className={fieldLabel}>
            {t.name}
          </label>
          <Input id={ids.name} name="name" placeholder="contoh: Raihan" required className="w-full" />
        </div>
        <div>
          <label htmlFor={ids.pin} className={fieldLabel}>
            {t.initialPin}
          </label>
          <Input id={ids.pin} name="pin" type="password" inputMode="numeric" minLength={4} required className="w-full" />
        </div>
        <div>
          <label htmlFor={ids.role} className={fieldLabel}>
            {t.role}
          </label>
          <select id={ids.role} name="role" className="neo-select min-h-[44px] w-full" defaultValue="member">
            <option value="member">{t.roleMember}</option>
            <option value="admin">{t.roleAdmin}</option>
          </select>
        </div>
        <div>
          <label htmlFor={ids.group} className={fieldLabel}>
            {t.group}
          </label>
          <select id={ids.group} name="groupId" className="neo-select min-h-[44px] w-full" defaultValue="">
            <option value="">{t.noGroup}</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <p className="text-xs font-semibold text-[var(--text-muted)]">{t.addUserTelegramHint}</p>
      <FormMessage state={state} ok={t.userAdded} />
      <Button type="submit" variant="primary" disabled={pending} className="min-h-[44px] sm:self-end">
        {pending ? "Menyimpan…" : t.add}
      </Button>
    </form>
  );
}
