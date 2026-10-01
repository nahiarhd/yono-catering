import { Card } from "@/components/ui";

export interface MemberOrder {
  name: string;
  dish?: string;
  addOns?: string | null;
  note?: string | null;
}

export interface MemberOrdersSummaryProps {
  mainDish: string;
  totalMembers: number;
  eatingOrders: MemberOrder[];
  notEatingOrders: MemberOrder[];
  pendingMembers: string[];
  breakdown: { dish: string; count: number }[];
  addOnBreakdown?: { name: string; count: number; users: string[] }[];
  totalPortions: number;
}

export function MemberOrdersSummary({
  mainDish,
  totalMembers,
  eatingOrders,
  notEatingOrders,
  pendingMembers,
  breakdown,
  addOnBreakdown,
  totalPortions,
}: MemberOrdersSummaryProps) {
  const answeredCount = eatingOrders.length + notEatingOrders.length;
  const isAllAnswered = totalMembers > 0 && pendingMembers.length === 0;

  return (
    <Card className="flex flex-col gap-4">
      {/* Title & Status Bar */}
      <div>
        <div className="flex items-center justify-between gap-2">
          <h2 className="neo-label text-base">Ringkasan Pesanan Hari Ini</h2>
          <span className="text-xs font-bold text-[var(--text-muted)]">
            Total {totalPortions} porsi
          </span>
        </div>

        <div className="mt-2.5">
          {isAllAnswered ? (
            <div className="border-2 border-black bg-[var(--primary)] p-2.5 text-xs font-black flex items-center justify-between">
              <span>✓ Semua anggota sudah ngelist!</span>
              <span className="border-2 border-black bg-black text-white px-2 py-0.5 uppercase text-[10px]">
                Lengkap ({answeredCount}/{totalMembers})
              </span>
            </div>
          ) : (
            <div className="border-2 border-black bg-[var(--surface-sunken)] p-2.5 text-xs font-extrabold flex items-center justify-between">
              <span>⏳ {answeredCount} dari {totalMembers} anggota sudah ngelist</span>
              <span className="border-2 border-black bg-rose-100 text-rose-800 px-2 py-0.5 uppercase text-[10px] font-black">
                {pendingMembers.length} Belum
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Belum Menjawab: Memudahkan saling mengingatkan teman kantor */}
      {pendingMembers.length > 0 && (
        <div className="border-2 border-black bg-rose-50 p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between flex-wrap gap-1">
            <p className="text-xs font-black uppercase text-rose-800">
              Belum Menjawab ({pendingMembers.length} orang)
            </p>
            <span className="text-[11px] font-semibold text-rose-600">
              Yuk bantu saling ingatkan!
            </span>
          </div>
          <ul className="flex flex-wrap gap-1.5">
            {pendingMembers.map((name) => (
              <li
                key={name}
                className="border-2 border-black bg-white px-2.5 py-1 text-xs font-bold text-rose-900 shadow-[1px_1px_0px_0px_#000]"
              >
                {name}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Rincian Porsi Katering */}
      {breakdown.length > 0 && (
        <div>
          <p className="neo-label text-xs">Porsi Dipesan</p>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {breakdown.map((item) => (
              <div
                key={item.dish}
                className="border-2 border-black bg-white p-2 flex justify-between items-center text-xs font-bold"
              >
                <span>{item.dish}</span>
                <span className="border-2 border-black bg-[var(--primary)] px-2 py-0.5 font-black">
                  {item.count} porsi
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rincian Add-on Katering */}
      {addOnBreakdown && addOnBreakdown.length > 0 && (
        <div>
          <p className="neo-label text-xs">Tambahan / Add-on Dipesan</p>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {addOnBreakdown.map((item) => (
              <div
                key={item.name}
                className="border-2 border-black bg-emerald-50 p-2 flex justify-between items-center text-xs font-bold"
              >
                <span>+ {item.name}</span>
                <span className="border-2 border-black bg-emerald-300 px-2 py-0.5 font-black">
                  {item.count} porsi
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daftar Ikut Makan */}
      <div>
        <p className="neo-label text-xs">
          Daftar Ikut Makan ({eatingOrders.length} orang)
        </p>
        {eatingOrders.length > 0 ? (
          <ol className="mt-2 space-y-2">
            {eatingOrders.map((o, idx) => (
              <li
                key={o.name}
                className="border-2 border-black bg-white p-2.5 text-xs font-semibold flex flex-col gap-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm">
                    {idx + 1}. {o.name}
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {o.dish && o.dish !== mainDish && (
                      <span className="text-[11px] border border-black px-1.5 py-0.5 font-bold bg-amber-100">
                        {o.dish}
                      </span>
                    )}
                    {o.addOns && (
                      <span className="text-[11px] border border-black px-1.5 py-0.5 font-bold bg-emerald-100">
                        + {o.addOns}
                      </span>
                    )}
                  </div>
                </div>
                {o.note && (
                  <p className="text-[11px] text-[var(--text-muted)] italic">
                    Catatan: {o.note}
                  </p>
                )}
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-1 text-xs italic text-[var(--text-muted)]">
            Belum ada yang memilih ikut makan.
          </p>
        )}
      </div>

      {/* Daftar Tidak Ikut Makan */}
      {notEatingOrders.length > 0 && (
        <div className="border-t-2 border-black pt-3">
          <p className="neo-label text-xs text-[var(--text-muted)]">
            Tidak Ikut Makan ({notEatingOrders.length} orang)
          </p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {notEatingOrders.map((o) => (
              <li
                key={o.name}
                className="border border-black bg-stone-100 px-2 py-0.5 text-xs font-semibold text-stone-700"
              >
                {o.name}{o.note ? ` (${o.note})` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
