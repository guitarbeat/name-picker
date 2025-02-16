import styles from '../Profile.module.css';

export const SortButton = ({ label, active, direction, onClick }) => (
  <button
    onClick={onClick}
    className={`${styles.sortButton} ${active ? styles.activeSort : ''}`}
  >
    {label}
    {active && <SortIndicator direction={direction} />}
  </button>
);

export const SortIndicator = ({ direction }) => (
  <span className={styles.sortDirection}>
    {direction === 'asc' ? '↑' : '↓'}
  </span>
);

export const ChartToggle = ({ children, className, onClick }) => (
  <button className={className} onClick={onClick}>
    {children}
  </button>
); 