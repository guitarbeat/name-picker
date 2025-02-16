import { SORT_CONFIG } from '../constants';
import { SortIndicator } from './SortComponents';
import styles from '../Profile.module.css';

export const SortControls = ({ type, sortConfig, handleSort }) => (
  <div className={styles.sortControls}>
    {(SORT_CONFIG[type] || []).map(({ key, label }) => (
      <button
        key={key}
        className={`${styles.sortButton} ${sortConfig.key === key ? styles.activeSort : ''}`}
        onClick={() => handleSort(type, key)}
        role="button"
        tabIndex={0}
        onKeyPress={(e) => e.key === 'Enter' && handleSort(type, key)}
      >
        {label}
        {sortConfig.key === key && <SortIndicator direction={sortConfig.direction} />}
      </button>
    ))}
  </div>
); 