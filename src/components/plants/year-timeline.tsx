import type { Dictionary } from "@/i18n/dictionaries";

export function YearTimeline({ sowing, harvest, t }: { sowing: number[]; harvest: number[]; t: Dictionary }) {
  const list = (months: number[]) => months.map((m) => t.months[m - 1]).join(t.listSeparator);

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[32rem] table-fixed border-separate border-spacing-1 text-center text-xs">
          <thead>
            <tr>
              <th className="w-16" aria-label={t.activity} />
              {t.shortMonths.map((name) => (
                <th key={name} scope="col" className="font-medium text-muted">
                  {name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <Row label={t.sow} months={sowing} activeClass="bg-leaf" t={t} />
            <Row label={t.harvest} months={harvest} activeClass="bg-clay" t={t} />
          </tbody>
        </table>
      </div>
      <dl className="mt-4 space-y-1 text-sm">
        <div>
          <dt className="inline font-medium">{t.sow}{t.colon}</dt>
          <dd className="inline text-muted">{list(sowing)}</dd>
        </div>
        <div>
          <dt className="inline font-medium">{t.expectedHarvest}{t.colon}</dt>
          <dd className="inline text-muted">{list(harvest)}</dd>
        </div>
      </dl>
    </div>
  );
}

function Row({
  label,
  months,
  activeClass,
  t,
}: {
  label: string;
  months: number[];
  activeClass: string;
  t: Dictionary;
}) {
  return (
    <tr>
      <th scope="row" className="text-left font-medium">
        {label}
      </th>
      {t.shortMonths.map((name, i) => {
        const active = months.includes(i + 1);
        return (
          <td key={name} className={`h-6 rounded ${active ? activeClass : "bg-line/50"}`}>
            <span className="sr-only">{active ? t.yes : t.no}</span>
          </td>
        );
      })}
    </tr>
  );
}
