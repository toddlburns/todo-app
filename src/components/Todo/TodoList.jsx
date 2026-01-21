import { useMemo } from 'react';
import useTodoStore from '../../stores/todoStore';
import TodoItem from './TodoItem';
import TodoForm from './TodoForm';
import styles from './TodoList.module.css';

export default function TodoList() {
  const { todos, selectedDate, completedOccurrences, selectedItems } = useTodoStore();

  const todosForDate = useMemo(() => {
    // Get regular (non-recurring) todos for this date
    const regularTodos = todos.filter(todo =>
      todo.date === selectedDate && !todo.recurrence?.enabled
    );

    // Get recurring todos that should appear on this date
    const recurringTodos = todos.filter(todo => {
      if (!todo.recurrence?.enabled) return false;
      return shouldShowOnDate(todo, selectedDate);
    }).map(todo => ({
      ...todo,
      isRecurringInstance: true,
      instanceDate: selectedDate,
      completed: !!completedOccurrences[`${todo.id}-${selectedDate}`],
    }));

    const allTodos = [...regularTodos, ...recurringTodos];

    // Sort by priority (high to low), then by completion status
    return allTodos.sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      return b.priority - a.priority;
    });
  }, [todos, selectedDate, completedOccurrences]);

  const completedCount = todosForDate.filter(t => t.completed).length;
  const totalCount = todosForDate.length;

  return (
    <div className={styles.container}>
      <TodoForm />

      {totalCount > 0 && (
        <div className={styles.progress}>
          <span>{completedCount} of {totalCount} completed</span>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${(completedCount / totalCount) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className={styles.list}>
        {todosForDate.length === 0 ? (
          <div className={styles.empty}>
            <p>No tasks for this day</p>
            <p className={styles.emptyHint}>Add a task above to get started</p>
          </div>
        ) : (
          todosForDate.map(todo => (
            <TodoItem
              key={todo.isRecurringInstance ? `${todo.id}-${selectedDate}` : todo.id}
              todo={todo}
              isSelected={selectedItems.includes(todo.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// Helper function to check if a recurring todo should appear on a date
function shouldShowOnDate(todo, dateStr) {
  if (!todo.recurrence?.enabled) return false;

  const date = new Date(dateStr);
  const startDate = new Date(todo.date);

  // Don't show before the start date
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
