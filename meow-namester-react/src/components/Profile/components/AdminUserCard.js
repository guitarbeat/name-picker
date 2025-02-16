import React from 'react';
import styles from '../Profile.module.css';
import { formatLastActive, isUserActive } from '../utils/profileUtils';

export default function AdminUserCard({ user, userData, lastActive, isCurrentUser, onDelete }) {
  return (
    <div className={styles.adminUserCard}>
      <div className={styles.userCardGlow} />
      <div className={`${styles.userStatus} ${
        isUserActive(lastActive || null) ? '' : styles.inactive
      }`} />
      <div className={styles.userInfo}>
        <div className={styles.userHeader}>
          <span className={styles.userName}>{user}</span>
          {isCurrentUser && <span className={styles.adminBadge}>Current User</span>}
        </div>
        <div className={styles.userStats}>
          <div className={styles.userStat}>
            <span>Ratings:</span>
            <span className={styles.userStatCount}>
              {userData?.length || 0}
            </span>
          </div>
          <div className={styles.userStat}>
            <span>Last Active:</span>
            <span className={styles.userStatCount}>
              {formatLastActive(lastActive || null)}
            </span>
          </div>
        </div>
      </div>
      <div className={styles.userActions}>
        {!isCurrentUser && (
          <button
            onClick={onDelete}
            className={styles.dangerButton}
            aria-label={`Delete ${user}`}
          >
            🗑️ Delete
          </button>
        )}
      </div>
    </div>
  );
} 