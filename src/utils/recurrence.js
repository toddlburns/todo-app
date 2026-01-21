// Recurrence utility functions

export const RECURRENCE_PATTERNS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

export const DAYS_OF_WEEK = [
  { value: 0, label: 'Sun', fullLabel: 'Sunday' },
  { value: 1, label: 'Mon', fullLabel: 'Monday' },
  { value: 2, label: 'Tue', fullLabel: 'Tuesday' },
  { value: 3, label: 'Wed', fullLabel: 'Wednesday' },
  { value: 4, label: 'Thu', fullLabel: 'Thursday' },
  { value: 5, label: 'Fri', fullLabel: 'Friday' },
  { value: 6, label: 'Sat', fullLabel: 'Saturday' },
];

// Create a recurrence object
export function createRecurrence(pattern, options = {}) {
  return {
    enabled: true,
    pattern,
    days: options.days || [],
    interval: options.interval || 1,
  };
}

// Format recurrence for display
export function formatRecurrence(recurrence) {
  if (!recurrence?.enabled) return 'Does not repeat';

  const { pattern, days, interval = 1 } = recurrence;

  switch (pattern) {
    case 'daily':
      return interval === 1 ? 'Every day' : `Every ${interval} days`;

    case 'weekly':
      if (days?.length > 0) {
        const dayNames = days
          .sort((a, b) => a - b)
          .map(d => DAYS_OF_WEEK[d].label)
          .join(', ');
        return `Every ${dayNames}`;
      }
      return interval === 1 ? 'Every week' : `Every ${interval} weeks`;

    case 'monthly':
      return interval === 1 ? 'Every month' : `Every ${interval} months`;

    case 'yearly':
      return interval === 1 ? 'Every year' : `Every ${interval} years`;

    default:
      return 'Custom';
  }
}

// Check if a todo should appear on a specific date based on recurrence
export function shouldShowOnDate(todo, targetDate) {
  if (!todo.recurrence?.enabled) {
    return todo.date === targetDate;
  }

  const target = new Date(targetDate);
  const start = new Date(todo.date);

  // Don't show before the start date
  if (target < start) return false;

  const { pattern, days, interval = 1 } = todo.recurrence;

  switch (pattern) {
    case 'daily': {
      const diffDays = Math.floor((target - start) / (1000 * 60 * 60 * 24));
      return diffDays % interval === 0;
    }

    case 'weekly': {
      const dayOfWeek = target.getDay();
      if (days && days.length > 0) {
        return days.includes(dayOfWeek);
      }
      // Same day of week as start
      return target.getDay() === start.getDay();
    }

    case 'monthly': {
      const monthsDiff =
        (target.getFullYear() - start.getFullYear()) * 12 +
        (target.getMonth() - start.getMonth());
      return (
        monthsDiff % interval === 0 && target.getDate() === start.getDate()
      );
    }

    case 'yearly': {
      const yearsDiff = target.getFullYear() - start.getFullYear();
      return (
        yearsDiff % interval === 0 &&
        target.getMonth() === start.getMonth() &&
        target.getDate() === start.getDate()
      );
    }

    default:
      return false;
  }
}
