import { useMemo } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, getDay } from 'date-fns';
import useTodoStore from '../../stores/todoStore';
import DayCell from './DayCell';
import styles from './CalendarView.module.css';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarView({ viewDate, onViewDateChange }) {
  const { todos, selectedDate, setSelectedDate } = useTodoStore();

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad start of month with empty cells
  const startPadding = getDay(monthStart);
  const paddedDays = [...Array(startPadding).fill(null), ...days];

  // Get todo counts per day for the visible month
  const todoCounts = useMemo(() => {
    const counts = {};
    days.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const count = getTodoCountForDate(todos, dateStr);
      if (count > 0) {
        counts[dateStr] = count;
      }
    });
    return counts;
  }, [todos, days]);

  const handlePrevMonth = () => {
    onViewDateChange(subMonths(viewDate, 1));
  };

  const handleNextMonth = () => {
    onViewDateChange(addMonths(viewDate, 1));
  };

  const handleToday = () => {
    const today = new Date();
    onViewDateChange(today);
    setSelectedDate(format(today, 'yyyy-MM-dd'));
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button onClick={handlePrevMonth} className={styles.navBtn}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
          </svg>
        </button>

        <div className={styles.title}>
          <h2>{format(viewDate, 'MMMM yyyy')}</h2>
          <button onClick={handleToday} className={styles.todayBtn}>
            Today
          </button>
        </div>

        <button onClick={handleNextMonth} className={styles.navBtn}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
          </svg>
        </button>
      </div>

      {/* Weekday headers */}
      <div className={styles.weekdays}>
        {WEEKDAYS.map((day) => (
          <div key={day} className={styles.weekday}>{day}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className={styles.grid}>
        {paddedDays.map((day, index) => (
          <DayCell
            key={index}
            day={day}
            isSelected={day && isSameDay(day, new Date(selectedDate))}
            isToday={day && isToday(day)}
            todoCount={day ? todoCounts[format(day, 'yyyy-MM-dd')] || 0 : 0}
            onClick={() => day && setSelectedDate(format(day, 'yyyy-MM-dd'))}
          />
        ))}
      </div>
    </div>
  );
}

// Helper to count todos for a specific date (including recurring)
function getTodoCountForDate(todos, dateStr) {
  let count = 0;

  todos.forEach(todo => {
    // Non-recurring todo for this date
    if (todo.date === dateStr && !todo.recurrence?.enabled) {
      count++;
      count += todo.subItems?.length || 0;
      return;
    }

    // Recurring todo that appears on this date
    if (todo.recurrence?.enabled && shouldShowOnDate(todo, dateStr)) {
      count++;
      count += todo.subItems?.length || 0;
    }
  });

  return count;
}

// Check if a recurring todo should appear on a date
function shouldShowOnDate(todo, dateStr) {
  const date = new Date(dateStr);
  const startDate = new Date(todo.date);

  if (date < startDate) return false;

  const { pattern, days, interval = 1 } = todo.recurrence;

  switch (pattern) {
    case 'daily': {
      const diffDays = Math.floor((date - startDate) / (1000 * 60 * 60 * 24));
      return diffDays % interval === 0;
    }
    case 'weekly': {
      const dayOfWeek = date.getDay();
      if (days && days.length > 0) {
        return days.includes(dayOfWeek);
      }
      return date.getDay() === startDate.getDay();
    }
    case 'monthly': {
      return date.getDate() === startDate.getDate();
    }
    case 'yearly': {
      return date.getDate() === startDate.getDate() &&
             date.getMonth() === startDate.getMonth();
    }
    default:
      return false;
  }
}
