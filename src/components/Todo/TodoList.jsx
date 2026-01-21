import { useMemo } from 'react';
import useTodoStore from '../../stores/todoStore';
import TodoItem from './TodoItem';
import TodoForm from './TodoForm';
import styles from './TodoList.module.css';

export default function TodoList() {
  const { todos, selectedItems } = useTodoStore();

  const sortedTodos = useMemo(() => {
    // Sort by: incomplete first, then by priority (high to low)
    return [...todos].sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      return b.priority - a.priority;
    });
  }, [todos]);

  const completedCount = todos.filter(t => t.completed).length;
  const totalCount = todos.length;

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
        {sortedTodos.length === 0 ? (
          <div className={styles.empty}>
            <p>No tasks yet</p>
            <p className={styles.emptyHint}>Add a task above to get started</p>
          </div>
        ) : (
          sortedTodos.map(todo => (
            <TodoItem
              key={todo.id}
              todo={todo}
              isSelected={selectedItems.includes(todo.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
