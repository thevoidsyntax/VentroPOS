import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { Button } from './button';

export interface CalendarProps {
  mode?: 'single' | 'range';
  selected?: {
    from?: Date;
    to?: Date;
  };
  onSelect?: (range: { from?: Date; to?: Date }) => void;
  numberOfMonths?: number;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isInRange(date: Date, from?: Date, to?: Date): boolean {
  if (!from || !to) return false;
  return date >= from && date <= to;
}

export function Calendar({
  mode = 'single',
  selected,
  onSelect,
  numberOfMonths = 1,
  disabled,
  minDate,
  maxDate,
}: CalendarProps) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = React.useState(
    selected?.from || today
  );

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfMonth = getFirstDayOfMonth(year, month);

  const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const prevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const handleSelect = (day: number) => {
    const selectedDate = new Date(year, month, day);

    if (disabled) {
      if (minDate && selectedDate < minDate) return;
      if (maxDate && selectedDate > maxDate) return;
    }

    if (mode === 'single') {
      onSelect?.({ from: selectedDate, to: selectedDate });
    } else {
      // Range mode
      if (!selected?.from || (selected.from && selected.to)) {
        // Start new range
        onSelect?.({ from: selectedDate });
      } else {
        // Complete range
        if (selectedDate < selected.from) {
          onSelect?.({ from: selectedDate, to: selected.from });
        } else {
          onSelect?.({ from: selected.from, to: selectedDate });
        }
      }
    }
  };

  const isSelected = (day: number): boolean => {
    const date = new Date(year, month, day);
    if (mode === 'single') {
      return selected?.from ? isSameDay(date, selected.from) : false;
    }
    return selected?.from && selected?.to
      ? isInRange(date, selected.from, selected.to) ||
          isSameDay(date, selected.from) ||
          isSameDay(date, selected.to)
      : false;
  };

  const isStart = (day: number): boolean => {
    if (!selected?.from) return false;
    return isSameDay(new Date(year, month, day), selected.from);
  };

  const isEnd = (day: number): boolean => {
    if (!selected?.to) return false;
    return isSameDay(new Date(year, month, day), selected.to);
  };

  const isDisabled = (day: number): boolean => {
    const date = new Date(year, month, day);
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  const monthName = new Intl.DateTimeFormat('id-ID', {
    month: 'long',
    year: 'numeric',
  }).format(currentMonth);

  const cells: React.ReactNode[] = [];

  // Empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    cells.push(
      <div key={`empty-${i}`} className="w-10 h-10" />
    );
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const disabled = isDisabled(day);
    const selected = isSelected(day);
    const start = isStart(day);
    const end = isEnd(day);

    cells.push(
      <button
        key={day}
        onClick={() => handleSelect(day)}
        disabled={disabled}
        className={cn(
          'w-10 h-10 rounded-md text-sm transition-colors',
          disabled && 'text-muted-foreground opacity-50 cursor-not-allowed',
          !disabled && !selected && 'hover:bg-accent',
          selected && !start && !end && 'bg-accent',
          (start || end) && 'bg-primary text-primary-foreground',
          selected && 'font-medium'
        )}
      >
        {day}
      </button>
    );
  }

  return (
    <div className="p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={prevMonth}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium">{monthName}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={nextMonth}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Days header */}
      <div className="grid grid-cols-7 mb-2">
        {days.map((d) => (
          <div
            key={d}
            className="w-10 h-10 flex items-center justify-center text-xs text-muted-foreground"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">{cells}</div>
    </div>
  );
}
