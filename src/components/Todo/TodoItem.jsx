import { useState, useRef, useEffect } from 'react';
import useTodoStore from '../../stores/todoStore';
import audioService from '../../services/audioService';
import SubItem from './SubItem';
import NotesEditor from './NotesEditor';
import PrioritySelector from '../Controls/PrioritySelector';
import RecurrenceSelector from '../Controls/RecurrenceSelector';
import DatePicker from '../Controls/DatePicker';
import { formatRecurrence } from '../../utils/recurrence';
import styles from './TodoItem.module.css';

const PRIORITY_COLORS = {
  0: 'var(--priority-none)',
  1: 'var(--priority-1)',
  2: 'var(--priority-2)',
  3: 'var(--priority-3)',
  4: 'var(--priority-4)',
  5: 'var(--priority-5)',
};

export default function TodoItem({ todo, isSelected }) {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);
  const [showSubForm, setShowSubForm] = useState(false);
  const [newSubTitle, setNewSubTitle] = useState('');
  const [expanded, setExpanded] = useState(false);
  const menuRef = useRef(null);

  const {
    toggleComplete,
    toggleRecurringComplete,
    updateTodo,
    deleteTodo,
    toggleSelectItem,
    addSubItem,
    settings,
  } = useTodoStore();

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    }
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const handleToggleComplete = () => {
    if (todo.isRecurringInstance) {
      toggleRecurringComplete(todo.id, todo.instanceDate);
    } else {
      toggleComplete(todo.id);
    }

    // Play completion sound
    if (!todo.completed && settings.soundEnabled) {
      audioService.setVolume(settings.soundVolume);
      audioService.playCompletionSound();
    }
  };

  const handleItemClick = (e) => {
    // Don't open menu if clicking checkbox or inside menu
    if (e.target.closest(`.${styles.checkbox}`) || e.target.closest(`.${styles.menu}`)) {
      return;
    }
    setShowMenu(!showMenu);
  };

  const handleSaveEdit = () => {
    if (editTitle.trim()) {
      updateTodo(todo.id, { title: editTitle.trim() });
    }
    setIsEditing(false);
  };

  const handleAddSubItem = (e) => {
    e.preventDefault();
    if (newSubTitle.trim()) {
      addSubItem(todo.id, { title: newSubTitle.trim() });
      setNewSubTitle('');
      setShowSubForm(false);
    }
  };

  const handleDateChange = (newDate) => {
    updateTodo(todo.id, { date: newDate });
    setShowMenu(false);
  };

  const handlePriorityChange = (newPriority) => {
    updateTodo(todo.id, { priority: newPriority });
  };

  const handleRecurrenceChange = (recurrence) => {
    updateTodo(todo.id, { recurrence });
  };

  const handleDelete = () => {
    deleteTodo(todo.id);
    setShowMenu(false);
  };

  const completedSubItems = todo.subItems?.filter(s => s.completed).length || 0;
  const totalSubItems = todo.subItems?.length || 0;

  return (
    <div
      className={`${styles.item} ${todo.completed ? styles.completed : ''} ${isSelected ? styles.selected : ''}`}
      style={{ '--priority-color': PRIORITY_COLORS[todo.priority] }}
    >
      <div className={styles.main} onClick={handleItemClick}>
        <button
          className={styles.checkbox}
          onClick={(e) => {
            e.stopPropagation();
            handleToggleComplete();
          }}
          aria-label={todo.completed ? 'Mark incomplete' : 'Mark complete'}
        >
          {todo.completed && (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
          )}
        </button>

        <div className={styles.content}>
          {isEditing ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleSaveEdit}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
              className={styles.editInput}
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className={styles.title}>{todo.title}</span>
          )}

          {(todo.recurrence?.enabled || totalSubItems > 0) && (
            <div className={styles.meta}>
              {todo.recurrence?.enabled && (
                <span className={styles.recurrence}>
                  <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
                    <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
                  </svg>
                  {formatRecurrence(todo.recurrence)}
                </span>
              )}
              {totalSubItems > 0 && (
                <span className={styles.subCount}>
                  {completedSubItems}/{totalSubItems}
                </span>
              )}
            </div>
          )}
        </div>

        <button
          className={styles.selectBtn}
          onClick={(e) => {
            e.stopPropagation();
            toggleSelectItem(todo.id);
          }}
          aria-label="Select item"
        >
          <svg viewBox="0 0 24 24" fill={isSelected ? 'var(--accent-color)' : 'currentColor'}>
            {isSelected ? (
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            ) : (
              <path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/>
            )}
          </svg>
        </button>
      </div>

      {/* Dropdown Menu */}
      {showMenu && (
        <div className={styles.menu} ref={menuRef}>
          <div className={styles.menuSection}>
            <label className={styles.menuLabel}>Move to date</label>
            <DatePicker
              value={todo.date}
              onChange={handleDateChange}
            />
          </div>

          <div className={styles.menuSection}>
            <label className={styles.menuLabel}>Priority</label>
            <PrioritySelector
              value={todo.priority}
              onChange={handlePriorityChange}
            />
          </div>

          <div className={styles.menuSection}>
            <label className={styles.menuLabel}>Repeat</label>
            <RecurrenceSelector
              value={todo.recurrence}
              onChange={handleRecurrenceChange}
            />
          </div>

          <div className={styles.menuActions}>
            <button onClick={() => { setIsEditing(true); setShowMenu(false); }}>
              Edit title
            </button>
            <button onClick={() => { setExpanded(!expanded); setShowMenu(false); }}>
              {expanded ? 'Hide details' : 'Show details'}
            </button>
            <button onClick={() => { setShowSubForm(true); setShowMenu(false); }}>
              Add sub-item
            </button>
            <button className={styles.deleteBtn} onClick={handleDelete}>
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Expanded Details */}
      {expanded && (
        <div className={styles.details}>
          <NotesEditor
            value={todo.notes}
            onChange={(notes) => updateTodo(todo.id, { notes })}
          />
        </div>
      )}

      {/* Sub-items */}
      {(todo.subItems?.length > 0 || showSubForm) && (
        <div className={styles.subItems}>
          {todo.subItems?.map(subItem => (
            <SubItem
              key={subItem.id}
              subItem={subItem}
              todoId={todo.id}
            />
          ))}

          {showSubForm && (
            <form onSubmit={handleAddSubItem} className={styles.subForm}>
              <input
                type="text"
                value={newSubTitle}
                onChange={(e) => setNewSubTitle(e.target.value)}
                placeholder="Add sub-item..."
                autoFocus
              />
              <button type="submit">Add</button>
              <button type="button" onClick={() => setShowSubForm(false)}>Cancel</button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
