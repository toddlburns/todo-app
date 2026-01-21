import { useState, useRef, useEffect } from 'react';
import { format, isToday, isTomorrow, isYesterday, isPast } from 'date-fns';
import useTodoStore from '../../stores/todoStore';
import audioService from '../../services/audioService';
import SubItem from './SubItem';
import NotesEditor from './NotesEditor';
import PrioritySelector from '../Controls/PrioritySelector';
import DatePicker from '../Controls/DatePicker';
import styles from './TodoItem.module.css';

const PRIORITY_COLORS = {
  0: 'var(--priority-none)',
  1: 'var(--priority-1)',
  2: 'var(--priority-2)',
  3: 'var(--priority-3)',
  4: 'var(--priority-4)',
  5: 'var(--priority-5)',
};

function formatDateLabel(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMM d');
}

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
    toggleComplete(todo.id);

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

  const handlePriorityChange = (newPriority) => {
    updateTodo(todo.id, { priority: newPriority });
  };

  const handleDateChange = (newDate) => {
    updateTodo(todo.id, { date: newDate });
  };

  const handleDelete = () => {
    deleteTodo(todo.id);
    setShowMenu(false);
  };

  const completedSubItems = todo.subItems?.filter(s => s.completed).length || 0;
  const totalSubItems = todo.subItems?.length || 0;

  const dateLabel = formatDateLabel(todo.date);
  const isOverdue = todo.date && isPast(new Date(todo.date)) && !isToday(new Date(todo.date)) && !todo.completed;

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

          <div className={styles.meta}>
            {dateLabel && (
              <span className={`${styles.date} ${isOverdue ? styles.overdue : ''}`}>
                <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
                  <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/>
                </svg>
                {dateLabel}
              </span>
            )}
            {totalSubItems > 0 && (
              <span className={styles.subCount}>
                {completedSubItems}/{totalSubItems}
              </span>
            )}
          </div>
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
            <label className={styles.menuLabel}>Date</label>
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

          <div className={styles.menuActions}>
            <button onClick={() => { setIsEditing(true); setShowMenu(false); }}>
              Edit title
            </button>
            <button onClick={() => { setExpanded(!expanded); setShowMenu(false); }}>
              {expanded ? 'Hide notes' : 'Show notes'}
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
