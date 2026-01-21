import { useState, useEffect, useRef } from 'react';
import useTodoStore from '../../stores/todoStore';
import { findSimilarItems } from '../../utils/similarity';
import VoiceInput from '../Controls/VoiceInput';
import PrioritySelector from '../Controls/PrioritySelector';
import styles from './TodoForm.module.css';

export default function TodoForm() {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState(0);
  const [showPriority, setShowPriority] = useState(false);
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
    });

    setTitle('');
    setPriority(0);
    setShowSimilar(false);
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
              className={`${styles.priorityBtn} ${showPriority ? styles.active : ''}`}
              onClick={() => setShowPriority(!showPriority)}
              title="Set priority"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"/>
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

        {showPriority && (
          <div className={styles.priorityRow}>
            <PrioritySelector value={priority} onChange={setPriority} />
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
