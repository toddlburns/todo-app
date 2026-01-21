import styles from './PrioritySelector.module.css';

const PRIORITIES = [
  { value: 0, label: 'None', color: 'var(--priority-none)' },
  { value: 1, label: 'P1', color: 'var(--priority-1)' },
  { value: 2, label: 'P2', color: 'var(--priority-2)' },
  { value: 3, label: 'P3', color: 'var(--priority-3)' },
  { value: 4, label: 'P4', color: 'var(--priority-4)' },
  { value: 5, label: 'P5', color: 'var(--priority-5)' },
];

export default function PrioritySelector({ value, onChange }) {
  return (
    <div className={styles.container}>
      {PRIORITIES.map((p) => (
        <button
          key={p.value}
          type="button"
          className={`${styles.option} ${value === p.value ? styles.selected : ''}`}
          style={{ '--priority-color': p.color }}
          onClick={() => onChange(p.value)}
          title={p.value === 0 ? 'No priority' : `Priority ${p.value}`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
