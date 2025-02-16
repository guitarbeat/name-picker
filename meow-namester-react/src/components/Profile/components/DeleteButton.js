import React from 'react';
import styles from '../Profile.module.css';

const DeleteButton = ({ onDelete }) => (
  <button
    onClick={onDelete}
    className={styles.deleteButton}
    title="Delete this name permanently"
  >
    <span className={styles.deleteIcon}>🗑️</span>
  </button>
);

export default DeleteButton; 