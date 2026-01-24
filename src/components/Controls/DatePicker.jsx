import { useState } from 'react';
import { format, addDays, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, getDay } from 'date-fns';
import styles from './DatePicker.module.css';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function DatePicker({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  // Append T12:00:00 to parse as local noon time to avoid timezone issues
  const [viewDate, setViewDate] = useState(value ? new Date(value + 'T12:00:00') : new Date());

  const selectedDate = value ? new Date(value + 'T12:00:00') : null;

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad start of month with empty cells
  const startPadding = getDay(monthStart);
  const paddedDays = [...Array(startPadding).fill(null), ...days];

  const handleDateSelect = (date) => {
    onChange(format(date, 'yyyy-MM-dd'));
    setIsOpen(false);
  };

  const handleQuickSelect = (daysToAdd) => {
    const newDate = addDays(new Date(), daysToAdd);
    onChange(format(newDate, 'yyyy-MM-dd'));
    setIsOpen(false);
  };

  return (
    <div className={styles.container}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
      >
        {value ? format(new Date(value + 'T12:00:00'), 'MMM d, yyyy') : 'Select date'}
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/>
        </svg>
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          {/* Quick select options */}
          <div className={styles.quickSelect}>
            <button type="button" onClick={() => handleQuickSelect(0)}>Today</button>
            <button type="button" onClick={() => handleQuickSelect(1)}>Tomorrow</button>
            <button type="button" onClick={() => handleQuickSelect(7)}>Next week</button>
          </div>

          {/* Month navigation */}
          <div className={styles.header}>
            <button
              type="button"
              onClick={() => setViewDate(addMonths(viewDate, -1))}
              className={styles.navBtn}
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
              </svg>
            </button>
            <span className={styles.monthYear}>
              {format(viewDate, 'MMMM yyyy')}
            </span>
            <button
              type="button"
              onClick={() => setViewDate(addMonths(viewDate, 1))}
              className={styles.navBtn}
            >
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
              <div key={index} className={styles.cell}>
                {day && (
                  <button
                    type="button"
                    className={`${styles.dayBtn} ${
                      selectedDate && isSameDay(day, selectedDate) ? styles.selected : ''
                    } ${isToday(day) ? styles.today : ''}`}
                    onClick={() => handleDateSelect(day)}
                  >
                    {format(day, 'd')}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
