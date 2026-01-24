import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { getNextOccurrence } from '../utils/recurrence';

// BroadcastChannel for cross-tab sync
const channel = typeof BroadcastChannel !== 'undefined'
  ? new BroadcastChannel('todo-sync')
  : null;

const useTodoStore = create(
  persist(
    (set, get) => ({
      todos: [],
      selectedDate: format(new Date(), 'yyyy-MM-dd'),
      selectedItems: [],
      isAuthenticated: false,
      settings: {
        passwordHash: null,
        githubToken: null,
        githubRepo: null,
        soundEnabled: true,
        soundVolume: 0.5,
      },
      completedOccurrences: {},

      // Auth actions
      setAuthenticated: (value) => set({ isAuthenticated: value }),

      setPasswordHash: (hash) => set((state) => ({
        settings: { ...state.settings, passwordHash: hash }
      })),

      // Settings actions
      updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings }
      })),

      // Date actions
      setSelectedDate: (date) => set({ selectedDate: date }),

      // Selection actions
      toggleSelectItem: (id) => set((state) => ({
        selectedItems: state.selectedItems.includes(id)
          ? state.selectedItems.filter(i => i !== id)
          : [...state.selectedItems, id]
      })),

      clearSelection: () => set({ selectedItems: [] }),

      selectAll: (ids) => set({ selectedItems: ids }),

      // Todo CRUD actions
      addTodo: (todo) => set((state) => ({
        todos: [...state.todos, {
          id: uuidv4(),
          title: todo.title,
          notes: todo.notes || '',
          priority: todo.priority || 0,
          date: todo.date || state.selectedDate,
          completed: false,
          recurrence: todo.recurrence || null,
          subItems: [],
          createdAt: new Date().toISOString(),
        }]
      })),

      updateTodo: (id, updates) => set((state) => ({
        todos: state.todos.map(todo =>
          todo.id === id ? { ...todo, ...updates } : todo
        )
      })),

      deleteTodo: (id) => set((state) => ({
        todos: state.todos.filter(todo => todo.id !== id),
        selectedItems: state.selectedItems.filter(i => i !== id)
      })),

      toggleComplete: (id) => set((state) => ({
        todos: state.todos.map(todo => {
          if (todo.id !== id) return todo;

          // If it's a recurring item and not currently completed, reschedule to next date
          if (todo.recurrence?.enabled && !todo.completed) {
            const nextDate = getNextOccurrence(todo.recurrence, todo.date);
            if (nextDate) {
              return { ...todo, date: nextDate };
            }
          }

          // For non-recurring items, toggle completion
          return { ...todo, completed: !todo.completed };
        })
      })),

      // Recurring item completion tracking
      toggleRecurringComplete: (todoId, date) => set((state) => {
        const key = `${todoId}-${date}`;
        const newOccurrences = { ...state.completedOccurrences };
        if (newOccurrences[key]) {
          delete newOccurrences[key];
        } else {
          newOccurrences[key] = true;
        }
        return { completedOccurrences: newOccurrences };
      }),

      isRecurringCompleted: (todoId, date) => {
        const key = `${todoId}-${date}`;
        return !!get().completedOccurrences[key];
      },

      // Sub-item actions
      addSubItem: (todoId, subItem) => set((state) => ({
        todos: state.todos.map(todo =>
          todo.id === todoId
            ? {
                ...todo,
                subItems: [...todo.subItems, {
                  id: uuidv4(),
                  title: subItem.title,
                  completed: false,
                  priority: subItem.priority || 0,
                }]
              }
            : todo
        )
      })),

      updateSubItem: (todoId, subItemId, updates) => set((state) => ({
        todos: state.todos.map(todo =>
          todo.id === todoId
            ? {
                ...todo,
                subItems: todo.subItems.map(sub =>
                  sub.id === subItemId ? { ...sub, ...updates } : sub
                )
              }
            : todo
        )
      })),

      deleteSubItem: (todoId, subItemId) => set((state) => ({
        todos: state.todos.map(todo =>
          todo.id === todoId
            ? {
                ...todo,
                subItems: todo.subItems.filter(sub => sub.id !== subItemId)
              }
            : todo
        )
      })),

      toggleSubItemComplete: (todoId, subItemId) => set((state) => ({
        todos: state.todos.map(todo =>
          todo.id === todoId
            ? {
                ...todo,
                subItems: todo.subItems.map(sub =>
                  sub.id === subItemId ? { ...sub, completed: !sub.completed } : sub
                )
              }
            : todo
        )
      })),

      // Bulk actions
      bulkMoveTo: (date) => set((state) => ({
        todos: state.todos.map(todo =>
          state.selectedItems.includes(todo.id)
            ? { ...todo, date }
            : todo
        ),
        selectedItems: []
      })),

      bulkDelete: () => set((state) => ({
        todos: state.todos.filter(todo => !state.selectedItems.includes(todo.id)),
        selectedItems: []
      })),

      bulkSetPriority: (priority) => set((state) => ({
        todos: state.todos.map(todo =>
          state.selectedItems.includes(todo.id)
            ? { ...todo, priority }
            : todo
        ),
        selectedItems: []
      })),

      // Import
      importTodos: (newTodos, mode = 'merge') => set((state) => {
        if (mode === 'replace') {
          return { todos: newTodos };
        }
        return { todos: [...state.todos, ...newTodos] };
      }),

      // Get todos for a specific date (including recurring)
      getTodosForDate: (date) => {
        const state = get();
        const regularTodos = state.todos.filter(todo =>
          todo.date === date && !todo.recurrence
        );

        const recurringTodos = state.todos.filter(todo => {
          if (!todo.recurrence?.enabled) return false;
          return isRecurringOnDate(todo, date);
        }).map(todo => ({
          ...todo,
          isRecurringInstance: true,
          instanceDate: date,
          completed: state.isRecurringCompleted(todo.id, date),
        }));

        return [...regularTodos, ...recurringTodos];
      },

      // Export data for GitHub storage
      exportData: () => {
        const state = get();
        return {
          todos: state.todos,
          completedOccurrences: state.completedOccurrences,
          exportedAt: new Date().toISOString(),
        };
      },

      // Import data from GitHub storage
      loadData: (data) => set({
        todos: data.todos || [],
        completedOccurrences: data.completedOccurrences || {},
      }),

      // Broadcast changes to other tabs
      broadcastSync: () => {
        if (channel) {
          const state = get();
          channel.postMessage({
            type: 'SYNC',
            todos: state.todos,
            completedOccurrences: state.completedOccurrences,
            timestamp: Date.now(),
          });
        }
      },

      // Receive sync from other tabs
      receiveSync: (data) => {
        set({
          todos: data.todos || [],
          completedOccurrences: data.completedOccurrences || {},
        });
      },
    }),
    {
      name: 'todo-storage',
      partialize: (state) => ({
        todos: state.todos,
        settings: state.settings,
        completedOccurrences: state.completedOccurrences,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Helper function to check if a recurring todo should appear on a date
function isRecurringOnDate(todo, dateStr) {
  if (!todo.recurrence?.enabled) return false;

  // Parse dates as local time (noon) to avoid timezone issues
  const date = new Date(dateStr + 'T12:00:00');
  const startDate = new Date(todo.date + 'T12:00:00');

  // Don't show before the start date
  if (date < startDate) return false;

  const { pattern, days, interval = 1 } = todo.recurrence;

  switch (pattern) {
    case 'daily': {
      const diffDays = Math.floor((date - startDate) / (1000 * 60 * 60 * 24));
      return diffDays % interval === 0;
    }
    case 'workweek': {
      const dayOfWeek = date.getDay();
      return dayOfWeek >= 1 && dayOfWeek <= 5; // Mon-Fri
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

// Listen for sync messages from other tabs
if (channel) {
  channel.onmessage = (event) => {
    if (event.data.type === 'SYNC') {
      useTodoStore.getState().receiveSync(event.data);
    }
  };
}

// Subscribe to store changes and broadcast
useTodoStore.subscribe((state, prevState) => {
  // Only broadcast if todos or completedOccurrences changed
  if (state.todos !== prevState.todos ||
      state.completedOccurrences !== prevState.completedOccurrences) {
    state.broadcastSync();
  }
});

export default useTodoStore;
