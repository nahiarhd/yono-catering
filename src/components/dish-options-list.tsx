import type { DishOption } from "@/lib/dishes";

/** Read-only view of a warung's dishes, each with only its own variants and add-ons. */
export function DishOptionsList({ options }: { options: DishOption[] }) {
  if (options.length === 0) return null;
  const single = options.length === 1;

  return (
    <ul className={single ? "mt-2" : "mt-3 flex flex-col gap-2"}>
      {options.map((o) => (
        <li key={o.name} className={single ? "" : "border-2 border-black bg-white p-2.5"}>
          <p className={single ? "text-2xl font-extrabold" : "text-base font-black"}>{o.name}</p>
          {o.variants.length > 0 && (
            <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs font-bold">
              <span className="text-[var(--text-muted)]">Varian:</span>
              {o.variants.map((v) => (
                <span key={v} className="border border-black bg-amber-100 px-2 py-0.5">
                  {v}
                </span>
              ))}
            </p>
          )}
          {o.addOns.length > 0 && (
            <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs font-bold">
              <span className="text-[var(--text-muted)]">Add-on:</span>
              {o.addOns.map((a) => (
                <span key={a} className="border border-black bg-emerald-100 px-2 py-0.5">
                  + {a}
                </span>
              ))}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
