"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Clock, Globe } from "lucide-react";

interface DateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
}

export default function DateTimePicker({ value, onChange }: DateTimePickerProps) {
  const parsed = value
    ? new Date(value)
    : (() => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        d.setHours(10, 0, 0, 0);
        return d;
      })();

  const [viewMonth, setViewMonth] = useState(parsed.getMonth());
  const [viewYear, setViewYear] = useState(parsed.getFullYear());
  const [hour, setHour] = useState(parsed.getHours());
  const [minute, setMinute] = useState(parsed.getMinutes());

  const selectedDate = value ? new Date(value) : null;

  const tzLabel =
    new Date()
      .toLocaleTimeString("en-US", { timeZoneName: "short" })
      .split(" ")
      .pop() ?? Intl.DateTimeFormat().resolvedOptions().timeZone;

  const weeks = useMemo(() => buildMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);
  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  function selectDate(day: Date) {
    const d = new Date(day);
    d.setHours(hour, minute, 0, 0);
    onChange(toLocalInput(d));
  }

  function updateTime(h: number, m: number) {
    setHour(h);
    setMinute(m);
    if (selectedDate) {
      const d = new Date(selectedDate);
      d.setHours(h, m, 0, 0);
      onChange(toLocalInput(d));
    }
  }

  function setPreset(daysFromNow: number, h: number) {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    d.setHours(h, 0, 0, 0);
    setHour(h);
    setMinute(0);
    setViewMonth(d.getMonth());
    setViewYear(d.getFullYear());
    onChange(toLocalInput(d));
  }

  function prevMonth() {
    const d = new Date(viewYear, viewMonth - 1);
    setViewMonth(d.getMonth());
    setViewYear(d.getFullYear());
  }

  function nextMonth() {
    const d = new Date(viewYear, viewMonth + 1);
    setViewMonth(d.getMonth());
    setViewYear(d.getFullYear());
  }

  function isDaySelected(day: Date) {
    if (!selectedDate) return false;
    return (
      day.getDate() === selectedDate.getDate() &&
      day.getMonth() === selectedDate.getMonth() &&
      day.getFullYear() === selectedDate.getFullYear()
    );
  }

  function isDayToday(day: Date) {
    const now = new Date();
    return (
      day.getDate() === now.getDate() &&
      day.getMonth() === now.getMonth() &&
      day.getFullYear() === now.getFullYear()
    );
  }

  return (
    <div className="space-y-3">
      {/* Quick presets */}
      <div className="flex flex-wrap gap-1.5">
        {[
          { label: "Tomorrow 10am", days: 1, h: 10 },
          { label: "In 2 days", days: 2, h: 10 },
          { label: "Next week", days: 7, h: 10 },
        ].map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => setPreset(p.days, p.h)}
            className="rounded-md bg-card-hover px-2.5 py-1 text-[11px] text-muted transition hover:bg-accent/10 hover:text-accent-light"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={prevMonth}
          className="rounded-md p-1 text-muted transition hover:bg-card-hover hover:text-foreground"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <span className="text-xs font-semibold">{monthLabel}</span>
        <button
          type="button"
          onClick={nextMonth}
          className="rounded-md p-1 text-muted transition hover:bg-card-hover hover:text-foreground"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Calendar grid */}
      <div>
        <div className="mb-1 grid grid-cols-7">
          {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
            <div key={d} className="py-1 text-center text-[10px] font-medium text-muted/40">
              {d}
            </div>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7">
            {week.map((day, di) => {
              if (!day) return <div key={`e-${di}`} className="aspect-square" />;
              const disabled = day < today;
              const selected = isDaySelected(day);
              const todayCell = isDayToday(day);
              return (
                <button
                  type="button"
                  key={day.getTime()}
                  onClick={() => !disabled && selectDate(day)}
                  disabled={disabled}
                  className={`aspect-square rounded-md text-[11px] transition ${
                    selected
                      ? "bg-accent font-semibold text-white"
                      : todayCell
                        ? "bg-accent/10 font-medium text-accent-light"
                        : disabled
                          ? "cursor-not-allowed text-muted/15"
                          : "text-muted hover:bg-card-hover hover:text-foreground"
                  }`}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Time selector + timezone */}
      <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
        <Clock className="h-3.5 w-3.5 text-muted/60" />
        <select
          value={hour}
          onChange={(e) => updateTime(Number(e.target.value), minute)}
          className="appearance-none bg-transparent font-mono text-sm text-foreground outline-none"
        >
          {Array.from({ length: 24 }, (_, i) => (
            <option key={i} value={i}>
              {String(i).padStart(2, "0")}
            </option>
          ))}
        </select>
        <span className="text-sm text-muted/40">:</span>
        <select
          value={minute}
          onChange={(e) => updateTime(hour, Number(e.target.value))}
          className="appearance-none bg-transparent font-mono text-sm text-foreground outline-none"
        >
          {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
            <option key={m} value={m}>
              {String(m).padStart(2, "0")}
            </option>
          ))}
        </select>
        <div className="ml-auto flex items-center gap-1 text-[10px] text-muted/50">
          <Globe className="h-3 w-3" />
          {tzLabel}
        </div>
      </div>
    </div>
  );
}

function toLocalInput(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function buildMonthGrid(year: number, month: number): (Date | null)[][] {
  const first = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0).getDate();
  let startDow = first.getDay();
  startDow = startDow === 0 ? 6 : startDow - 1;
  const weeks: (Date | null)[][] = [];
  let currentWeek: (Date | null)[] = Array(startDow).fill(null);
  for (let d = 1; d <= lastDay; d++) {
    currentWeek.push(new Date(year, month, d));
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push(null);
    weeks.push(currentWeek);
  }
  return weeks;
}
