import Link from "next/link";

export function WarungTabs({
  menus,
  activeId,
  hrefFor,
  addHref,
  pickedId,
}: {
  menus: { id: string; vendor: string; dish: string }[];
  activeId: string | null;
  hrefFor: (menuId: string) => string;
  addHref?: string;
  /** Warung the viewer already ordered from, marked so they can find it again. */
  pickedId?: string | null;
}) {
  if (menus.length < 2 && !addHref) return null;
  const base = "min-h-[44px] px-3 py-2 border-2 border-black text-sm font-black flex items-center gap-1.5";

  return (
    <nav aria-label="Pilih warung" className="flex flex-wrap gap-2">
      {menus.map((m) => {
        const active = m.id === activeId;
        return (
          <Link
            key={m.id}
            href={hrefFor(m.id)}
            aria-current={active ? "page" : undefined}
            className={`${base} ${active ? "bg-black text-white" : "bg-white shadow-[2px_2px_0px_#000] hover:bg-amber-50"}`}
          >
            {m.vendor || m.dish}
            {m.id === pickedId && <span className="text-xs font-bold text-emerald-500">✓ pesananmu</span>}
          </Link>
        );
      })}
      {addHref && (
        <Link
          href={addHref}
          aria-current={activeId === null ? "page" : undefined}
          className={`${base} border-dashed ${activeId === null ? "bg-black text-white" : "bg-amber-50 hover:bg-amber-100"}`}
        >
          + Tambah warung
        </Link>
      )}
    </nav>
  );
}
