import { useState } from 'react';
import { RECURRENCE_PATTERNS, DAYS_OF_WEEK, formatRecurrence } from '../../utils/recurrence';
import styles from './RecurrenceSelector.module.css';

export default function RecurrenceSelector({ value, onChange }) {
  const [showOptions, setShowOptions] = useState(false);
  const [pattern, setPattern] = useState(value?.pattern || 'weekly');
  const [selectedDays, setSelectedDays] = useState(value?.days || []);

  const handleToggleDay = (day) => {
    const newDays = selectedDays.includes(day)
      ? selectedDays.filter(d => d !== day)
      : [...selectedDays, day].sort((a, b) => a - b);
    setSelectedDays(newDays);
  };

  const handleApply = () => {
    onChange({
      enabled: true,
      pattern,
      days: pattern === 'weekly' ? selectedDays : [],
      interval: 1,
    });
    setShowOptions(false);
  };

  const handleClear = () => {
    onChange(null);
    setSelectedDays([]);
    setShowOptions(false);
  };

  return (
    <div className={styles.container}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setShowOptions(!showOptions)}
      >
        {value?.enabled ? formatRecurrence(value) : 'Does not repeat'}
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M7 10l5 5 5-5z"/>
        </svg>
      </button>

      {showOptions && (
        <div className={styles.dropdown}>
          <div className={styles.patterns}>
            {RECURRENCE_PATTERNS.map((p) => (
              <button
                key={p.value}
                type="button"
                className={`${styles.patternBtn} ${pattern === p.value ? styles.selected : ''}`}
                onClick={() => setPattern(p.value)}
              >
                {p.label}
              </button>
            ))}
          </div>

          {pattern === 'weekly' && (
            <div className={styles.days}>
              <label className={styles.daysLabel}>On these days:</label>
              <div className={styles.dayButtons}>
                {DAYS_OF_WEEK.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    className={`${styles.dayBtn} ${selectedDays.includes(day.value) ? styles.selected : ''}`}
                    onClick={() => handleToggleDay(day.value)}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className={styles.actions}>
            {value?.enabled && (
              <button
                type="button"
                onClick={handleClear}
                className={styles.clearBtn}
              >
                Remove recurrence
              </button>
            )}
            <button
              type="button"
              onClick={handleApply}
              className={styles.applyBtn}
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
