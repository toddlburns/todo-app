import { useState, useRef, useEffect } from 'react';
import { format, isToday, isTomorrow, isYesterday, isPast } from 'date-fns';
import useTodoStore from '../../stores/todoStore';
import audioService from '../../services/audioService';
import SubItem from './SubItem';
import NotesEditor from './NotesEditor';
import PrioritySelector from '../Controls/PrioritySelector';
import DatePicker from '../Controls/DatePicker';
import RecurrenceSelector from '../Controls/RecurrenceSelector';
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

function formatDateLabel(dateStr) {
  if (!dateStr) return '';
  // Append T12:00:00 to parse as local time (noon) to avoid timezone issues
  const date = new Date(dateStr + 'T12:00:00');
  const shortDate = format(date, 'EEE, MMM d');
  if (isToday(date)) return `Today, ${shortDate}`;
  if (isTomorrow(date)) return `Tomorrow, ${shortDate}`;
  if (isYesterday(date)) return `Yesterday, ${shortDate}`;
  return shortDate;
}

export default function TodoItem({ todo, isSelected, dragHandleProps }) {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);
  const [showSubForm, setShowSubForm] = useState(false);
  const [newSubTitle, setNewSubTitle] = useState('');
  const [notesExpanded, setNotesExpanded] = useState(false);
  const [subItemsCollapsed, setSubItemsCollapsed] = useState(true);
  const menuRef = useRef(null);
  const titleInputRef = useRef(null);

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

  // Focus title input when editing starts
  useEffect(() => {
    if (isEditing && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditing]);

  // Sync editTitle with todo.title when not editing
  useEffect(() => {
    if (!isEditing) {
      setEditTitle(todo.title);
    }
  }, [todo.title, isEditing]);

  const handleToggleComplete = () => {
    toggleComplete(todo.id);

    // Play completion sound
    if (!todo.completed && settings.soundEnabled) {
      audioService.setVolume(settings.soundVolume);
      audioService.playCompletionSound();
    }
  };

  const handleItemClick = (e) => {
    // Don't open menu if clicking checkbox, inside menu, title, or notes
    if (e.target.closest(`.${styles.checkbox}`) ||
        e.target.closest(`.${styles.menu}`) ||
        e.target.closest(`.${styles.title}`) ||
        e.target.closest(`.${styles.editInput}`) ||
        e.target.closest(`.${styles.notesSection}`) ||
        e.target.closest(`.${styles.notesEditor}`)) {
      return;
    }
    setShowMenu(!showMenu);
  };

  const handleTitleClick = (e) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (editTitle.trim()) {
      updateTodo(todo.id, { title: editTitle.trim() });
    } else {
      setEditTitle(todo.title);
    }
    setIsEditing(false);
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      setEditTitle(todo.title);
      setIsEditing(false);
    }
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

  const handleRecurrenceChange = (newRecurrence) => {
    updateTodo(todo.id, { recurrence: newRecurrence });
  };

  const handleDelete = () => {
    deleteTodo(todo.id);
    setShowMenu(false);
  };

  const handleNotesToggle = (e) => {
    e.stopPropagation();
    setNotesExpanded(!notesExpanded);
  };

  const completedSubItems = todo.subItems?.filter(s => s.completed).length || 0;
  const totalSubItems = todo.subItems?.length || 0;

  const dateLabel = formatDateLabel(todo.date);
  const isOverdue = todo.date && isPast(new Date(todo.date + 'T23:59:59')) && !isToday(new Date(todo.date + 'T12:00:00')) && !todo.completed;

  return (
    <div
      className={`${styles.item} ${todo.completed ? styles.completed : ''} ${isSelected ? styles.selected : ''}`}
      style={{ '--priority-color': PRIORITY_COLORS[todo.priority] }}
    >
      <div className={styles.main} onClick={handleItemClick}>
        {/* Drag Handle */}
        <div className={styles.dragHandle} {...dragHandleProps}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
          </svg>
        </div>

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
              ref={titleInputRef}
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleSaveEdit}
              onKeyDown={handleTitleKeyDown}
              className={styles.editInput}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className={styles.title} onClick={handleTitleClick}>{todo.title}</span>
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
              <button
                className={styles.subCount}
                onClick={(e) => {
                  e.stopPropagation();
                  setSubItemsCollapsed(!subItemsCollapsed);
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className={`${styles.subChevron} ${!subItemsCollapsed ? styles.expanded : ''}`}
                >
                  <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                </svg>
                {completedSubItems}/{totalSubItems}
              </button>
            )}
            {todo.recurrence?.enabled && (
              <span className={styles.recurrence}>
                <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
                  <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
                </svg>
                <span className={styles.recurrenceText}>{formatRecurrence(todo.recurrence)}</span>
              </span>
            )}
            {!todo.notes && (
              <button
                className={styles.addNotesInline}
                onClick={(e) => {
                  e.stopPropagation();
                  setNotesExpanded(true);
                }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
                  <path d="M3 18h12v-2H3v2zM3 6v2h18V6H3zm0 7h18v-2H3v2z"/>
                </svg>
                <span className={styles.addNotesText}>Add notes</span>
              </button>
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

      {/* Notes Section - only visible when notes exist */}
      {todo.notes && (
        <div className={styles.notesSection}>
          <button
            className={styles.notesToggle}
            onClick={handleNotesToggle}
          >
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className={`${styles.notesChevron} ${notesExpanded ? styles.expanded : ''}`}
            >
              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
            </svg>
            {!notesExpanded && (
              <span className={styles.notesPreviewText}>{todo.notes}</span>
            )}
          </button>
        </div>
      )}

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

          <div className={styles.menuSection}>
            <label className={styles.menuLabel}>Repeat</label>
            <RecurrenceSelector
              value={todo.recurrence}
              onChange={handleRecurrenceChange}
            />
          </div>

          <div className={styles.menuActions}>
            <button onClick={() => { setShowSubForm(true); setShowMenu(false); }}>
              Add sub-item
            </button>
            <button className={styles.deleteBtn} onClick={handleDelete}>
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Expanded Notes Editor */}
      {notesExpanded && (
        <div className={styles.notesEditor}>
          <NotesEditor
            value={todo.notes}
            onChange={(notes) => updateTodo(todo.id, { notes })}
          />
          <button
            className={styles.notesDoneBtn}
            onClick={(e) => {
              e.stopPropagation();
              setNotesExpanded(false);
            }}
          >
            Done
          </button>
        </div>
      )}

      {/* Sub-items */}
      {((!subItemsCollapsed && todo.subItems?.length > 0) || showSubForm) && (
        <div className={styles.subItems}>
          {!subItemsCollapsed && todo.subItems?.map(subItem => (
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
