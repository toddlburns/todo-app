import { useState, useEffect, useRef } from 'react';
import styles from './NotesEditor.module.css';

export default function NotesEditor({ value, onChange }) {
  const [localValue, setLocalValue] = useState(value || '');
  const textareaRef = useRef(null);

  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  const handleBlur = () => {
    if (localValue !== value) {
      onChange(localValue);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [localValue]);

  return (
    <div className={styles.container}>
      <label className={styles.label}>Notes</label>
      <textarea
        ref={textareaRef}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        placeholder="Add notes..."
        className={styles.textarea}
        rows={2}
      />
    </div>
  );
}
