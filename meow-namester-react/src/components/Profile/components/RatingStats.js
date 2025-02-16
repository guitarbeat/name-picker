import React from 'react';
import styles from '../Profile.module.css';

const RatingStats = ({ rating, wins, losses }) => (
  <div className={styles.ratingInfo}>
    <div className={styles.ratingValue}>
      <span className={styles.ratingLabel}>Rating:</span> 
      <span className={styles.ratingNumber}>{Math.round(rating || 1500)}</span>
    </div>
    <div className={styles.record}>
      <span className={styles.wins}>
        <span className={styles.winIcon}>✅</span>
        {wins || 0}
      </span>
      <span className={styles.losses}>
        <span className={styles.lossIcon}>❌</span>
        {losses || 0}
      </span>
    </div>
  </div>
);

export default RatingStats; 