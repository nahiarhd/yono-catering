"use client";

import { useState, useActionState, useEffect, useId } from "react";
import { useRouter } from "next/navigation";
import { id } from "@/lib/id";
import type { DefaultDish } from "@/lib/dishes";
import { parseSubDishes } from "@/lib/dishes";
import { Card, Button, Input, Label } from "@/components/ui";
import { TelegramPingButton } from "@/components/telegram-ping-button";
import { postMenuAction, recordMemberResponseAction, type ActionState } from "@/app/yono/actions";

export interface PendingUser {
  id: string;
  name: string;
}

export interface YonoSlideDashboardProps {
  dateKey: string;
  dateDisplay: string;
  menu: {
    id: string;
    dish: string;
    subDishes?: string | null;
    note?: string | null;
    cutoffOverride?: string | null;
  } | null;
  locked: boolean;
  defaultDishes: (DefaultDish | string)[];
  eaters: { id: string; name: string }[];
  tally: { total: number; breakdown: { dish: string; count: number }[] } | null;
  eatingOrders: { name: string; dish?: string; note?: string | null }[];
  notEatingOrders: { name: string; note?: string | null }[];
  pendingUsers: PendingUser[];
  cutoffText: string;
  waMessage: string;
  waUrl: string;
}

export function YonoSlideDashboard({
  dateKey,
  dateDisplay,
  menu,
  locked,
  defaultDishes,
  eaters,
  tally,
  eatingOrders,
  notEatingOrders,
  pendingUsers,
  cutoffText,
  waMessage,
  waUrl,
}: YonoSlideDashboardProps) {
  const router = useRouter();
  const t = id.yono;
  const tWa = id.whatsapp;

  // Active step: if menu exists, default to Slide 2 (Rekap). Otherwise Slide 1 (Pilih Menu).
  const [activeStep, setActiveStep] = useState<1 | 2>(menu ? 2 : 1);
  const [selectedPendingUser, setSelectedPendingUser] = useState<PendingUser | null>(null);
  const [copiedWa, setCopiedWa] = useState(false);
  const [showWaPreview, setShowWaPreview] = useState(false);

  // Form state for Menu Form
  const [dish, setDish] = useState(menu?.dish ?? "");
  const [subDishes, setSubDishes] = useState(menu?.subDishes ?? "");
  const [menuNote, setMenuNote] = useState(menu?.note ?? "");

  // Server action for posting menu
  const [menuFormState, formAction, menuPending] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const res = await postMenuAction(prev, formData);
      if (res.ok) {
        router.refresh();
        setActiveStep(2);
      }
      return res;
    },
    {}
  );

  const parsedPresets: DefaultDish[] = defaultDishes.map((d) =>
    typeof d === "string" ? { name: d, note: null, subDishes: [] } : d
  );

  function handleSelectPreset(preset: DefaultDish) {
    setDish(preset.name);
    setMenuNote(preset.note || "");
    setSubDishes(
      preset.subDishes && preset.subDishes.length > 0
        ? preset.subDishes.join(", ")
        : ""
    );
  }

  async function handleCopyWa() {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(waMessage);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = waMessage;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopiedWa(true);
      setTimeout(() => setCopiedWa(false), 2500);
    } catch {
      setCopiedWa(false);
    }
  }

  const totalAnswered = eatingOrders.length + notEatingOrders.length;
  const isAllAnswered = eaters.length > 0 && pendingUsers.length === 0;
  const currentSubDishesList = parseSubDishes(subDishes);
  const parsedActiveSubDishes = menu ? parseSubDishes(menu.subDishes) : [];

  return (
    <div className="flex flex-col gap-4">
      {/* ───────────────────────────────────────────────────────────── */}
      {/* SLIDE 1: PILIH ATAU TULIS MENU MASAKAN                         */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeStep === 1 && (
        <Card accent="yellow" className="border-3 border-black shadow-[5px_5px_0px_#000]">
          {/* Header */}
          <div className="border-b-2 border-black pb-3">
            <h2 className="text-xl sm:text-2xl font-black text-black">
              Pak Yono, hari ini masak menu apa?
            </h2>
            <p className="mt-1 text-sm font-semibold text-black/80">
              Pilih menu cepat di bawah atau tulis menu sendiri untuk hari ini ({dateDisplay}).
            </p>
          </div>

          <form action={formAction} className="mt-4 flex flex-col gap-5">
            <input type="hidden" name="dateKey" value={dateKey} />

            {/* Quick Menu Preset Buttons from Admin */}
            {parsedPresets.length > 0 && (
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-black mb-2">
                  PILIHAN MENU CEPAT:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {parsedPresets.map((preset) => {
                    const isSelected = dish.trim().toLowerCase() === preset.name.trim().toLowerCase();
                    const label = preset.warung || preset.name;
                    return (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => handleSelectPreset(preset)}
                        className={`border-2 border-black p-3 text-left transition-all cursor-pointer min-h-[48px] flex items-center justify-between gap-2 ${
                          isSelected
                            ? "bg-black text-white shadow-[3px_3px_0px_#fdc800] -translate-y-0.5"
                            : "bg-white hover:bg-amber-100 text-black shadow-[2px_2px_0px_#000]"
                        }`}
                        aria-pressed={isSelected}
                        title={preset.name ? `Menu: ${preset.name}` : undefined}
                      >
                        <span className="font-black text-sm sm:text-base leading-snug">
                          {label}
                        </span>
                        {isSelected && <span className="text-xs font-extrabold text-[var(--primary)] shrink-0">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sub-menu / Varian indicator if selected preset has sub-dishes */}
            {currentSubDishesList.length > 0 && (
              <div className="border-2 border-black bg-emerald-100 p-3 shadow-[2px_2px_0px_#000]">
                <p className="text-xs font-black uppercase tracking-wider text-emerald-950 mb-1.5">
                  Varian / Sub-menu Terpilih:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {currentSubDishesList.map((sub) => (
                    <span
                      key={sub}
                      className="border-2 border-black bg-white px-2.5 py-1 text-xs font-black shadow-[1px_1px_0px_#000]"
                    >
                      ✓ {sub}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Dish Text Input */}
            <div>
              <Label htmlFor="yono-dish-input" className="text-xs font-black uppercase tracking-wider text-black">
                ATAU TULIS MENU SENDIRI:
              </Label>
              <Input
                id="yono-dish-input"
                name="dish"
                required
                placeholder="contoh: Sop Buntut, Ayam Bakar Lengkuas"
                value={dish}
                onChange={(e) => setDish(e.target.value)}
                className="text-base sm:text-lg font-bold min-h-[50px] border-2 border-black shadow-[2px_2px_0px_#000] bg-white"
              />
            </div>

            {/* Varian / Sub-menu Text Input (Optional) */}
            <div>
              <Label htmlFor="yono-subdishes-input" className="text-xs font-black uppercase tracking-wider text-black">
                Pilihan Varian / Sub-menu (opsional, pisahkan koma):
              </Label>
              <Input
                id="yono-subdishes-input"
                name="subDishes"
                placeholder="contoh: Bakmi Goreng, Bakmi Godhog, Nasi Goreng"
                value={subDishes}
                onChange={(e) => setSubDishes(e.target.value)}
                className="text-sm border-2 border-black bg-white"
              />
            </div>

            {/* Notes Input (Optional) */}
            <div>
              <Label htmlFor="yono-note-input" className="text-xs font-black uppercase tracking-wider text-black">
                Catatan Masakan Pak Yono (opsional):
              </Label>
              <Input
                id="yono-note-input"
                name="menuNote"
                placeholder="contoh: Sudah termasuk lalapan dan sambal terasi"
                value={menuNote}
                onChange={(e) => setMenuNote(e.target.value)}
                className="text-sm border-2 border-black bg-white"
              />
            </div>

            {menuFormState.error && (
              <p className="border-2 border-black bg-red-100 p-2.5 text-sm font-bold text-[var(--danger)]">
                {menuFormState.error}
              </p>
            )}

            {/* Bottom Navigation Buttons */}
            <div className="mt-2 flex flex-col gap-2.5 border-t-2 border-black pt-4">
              <Button
                type="submit"
                variant="primary"
                disabled={menuPending || !dish.trim()}
                className="w-full min-h-[54px] text-base sm:text-lg font-black shadow-[4px_4px_0px_#000] border-2 border-black active:translate-y-0.5"
              >
                {menuPending
                  ? "Menyimpan Menu..."
                  : menu?.dish
                    ? "Perbarui Menu & Lanjut ke Rekap →"
                    : "Simpan & Lanjut ke Rekap Pesanan →"}
              </Button>

              {menu && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setActiveStep(2)}
                  className="w-full min-h-[48px] text-sm font-black border-2 border-black shadow-[2px_2px_0px_#000] bg-white hover:bg-stone-50"
                >
                  Lihat Rekap Pesanan & WhatsApp →
                </Button>
              )}
            </div>
          </form>
        </Card>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* SLIDE 2: REKAP PESANAN, WHATSAPP, & SIAPA BELUM ABSEN           */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeStep === 2 && menu && (
        <div className="flex flex-col gap-4 animate-in fade-in duration-150">
          {/* Menu Info Banner with Auto-Cutoff Info */}
          <div className="border-3 border-black bg-amber-100 p-4 shadow-[4px_4px_0px_#000] flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Menu Hari Ini ({dateDisplay}):
              </p>
              <h2 className="text-xl sm:text-2xl font-black text-black">
                {menu.dish}
              </h2>
              {parsedActiveSubDishes.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {parsedActiveSubDishes.map((sub) => (
                    <span
                      key={sub}
                      className="border border-black bg-white px-2 py-0.5 text-xs font-bold"
                    >
                      {sub}
                    </span>
                  ))}
                </div>
              )}
              {menu.note && (
                <p className="mt-1 text-xs font-semibold text-stone-700 italic">
                  Catatan: {menu.note}
                </p>
              )}
              <p className="mt-1 text-xs font-bold text-stone-600">
                Batas Pesan Otomatis: {cutoffText} (Jam 6 Sore) {locked ? "· Terkunci untuk anggota" : "· Masih Buka"}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActiveStep(1)}
              className="border-2 border-black bg-white hover:bg-stone-100 px-3.5 py-2 text-xs font-black uppercase cursor-pointer shadow-[2px_2px_0px_#000] active:translate-y-0.5"
            >
              ✎ Ubah Menu
            </button>
          </div>

          {/* BOX 1: WHATSAPP SHARE CARD & PORSI SUMMARY */}
          <Card className="border-3 border-black shadow-[4px_4px_0px_#000]">
            <div className="flex items-center justify-between gap-2 border-b-2 border-black pb-2.5">
              <div>
                <h3 className="text-base sm:text-lg font-black text-black">
                  📲 Kirim Rekap ke WhatsApp
                </h3>
                <p className="text-xs font-medium text-[var(--text-muted)]">
                  Kirim daftar pesanan katering ke WhatsApp untuk belanja atau salin format teksnya.
                </p>
              </div>
              <span className="border-2 border-black bg-[var(--primary)] px-2.5 py-1 text-xs font-black uppercase shadow-[2px_2px_0px_#000]">
                {tally?.total ?? 0} Porsi
              </span>
            </div>

            {/* Quick Action Buttons: Send to WA & Copy */}
            <div className="mt-4 flex flex-col sm:flex-row gap-2.5">
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="neo-btn flex-1 text-center font-black !bg-[#25D366] !text-black hover:brightness-105 active:translate-x-[2px] active:translate-y-[2px] min-h-[52px] text-base border-2 border-black shadow-[3px_3px_0px_#000]"
              >
                <span>💬</span>
                <span>{tWa.sendButton}</span>
              </a>
              <Button
                type="button"
                onClick={handleCopyWa}
                className="flex-1 font-extrabold min-h-[52px] text-sm border-2 border-black shadow-[3px_3px_0px_#000] bg-white hover:bg-stone-50"
                aria-label={tWa.copyButton}
              >
                <span>📋</span>
                <span>{copiedWa ? tWa.copied : tWa.copyButton}</span>
              </Button>
            </div>

            <div aria-live="polite" className="sr-only">
              {copiedWa ? tWa.copied : ""}
            </div>

            {/* Portion Breakdown Cards */}
            <div className="mt-4 border-t-2 border-black pt-3">
              <p className="text-xs font-black uppercase tracking-wider text-[var(--text-muted)] mb-2">
                {t.portionBreakdown}
              </p>
              {tally && tally.breakdown.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {tally.breakdown.map((item) => (
                    <div
                      key={item.dish}
                      className="border-2 border-black bg-stone-50 p-2.5 flex justify-between items-center font-bold"
                    >
                      <span className="text-sm">{item.dish}</span>
                      <span className="border-2 border-black bg-[var(--primary)] px-2.5 py-0.5 text-xs font-black">
                        {item.count} porsi
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm italic text-[var(--text-muted)]">Belum ada pesanan yang masuk.</p>
              )}
              <p className="mt-2 text-right text-sm font-black">
                {t.totalPortions(tally?.total ?? 0)}
              </p>
            </div>

            {/* WhatsApp Text Preview Accordion */}
            <div className="mt-3 border-t-2 border-black pt-2.5">
              <button
                type="button"
                onClick={() => setShowWaPreview((prev) => !prev)}
                className="text-xs font-black uppercase tracking-wider underline hover:text-[var(--primary-dark,#ca8a04)] cursor-pointer"
              >
                {showWaPreview ? "Sembunyikan Preview Teks WA ▴" : "Lihat Format Teks WhatsApp ▾"}
              </button>

              {showWaPreview && (
                <div className="mt-2 border-2 border-black bg-[var(--surface-sunken)] p-3 text-xs font-mono">
                  <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap break-words leading-relaxed select-all">
                    {waMessage}
                  </pre>
                </div>
              )}
            </div>
          </Card>

          {/* BOX 2: SIAPA YANG BELUM ABSEN & TELEGRAM REMINDER */}
          <Card className="border-3 border-black shadow-[4px_4px_0px_#000]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-black pb-3">
              <div>
                <h3 className="text-base sm:text-lg font-black text-black">
                  {isAllAnswered ? "✅ Status Absen Anggota" : `⚠️ Ada ${pendingUsers.length} orang belum absen hari ini:`}
                </h3>
                <p className="text-xs font-medium text-[var(--text-muted)]">
                  {isAllAnswered
                    ? "Semua pesanan sudah masuk dan siap dibelanjakan."
                    : "Pak Yono bisa langsung klik nama di bawah untuk mencatat pesanannya:"}
                </p>
              </div>

              {!isAllAnswered && (
                <TelegramPingButton
                  dateKey={dateKey}
                  pendingCount={pendingUsers.length}
                />
              )}
            </div>

            {isAllAnswered ? (
              <div className="mt-3 border-2 border-black bg-emerald-100 p-3.5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-black text-emerald-900">
                    Alhamdulillah, semua anggota sudah mengisi absen!
                  </p>
                  <p className="text-xs font-bold text-emerald-800">
                    Lengkap ({totalAnswered}/{eaters.length} anggota sudah merespons)
                  </p>
                </div>
                <span className="text-xl">🎉</span>
              </div>
            ) : (
              <div className="mt-3">
                <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {pendingUsers.map((user) => (
                    <li key={user.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedPendingUser(user)}
                        className="w-full border-2 border-black bg-rose-100 hover:bg-rose-200 active:translate-y-0.5 px-3 py-2 text-sm font-black transition-all shadow-[2px_2px_0px_#000] flex items-center justify-between cursor-pointer min-h-[48px]"
                        title={`Klik untuk catat pilihan ${user.name}`}
                        aria-label={`Klik untuk catat pilihan ${user.name}`}
                      >
                        <span className="truncate">{user.name}</span>
                        <span className="text-xs bg-rose-200 border border-black px-1.5 py-0.5 font-bold shrink-0 ml-1">
                          ✎ Catat
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          {/* BOX 3: DAFTAR YANG SUDAH PESAN (IKUT & TIDAK IKUT) */}
          <Card className="border-3 border-black shadow-[4px_4px_0px_#000]">
            <h3 className="text-base font-black uppercase tracking-wider text-black border-b-2 border-black pb-2">
              Daftar Pesanan Masuk
            </h3>

            {/* Eating Orders List */}
            <div className="mt-3">
              <p className="text-xs font-black uppercase text-[var(--text-muted)] mb-2">
                Daftar Ikut Makan ({eatingOrders.length} orang)
              </p>
              {eatingOrders.length > 0 ? (
                <ol className="space-y-2">
                  {eatingOrders.map((o, idx) => (
                    <li
                      key={o.name}
                      className="border-2 border-black bg-white p-2.5 text-sm font-semibold flex flex-col gap-1 shadow-[1px_1px_0px_#000]"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold">
                          {idx + 1}. {o.name}
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {o.dish && o.dish !== menu.dish && (
                            <span className="text-xs border-2 border-black px-1.5 py-0.5 font-bold bg-amber-100">
                              {o.dish}
                            </span>
                          )}
                          <span className="text-xs border-2 border-black px-1.5 py-0.5 font-bold bg-emerald-200">
                            Ikut
                          </span>
                        </div>
                      </div>
                      {o.note && (
                        <p className="text-xs text-[var(--text-muted)] italic font-medium">
                          Catatan: {o.note}
                        </p>
                      )}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm italic text-[var(--text-muted)]">
                  Belum ada yang memilih ikut makan.
                </p>
              )}
            </div>

            {/* Not Eating Orders List */}
            {notEatingOrders.length > 0 && (
              <div className="mt-4 border-t-2 border-black pt-3">
                <p className="text-xs font-black uppercase text-[var(--text-muted)] mb-2">
                  Daftar Tidak Ikut ({notEatingOrders.length} orang)
                </p>
                <ul className="flex flex-wrap gap-1.5">
                  {notEatingOrders.map((o) => (
                    <li
                      key={o.name}
                      className="border-2 border-black bg-stone-100 px-2.5 py-1 text-xs font-bold shadow-[1px_1px_0px_#000]"
                    >
                      {o.name}{o.note ? ` (${o.note})` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          {/* Bottom Back Button to Slide 1 */}
          <div className="pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setActiveStep(1)}
              className="w-full min-h-[50px] text-base font-black border-3 border-black shadow-[4px_4px_0px_#000] bg-white hover:bg-stone-50"
            >
              ← Kembali ke Pilihan Menu
            </Button>
          </div>
        </div>
      )}

      {/* QUICK ATTENDANCE MODAL FOR PENDING MEMBERS */}
      {selectedPendingUser && menu && (
        <RecordResponseModal
          user={selectedPendingUser}
          dateKey={dateKey}
          menuDish={menu.dish}
          subDishes={parsedActiveSubDishes}
          onClose={() => setSelectedPendingUser(null)}
          onSuccess={() => {
            setSelectedPendingUser(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

/**
 * Modal untuk Pak Yono mencatat jawaban anggota yang belum absen secara cepat
 */
function RecordResponseModal({
  user,
  dateKey,
  menuDish,
  subDishes,
  onClose,
  onSuccess,
}: {
  user: PendingUser;
  dateKey: string;
  menuDish: string;
  subDishes: string[];
  onClose: () => void;
  onSuccess: () => void;
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
        onSuccess();
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
      <div className="border-4 border-black bg-white shadow-[6px_6px_0px_#000] p-5 max-w-md w-full relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b-2 border-black pb-3">
          <div>
            <h2 id="record-modal-title" className="text-lg font-black text-black">
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
            aria-label="Tutup dialog"
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
            <label className="block text-xs font-black uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
              Status Makan Hari Ini
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setWants(true)}
                className={`border-2 border-black p-3 text-left font-bold text-sm transition-all cursor-pointer min-h-[50px] flex items-center justify-between ${
                  wants
                    ? "bg-emerald-200 shadow-[3px_3px_0px_#000]"
                    : "bg-white hover:bg-stone-50 opacity-70"
                }`}
                aria-pressed={wants}
              >
                <span>🍽️ {t.recordEating}</span>
                {wants && <span className="font-black text-base">✓</span>}
              </button>

              <button
                type="button"
                onClick={() => setWants(false)}
                className={`border-2 border-black p-3 text-left font-bold text-sm transition-all cursor-pointer min-h-[50px] flex items-center justify-between ${
                  !wants
                    ? "bg-rose-200 shadow-[3px_3px_0px_#000]"
                    : "bg-white hover:bg-stone-50 opacity-70"
                }`}
                aria-pressed={!wants}
              >
                <span>❌ {t.recordNotEating}</span>
                {!wants && <span className="font-black text-base">✓</span>}
              </button>
            </div>
          </div>

          {/* Sub-menu / Variant Selection if wants is true and subDishes exist */}
          {wants && subDishes.length > 0 && (
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
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
                      className={`border-2 border-black px-3.5 py-2 text-xs font-bold transition-all cursor-pointer min-h-[44px] ${
                        isSelected
                          ? "bg-[var(--primary)] shadow-[2px_2px_0px_#000]"
                          : "bg-white hover:bg-stone-100"
                      }`}
                      aria-pressed={isSelected}
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
              className="block text-xs font-black uppercase tracking-wider text-[var(--text-muted)] mb-1"
            >
              {id.response.noteLabel}
            </label>
            <Input
              id={noteId}
              name="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="contoh: pedas, bungkus, tanpa sayur"
              className="w-full text-sm min-h-[44px]"
            />

            {/* Quick Note Presets */}
            <div className="mt-2 flex flex-wrap gap-1.5 items-center">
              <span className="text-[11px] font-bold text-[var(--text-muted)]">
                {id.response.noteQuick}
              </span>
              {notePresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() =>
                    setNote((prev) => (prev ? `${prev}, ${preset}` : preset))
                  }
                  className="border border-black bg-stone-100 hover:bg-stone-200 px-2 py-1 text-xs font-bold cursor-pointer"
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
              className="min-h-[48px] text-xs font-bold border-2 border-black"
            >
              {id.settings.cancel}
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={pending || (wants && subDishes.length > 0 && !selectedSubDish)}
              className="min-h-[48px] text-sm font-black border-2 border-black shadow-[2px_2px_0px_#000]"
            >
              {pending ? t.recordSaving : t.recordSave}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
