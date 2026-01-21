import { useState } from 'react';
import useTodoStore from '../../stores/todoStore';
import audioService from '../../services/audioService';
import styles from './SubItem.module.css';

const PRIORITY_COLORS = {
  0: 'var(--priority-none)',
  1: 'var(--priority-1)',
  2: 'var(--priority-2)',
  3: 'var(--priority-3)',
  4: 'var(--priority-4)',
  5: 'var(--priority-5)',
};

export default function SubItem({ subItem, todoId }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(subItem.title);

  const { toggleSubItemComplete, updateSubItem, deleteSubItem, settings } = useTodoStore();

  const handleToggle = () => {
    toggleSubItemComplete(todoId, subItem.id);
    if (!subItem.completed && settings.soundEnabled) {
      audioService.setVolume(settings.soundVolume);
      audioService.playCompletionSound();
    }
  };

  const handleSave = () => {
    if (editTitle.trim()) {
      updateSubItem(todoId, subItem.id, { title: editTitle.trim() });
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    deleteSubItem(todoId, subItem.id);
  };

  return (
    <div
      className={`${styles.subItem} ${subItem.completed ? styles.completed : ''}`}
      style={{ '--priority-color': PRIORITY_COLORS[subItem.priority] }}
    >
      <button
        className={styles.checkbox}
        onClick={handleToggle}
        aria-label={subItem.completed ? 'Mark incomplete' : 'Mark complete'}
      >
        {subItem.completed && (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          </svg>
        )}
      </button>

      {isEditing ? (
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          className={styles.editInput}
          autoFocus
        />
      ) : (
        <span
          className={styles.title}
          onDoubleClick={() => setIsEditing(true)}
        >
          {subItem.title}
        </span>
      )}

      <button
        className={styles.deleteBtn}
        onClick={handleDelete}
        aria-label="Delete sub-item"
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </button>
    </div>
  );
}
