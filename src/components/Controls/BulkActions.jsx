import { useState } from 'react';
import useTodoStore from '../../stores/todoStore';
import DatePicker from './DatePicker';
import PrioritySelector from './PrioritySelector';
import styles from './BulkActions.module.css';

export default function BulkActions() {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPriority, setShowPriority] = useState(false);

  const {
    selectedItems,
    clearSelection,
    bulkMoveTo,
    bulkDelete,
    bulkSetPriority,
  } = useTodoStore();

  if (selectedItems.length === 0) {
    return null;
  }

  const handleDateSelect = (date) => {
    bulkMoveTo(date);
    setShowDatePicker(false);
  };

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
              onClick={() => {
                setShowDatePicker(!showDatePicker);
                setShowPriority(false);
              }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/>
              </svg>
              Move to date
            </button>
            {showDatePicker && (
              <div className={styles.dropdown}>
                <DatePicker onChange={handleDateSelect} />
              </div>
            )}
          </div>

          <div className={styles.actionWrapper}>
            <button
              className={styles.actionBtn}
              onClick={() => {
                setShowPriority(!showPriority);
                setShowDatePicker(false);
              }}
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
