import React from 'react';
import styles from '../Profile.module.css';

const ProfileStats = ({ totalNames, totalMatches, averageRating }) => (
  <div className={styles.statsGrid}>
    <div className={styles.userStat}>
      <span>Total Names:</span>
      <span className={styles.userStatCount}>{totalNames}</span>
    </div>
    <div className={styles.userStat}>
      <span>Total Matches:</span>
      <span className={styles.userStatCount}>{totalMatches}</span>
    </div>
    <div className={styles.userStat}>
      <span>Average Rating:</span>
      <span className={styles.userStatCount}>{averageRating}</span>
    </div>
  </div>
);

export default ProfileStats; 