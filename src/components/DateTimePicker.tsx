"use client";

import { useState } from "react";
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

  const [startOffset, setStartOffset] = useState(0);
  const [hour, setHour] = useState(parsed.getHours());
  const [minute, setMinute] = useState(parsed.getMinutes());

  const selectedDate = value ? new Date(value) : null;

  const tzLabel =
    new Date()
      .toLocaleTimeString("en-US", { timeZoneName: "short" })
      .split(" ")
      .pop() ?? Intl.DateTimeFormat().resolvedOptions().timeZone;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + startOffset + i);
    return d;
  });

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
    setStartOffset(Math.max(0, daysFromNow - 3));
    onChange(toLocalInput(d));
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
    return (
      day.getDate() === today.getDate() &&
      day.getMonth() === today.getMonth() &&
      day.getFullYear() === today.getFullYear()
    );
  }

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return (
    <div className="space-y-2.5">
      {/* Quick presets */}
      <div className="flex flex-wrap gap-1.5">
        {[
          { label: "Tomorrow", days: 1, h: 10 },
          { label: "In 2 days", days: 2, h: 10 },
          { label: "Next week", days: 7, h: 10 },
        ].map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => setPreset(p.days, p.h)}
            className="rounded-md bg-card-hover px-2 py-0.5 text-[11px] text-muted transition hover:bg-accent/10 hover:text-accent-light"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Compact day strip */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setStartOffset(Math.max(0, startOffset - 7))}
          disabled={startOffset === 0}
          className="shrink-0 rounded p-0.5 text-muted transition hover:text-foreground disabled:opacity-20"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <div className="flex flex-1 gap-1">
          {days.map((day) => {
            const selected = isDaySelected(day);
            const isToday = isDayToday(day);
            const showMonth = day.getDate() === 1 || day === days[0];
            return (
              <button
                type="button"
                key={day.getTime()}
                onClick={() => selectDate(day)}
                className={`flex flex-1 flex-col items-center rounded-md py-1.5 text-center transition ${
                  selected
                    ? "bg-accent text-white"
                    : isToday
                      ? "bg-accent/10 text-accent-light"
                      : "text-muted hover:bg-card-hover hover:text-foreground"
                }`}
              >
                <span className="text-[9px] font-medium uppercase leading-none">
                  {dayNames[day.getDay()]}
                </span>
                <span className={`mt-0.5 text-xs leading-none ${selected ? "font-bold" : "font-medium"}`}>
                  {day.getDate()}
                </span>
                {showMonth && (
                  <span className="mt-0.5 text-[8px] leading-none opacity-50">
                    {monthNames[day.getMonth()]}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => setStartOffset(startOffset + 7)}
          className="shrink-0 rounded p-0.5 text-muted transition hover:text-foreground"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Time selector + timezone */}
      <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5">
        <Clock className="h-3 w-3 text-muted/60" />
        <select
          value={hour}
          onChange={(e) => updateTime(Number(e.target.value), minute)}
          className="appearance-none bg-transparent font-mono text-xs text-foreground outline-none"
        >
          {Array.from({ length: 24 }, (_, i) => (
            <option key={i} value={i}>
              {String(i).padStart(2, "0")}
            </option>
          ))}
        </select>
        <span className="text-xs text-muted/40">:</span>
        <select
          value={minute}
          onChange={(e) => updateTime(hour, Number(e.target.value))}
          className="appearance-none bg-transparent font-mono text-xs text-foreground outline-none"
        >
          {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
            <option key={m} value={m}>
              {String(m).padStart(2, "0")}
            </option>
          ))}
        </select>
        <div className="ml-auto flex items-center gap-1 text-[9px] text-muted/50">
          <Globe className="h-2.5 w-2.5" />
          {tzLabel}
        </div>
      </div>
    </div>
  );
}

function toLocalInput(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
