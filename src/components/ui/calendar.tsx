import React from 'react';

interface CalendarProps {
  mode?: 'single' | 'multiple' | 'range';
  selected?: Date | Date[];
  onSelect?: (date: Date | Date[] | undefined) => void;
  className?: string;
  initialFocus?: boolean;
}

export function Calendar({
  mode = 'single',
  selected,
  onSelect,
  className = '',
  initialFocus = false
}: CalendarProps) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = React.useState(today);

  const handleDateClick = (date: Date) => {
    if (mode === 'single') {
      onSelect?.(date);
    } else if (mode === 'multiple') {
      const currentSelected = Array.isArray(selected) ? selected : [];
      const isSelected = currentSelected.some(d => d.toDateString() === date.toDateString());

      if (isSelected) {
        onSelect?.(currentSelected.filter(d => d.toDateString() !== date.toDateString()));
      } else {
        onSelect?.([...currentSelected, date]);
      }
    }
  };

  const isSelected = (date: Date) => {
    if (!selected) return false;

    if (mode === 'single' && !Array.isArray(selected)) {
      return selected.toDateString() === date.toDateString();
    } else if (mode === 'multiple' && Array.isArray(selected)) {
      return selected.some(d => d.toDateString() === date.toDateString());
    }

    return false;
  };

  const renderCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-8 w-8" />);
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isToday = date.toDateString() === today.toDateString();
      const isCurrentSelected = isSelected(date);

      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(date)}
          className={`
            h-8 w-8 text-sm rounded-md hover:bg-accent hover:text-accent-foreground
            ${isToday ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}
            ${isCurrentSelected ? 'bg-secondary text-secondary-foreground' : ''}
          `}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <div className={`p-3 bg-background ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
          className="p-1 hover:bg-accent rounded-md"
        >
          ‹
        </button>
        <div className="font-semibold">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </div>
        <button
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
          className="p-1 hover:bg-accent rounded-md"
        >
          ›
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map(day => (
          <div key={day} className="h-8 w-8 text-xs text-muted-foreground flex items-center justify-center">
            {day}
          </div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-1">
        {renderCalendarDays()}
      </div>
    </div>
  );
}