"use client"

import userService, { DailyActivity } from "@/src/services/userService";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

const RANGES = [7, 30] as const;
type Range = typeof RANGES[number];

// "2026-10-14" -> local date, so the day never shifts with the timezone
const parseDay = (date: string) => {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
}

const formatDay = (date: string) =>
  parseDay(date).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });

const formatShortDay = (date: string) =>
  parseDay(date).toLocaleDateString(undefined, { day: "numeric", month: "short" });

const formatMinutes = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${String(minutes).padStart(2, "0")}min` : `${minutes}min`;
}

interface BarChartProps {
  title: string,
  data: DailyActivity[],
  value: (day: DailyActivity) => number,
  format: (value: number) => string,
}

const BarChart = ({ title, data, value, format }: BarChartProps) => {
  const max = Math.max(...data.map(value), 0);
  const total = data.reduce((sum, day) => sum + value(day), 0);

  return (
    <div className="flex-1 min-w-0 flex flex-col gap-3 bg-black/5 rounded-xl p-5">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs font-semibold text-black/80">{title}</p>
        <p className="text-xs text-black/60">{format(total)} total</p>
      </div>

      <div className="relative h-32 flex items-end gap-[2px] border-b border-black/20">
        {max === 0 && <p className="absolute inset-0 flex items-center justify-center text-xs text-black/50">No activity yet</p>}
        {data.map((day) => {
          const label = `${formatDay(day.date)}: ${format(value(day))}`;
          return (
            // The whole column is the hover target, not just the bar
            <div key={day.date} tabIndex={0} aria-label={label} className="group relative flex-1 h-full flex items-end outline-none">
              <div
                className="w-full rounded-t-[4px] bg-black/70 group-hover:bg-black group-focus-visible:bg-black"
                style={{ height: max === 0 ? 0 : `${(value(day) / max) * 100}%` }}
              />
              <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block group-focus-visible:block z-10 whitespace-nowrap rounded-md bg-white ring-1 ring-ui-line px-2 py-1 text-xs text-black shadow-sm">
                <p className="text-black/60">{formatDay(day.date)}</p>
                <p className="font-semibold">{format(value(day))}</p>
              </div>
            </div>
          );
        })}
      </div>

      {data.length > 0 && <div className="flex justify-between text-[10px] text-black/50">
        <span>{formatShortDay(data[0].date)}</span>
        <span>{formatShortDay(data[data.length - 1].date)}</span>
      </div>}
    </div>
  );
}

const ActivityCharts = ({ token, compact = false }: { token: string, compact?: boolean }) => {
  const [range, setRange] = useState<Range>(7);
  const [fetched, setFetched] = useState<{ range: Range, data: DailyActivity[], error: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    userService.getAnalytics(token, range)
      .then((data) => { if (!cancelled) setFetched({ range, data, error: "" }); })
      .catch((e) => { if (!cancelled) setFetched({ range, data: [], error: e instanceof Error ? e.message : "Failed to get analytics" }); });
    return () => { cancelled = true; };
  }, [token, range]);

  const isLoading = fetched?.range !== range;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-black/80">Activity</p>
        <div role="group" aria-label="Time range" className="flex rounded-md ring-1 ring-ui-line p-0.5 text-xs">
          {RANGES.map((option) => (
            <button
              key={option}
              aria-pressed={range === option}
              onClick={() => setRange(option)}
              className={`cursor-pointer px-2 py-1 rounded ${range === option ? "bg-black/10 font-semibold" : "text-black/60 hover:bg-black/5"}`}
            >
              {option} days
            </button>
          ))}
        </div>
      </div>

      {isLoading ? <div className="h-44 flex items-center justify-center">
        <Loader2 className="animate-spin" size={20} />
      </div> : fetched.error ? <p className="h-44 flex items-center justify-center text-sm text-black/60">{fetched.error}</p>
        : <div className={`flex gap-4 ${compact ? "flex-col" : "flex-col sm:flex-row"}`}>
          <BarChart title="Messages sent per day" data={fetched.data} value={(day) => day.messages_sent} format={(n) => `${n} message${n === 1 ? "" : "s"}`} />
          <BarChart title="Time spent per day" data={fetched.data} value={(day) => day.time_spent_seconds} format={formatMinutes} />
        </div>}
    </div>
  );
}

export default ActivityCharts;
