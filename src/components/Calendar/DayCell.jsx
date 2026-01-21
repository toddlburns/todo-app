import { format } from 'date-fns';
import styles from './DayCell.module.css';

export default function DayCell({ day, isSelected, isToday, todoCount, onClick }) {
  if (!day) {
    return <div className={styles.empty} />;
  }

  return (
    <button
      className={`${styles.cell} ${isSelected ? styles.selected : ''} ${isToday ? styles.today : ''}`}
      onClick={onClick}
    >
      <span className={styles.date}>{format(day, 'd')}</span>
      {todoCount > 0 && (
        <span className={styles.count}>{todoCount > 9 ? '9+' : todoCount}</span>
      )}
    </button>
  );
}
