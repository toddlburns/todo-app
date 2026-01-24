import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import useTodoStore from '../../stores/todoStore';
import { findSimilarItems } from '../../utils/similarity';
import VoiceInput from '../Controls/VoiceInput';
import PrioritySelector from '../Controls/PrioritySelector';
import DatePicker from '../Controls/DatePicker';
import RecurrenceSelector from '../Controls/RecurrenceSelector';
import styles from './TodoForm.module.css';

export default function TodoForm() {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState(0);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [recurrence, setRecurrence] = useState(null);
  const [showOptions, setShowOptions] = useState(false);
  const [similarItems, setSimilarItems] = useState([]);
  const [showSimilar, setShowSimilar] = useState(false);
  const inputRef = useRef(null);

  const { addTodo, addSubItem, todos } = useTodoStore();

  // Find similar items as user types
  useEffect(() => {
    if (title.length >= 3) {
      const similar = findSimilarItems(title, todos, 0.4);
      setSimilarItems(similar);
      setShowSimilar(similar.length > 0);
    } else {
      setSimilarItems([]);
      setShowSimilar(false);
    }
  }, [title, todos]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    addTodo({
      title: title.trim(),
      priority,
      date,
      recurrence,
    });

    setTitle('');
    setPriority(0);
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setRecurrence(null);
    setShowSimilar(false);
    setShowOptions(false);
    inputRef.current?.focus();
  };

  const handleAddAsSubItem = (parentTodo) => {
    addSubItem(parentTodo.id, {
      title: title.trim(),
      priority,
    });

    setTitle('');
    setPriority(0);
    setShowSimilar(false);
    setShowOptions(false);
    inputRef.current?.focus();
  };

  const handleVoiceResult = (transcript) => {
    setTitle(transcript);
    inputRef.current?.focus();
  };

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputWrapper}>
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add a task..."
            className={styles.input}
          />

          <div className={styles.actions}>
            <button
              type="button"
              className={`${styles.optionsBtn} ${showOptions ? styles.active : ''}`}
              onClick={() => setShowOptions(!showOptions)}
              title="Set date and priority"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z"/>
              </svg>
            </button>

            <VoiceInput onResult={handleVoiceResult} />

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={!title.trim()}
            >
              Add
            </button>
          </div>
        </div>

        {showOptions && (
          <div className={styles.optionsRow}>
            <div className={styles.optionGroup}>
              <label className={styles.optionLabel}>Date</label>
              <DatePicker value={date} onChange={setDate} />
            </div>
            <div className={styles.optionGroup}>
              <label className={styles.optionLabel}>Priority</label>
              <PrioritySelector value={priority} onChange={setPriority} />
            </div>
            <div className={styles.optionGroup}>
              <label className={styles.optionLabel}>Repeat</label>
              <RecurrenceSelector value={recurrence} onChange={setRecurrence} />
            </div>
          </div>
        )}
      </form>

      {/* Similar Items Suggestions */}
      {showSimilar && (
        <div className={styles.similar}>
          <p className={styles.similarLabel}>Similar items found:</p>
          {similarItems.map(({ item, score }) => (
            <div key={item.id} className={styles.similarItem}>
              <span className={styles.similarTitle}>
                {item.title}
                <span className={styles.similarScore}>
                  {Math.round(score * 100)}% match
                </span>
              </span>
              <button
                type="button"
                onClick={() => handleAddAsSubItem(item)}
                className={styles.addSubBtn}
              >
                Add as sub-item
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setShowSimilar(false)}
            className={styles.dismissBtn}
          >
            Create new item instead
          </button>
        </div>
      )}
    </div>
  );
}
