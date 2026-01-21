import { useState, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import useTodoStore from '../../stores/todoStore';
import styles from './TodoistImport.module.css';

export default function TodoistImport({ onClose }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('merge'); // merge or replace
  const fileInputRef = useRef(null);

  const { importTodos } = useTodoStore();

  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError('');

    try {
      const text = await selectedFile.text();
      const parsed = parseFile(selectedFile.name, text);
      setPreview(parsed.slice(0, 10)); // Show first 10 items
    } catch (err) {
      setError('Failed to parse file. Make sure it\'s a valid Todoist export.');
      setPreview([]);
    }
  };

  const parseFile = (filename, content) => {
    if (filename.endsWith('.json')) {
      return parseJSON(content);
    } else if (filename.endsWith('.csv')) {
      return parseCSV(content);
    } else {
      throw new Error('Unsupported file format');
    }
  };

  const parseJSON = (content) => {
    const data = JSON.parse(content);
    // Handle Todoist JSON export format
    const items = data.items || data.tasks || data;

    if (!Array.isArray(items)) {
      throw new Error('Invalid JSON format');
    }

    return items.map(item => ({
      id: uuidv4(),
      title: item.content || item.title || item.name || '',
      notes: item.description || item.notes || '',
      priority: mapTodoistPriority(item.priority),
      date: item.due?.date || item.due_date || new Date().toISOString().split('T')[0],
      completed: item.checked === 1 || item.completed === true,
      recurrence: null,
      subItems: [],
      createdAt: item.added_at || item.created_at || new Date().toISOString(),
    })).filter(item => item.title);
  };

  const parseCSV = (content) => {
    const lines = content.split('\n');
    const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''));

    const contentIdx = headers.findIndex(h => h === 'content' || h === 'task' || h === 'title');
    const descIdx = headers.findIndex(h => h === 'description' || h === 'notes');
    const priorityIdx = headers.findIndex(h => h === 'priority');
    const dateIdx = headers.findIndex(h => h === 'date' || h === 'due date' || h === 'due_date');

    const items = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Simple CSV parsing (doesn't handle all edge cases)
      const values = parseCSVLine(line);

      const title = contentIdx >= 0 ? values[contentIdx] : values[0];
      if (!title) continue;

      items.push({
        id: uuidv4(),
        title: title.replace(/"/g, ''),
        notes: descIdx >= 0 ? (values[descIdx] || '').replace(/"/g, '') : '',
        priority: priorityIdx >= 0 ? mapTodoistPriority(parseInt(values[priorityIdx]) || 4) : 0,
        date: dateIdx >= 0 ? parseDate(values[dateIdx]) : new Date().toISOString().split('T')[0],
        completed: false,
        recurrence: null,
        subItems: [],
        createdAt: new Date().toISOString(),
      });
    }

    return items;
  };

  const parseCSVLine = (line) => {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    return values;
  };

  const parseDate = (dateStr) => {
    if (!dateStr) return new Date().toISOString().split('T')[0];

    const cleaned = dateStr.replace(/"/g, '').trim();
    try {
      const date = new Date(cleaned);
      if (isNaN(date.getTime())) {
        return new Date().toISOString().split('T')[0];
      }
      return date.toISOString().split('T')[0];
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  };

  const mapTodoistPriority = (todoistPriority) => {
    // Todoist: 1=highest, 4=none
    // Our app: 0=none, 5=highest
    switch (todoistPriority) {
      case 1: return 5;
      case 2: return 4;
      case 3: return 2;
      case 4:
      default: return 0;
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const todos = parseFile(file.name, text);
      importTodos(todos, mode);
      onClose();
    } catch (err) {
      setError('Failed to import: ' + err.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h2 className={styles.title}>Import from Todoist</h2>

        <div className={styles.instructions}>
          <p>Export your tasks from Todoist:</p>
          <ol>
            <li>Go to Todoist Settings → Backups</li>
            <li>Click "Create backup" or use an existing one</li>
            <li>Download the CSV or JSON file</li>
            <li>Upload it below</li>
          </ol>
        </div>

        <div
          className={styles.dropzone}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.json"
            onChange={handleFileSelect}
            className={styles.fileInput}
          />
          {file ? (
            <div className={styles.fileInfo}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
              </svg>
              <span>{file.name}</span>
            </div>
          ) : (
            <div className={styles.placeholder}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/>
              </svg>
              <span>Click to select a file or drag and drop</span>
              <span className={styles.hint}>Supports CSV and JSON exports</span>
            </div>
          )}
        </div>

        {error && <p className={styles.error}>{error}</p>}

        {preview.length > 0 && (
          <div className={styles.preview}>
            <h3>Preview ({preview.length} items shown)</h3>
            <ul>
              {preview.map((item, i) => (
                <li key={i}>{item.title}</li>
              ))}
            </ul>
          </div>
        )}

        {file && (
          <div className={styles.modeSelector}>
            <label>
              <input
                type="radio"
                name="mode"
                value="merge"
                checked={mode === 'merge'}
                onChange={() => setMode('merge')}
              />
              Merge with existing tasks
            </label>
            <label>
              <input
                type="radio"
                name="mode"
                value="replace"
                checked={mode === 'replace'}
                onChange={() => setMode('replace')}
              />
              Replace all existing tasks
            </label>
          </div>
        )}

        <div className={styles.actions}>
          <button onClick={onClose} className={styles.cancelBtn}>
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!file || importing}
            className={styles.importBtn}
          >
            {importing ? 'Importing...' : 'Import'}
          </button>
        </div>
      </div>
    </div>
  );
}
