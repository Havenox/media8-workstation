import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isBefore,
  startOfDay,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface CustomCalendarProps {
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  disabled?: (date: Date) => boolean;
  className?: string;
}

export function Calendar({
  selected,
  onSelect,
  disabled,
  className = '',
}: CustomCalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState<Date>(
    selected || new Date()
  );

  const today = startOfDay(new Date());

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => addMonths(prev, 1));
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Domingo
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className={`p-4 bg-[#FFFBED] text-[#400404] w-[310px] select-none ${className}`}>
      {/* Month & Nav Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#400404]/15 mb-3">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="p-1.5 rounded-lg text-[#400404] hover:bg-[#400404]/10 transition-colors cursor-pointer"
          title="Mês Anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <span className="text-xs font-bold text-[#400404] capitalize tracking-wide">
          {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
        </span>

        <button
          type="button"
          onClick={handleNextMonth}
          className="p-1.5 rounded-lg text-[#400404] hover:bg-[#400404]/10 transition-colors cursor-pointer"
          title="Próximo Mês"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Weekdays Header */}
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {weekDays.map((day) => (
          <span
            key={day}
            className="text-[11px] font-bold text-[#5C1212] uppercase tracking-wider py-1"
          >
            {day}
          </span>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {calendarDays.map((dayItem) => {
          const isSelected = selected ? isSameDay(dayItem, selected) : false;
          const isCurrentMonth = isSameMonth(dayItem, currentMonth);
          const isToday = isSameDay(dayItem, today);
          const isDisabled = disabled ? disabled(dayItem) : isBefore(startOfDay(dayItem), today);

          let buttonClasses =
            'h-9 w-9 text-xs font-bold rounded-lg flex items-center justify-center transition-all cursor-pointer mx-auto ';

          if (isDisabled) {
            buttonClasses += 'text-[#400404]/30 cursor-not-allowed bg-transparent ';
          } else if (isSelected) {
            buttonClasses +=
              'bg-[#400404] text-[#FFFBED] shadow-md hover:bg-[#5C1212] scale-105 ';
          } else if (isToday) {
            buttonClasses +=
              'bg-[#400404]/10 text-[#400404] border-2 border-[#400404] hover:bg-[#400404]/20 ';
          } else if (!isCurrentMonth) {
            buttonClasses += 'text-[#400404]/40 hover:bg-[#400404]/10 ';
          } else {
            buttonClasses +=
              'text-[#400404] hover:bg-[#400404] hover:text-[#FFFBED] ';
          }

          return (
            <button
              key={dayItem.toISOString()}
              type="button"
              disabled={isDisabled}
              onClick={() => {
                if (!isDisabled && onSelect) {
                  onSelect(dayItem);
                }
              }}
              className={buttonClasses}
            >
              {format(dayItem, 'd')}
            </button>
          );
        })}
      </div>
    </div>
  );
}
