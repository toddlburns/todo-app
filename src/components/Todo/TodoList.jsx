import { useMemo } from 'react';
import { format, isToday, isTomorrow, isYesterday, parseISO } from 'date-fns';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import useTodoStore from '../../stores/todoStore';
import TodoItem from './TodoItem';
import TodoForm from './TodoForm';
import styles from './TodoList.module.css';

function formatDayLabel(dateStr) {
  if (!dateStr) return 'No Date';
  const date = new Date(dateStr + 'T12:00:00');
  const fullDate = format(date, 'EEEE, MMMM d');
  if (isToday(date)) return `Today, ${fullDate}`;
  if (isTomorrow(date)) return `Tomorrow, ${fullDate}`;
  if (isYesterday(date)) return `Yesterday, ${fullDate}`;
  return fullDate;
}

function getDayOfWeek(dateStr) {
  if (!dateStr) return 'No Date';
  const date = new Date(dateStr + 'T12:00:00');
  return format(date, 'EEEE');
}

function SortableTodoItem({ todo, isSelected }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <TodoItem
        todo={todo}
        isSelected={isSelected}
        dragHandleProps={listeners}
      />
    </div>
  );
}

export default function TodoList() {
  const { todos, selectedItems, updateTodo } = useTodoStore();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Group todos by date and sort by priority within each group
  const groupedTodos = useMemo(() => {
    // First separate completed and incomplete
    const incomplete = todos.filter(t => !t.completed);
    const completed = todos.filter(t => t.completed);

    // Group incomplete by date
    const groups = {};
    incomplete.forEach(todo => {
      const dateKey = todo.date || 'no-date';
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(todo);
    });

    // Sort each group by priority (1 at top, highest priority first)
    // Priority 1 is most important, so we sort ascending
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => {
        // If both have priority 0 (no priority), maintain order
        if (a.priority === 0 && b.priority === 0) return 0;
        // Items with no priority (0) go to bottom
        if (a.priority === 0) return 1;
        if (b.priority === 0) return -1;
        // Sort by priority ascending (1 before 2 before 3, etc.)
        return a.priority - b.priority;
      });
    });

    // Sort date keys (earliest first, no-date at end)
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      if (a === 'no-date') return 1;
      if (b === 'no-date') return -1;
      return a.localeCompare(b);
    });

    // Build the result array
    const result = sortedKeys.map(dateKey => ({
      date: dateKey === 'no-date' ? null : dateKey,
      label: formatDayLabel(dateKey === 'no-date' ? null : dateKey),
      dayOfWeek: getDayOfWeek(dateKey === 'no-date' ? null : dateKey),
      todos: groups[dateKey],
    }));

    // Add completed section at the end if there are any
    if (completed.length > 0) {
      result.push({
        date: 'completed',
        label: 'Completed',
        dayOfWeek: '',
        todos: completed,
      });
    }

    return result;
  }, [todos]);

  // Flat list of all todo IDs for drag and drop
  const allTodoIds = useMemo(() => {
    return groupedTodos.flatMap(group => group.todos.map(t => t.id));
  }, [groupedTodos]);

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      // Find the todos involved
      const activeTodo = todos.find(t => t.id === active.id);
      const overTodo = todos.find(t => t.id === over.id);

      if (activeTodo && overTodo) {
        // If dropping onto a todo in a different date group, update the date
        if (activeTodo.date !== overTodo.date) {
          updateTodo(active.id, { date: overTodo.date });
        }
        // Note: We could also implement reordering within priority groups
        // by adding a sortOrder field, but for now moving changes the date
      }
    }
  };

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

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className={styles.list}>
          {groupedTodos.length === 0 ? (
            <div className={styles.empty}>
              <p>No tasks yet</p>
              <p className={styles.emptyHint}>Add a task above to get started</p>
            </div>
          ) : (
            groupedTodos.map(group => (
              <div key={group.date || 'no-date'} className={styles.daySection}>
                <h2 className={styles.dayHeader}>{group.label}</h2>
                <SortableContext
                  items={group.todos.map(t => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {group.todos.map(todo => (
                    <SortableTodoItem
                      key={todo.id}
                      todo={todo}
                      isSelected={selectedItems.includes(todo.id)}
                    />
                  ))}
                </SortableContext>
              </div>
            ))
          )}
        </div>
      </DndContext>
    </div>
  );
}
