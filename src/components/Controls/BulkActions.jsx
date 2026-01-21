import { useState } from 'react';
import useTodoStore from '../../stores/todoStore';
import PrioritySelector from './PrioritySelector';
import styles from './BulkActions.module.css';

export default function BulkActions() {
  const [showPriority, setShowPriority] = useState(false);

  const {
    selectedItems,
    clearSelection,
    bulkDelete,
    bulkSetPriority,
  } = useTodoStore();

  if (selectedItems.length === 0) {
    return null;
  }

  const handlePrioritySelect = (priority) => {
    bulkSetPriority(priority);
    setShowPriority(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.bar}>
        <span className={styles.count}>
          {selectedItems.length} selected
        </span>

        <div className={styles.actions}>
          <div className={styles.actionWrapper}>
            <button
              className={styles.actionBtn}
              onClick={() => setShowPriority(!showPriority)}
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"/>
              </svg>
              Set priority
            </button>
            {showPriority && (
              <div className={styles.dropdown}>
                <PrioritySelector value={null} onChange={handlePrioritySelect} />
              </div>
            )}
          </div>

          <button
            className={`${styles.actionBtn} ${styles.deleteBtn}`}
            onClick={bulkDelete}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
            Delete
          </button>

          <button
            className={styles.cancelBtn}
            onClick={clearSelection}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
