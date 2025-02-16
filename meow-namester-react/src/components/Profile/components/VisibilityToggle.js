import React from 'react';
import styles from '../Profile.module.css';

const VisibilityToggle = ({ name, hiddenNames, onToggle }) => (
  <button
    onClick={() => onToggle(name.id, name.name)}
    className={`${styles.visibilityToggle} ${hiddenNames.has(name.id) ? styles.hidden : ''}`}
    title={`Click to ${hiddenNames.has(name.id) ? 'show' : 'hide'} this name`}
  >
    <span className={styles.visibilityIcon}>
      {hiddenNames.has(name.id) ? '👁️🗨️' : '👁️'}
    </span>
    <span className={styles.visibilityText}>
      {hiddenNames.has(name.id) ? 'Hidden' : 'Visible'}
    </span>
  </button>
);

export default VisibilityToggle; 