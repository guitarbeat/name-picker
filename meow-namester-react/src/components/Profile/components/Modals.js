import styles from '../Profile.module.css';

export const DeleteConfirmationModal = ({ 
  itemType,
  itemName,
  onConfirm,
  onCancel,
  status 
}) => (
  <div className={styles.modalOverlay}>
    <div className={styles.modalContent}>
      <h3>Delete {itemType}</h3>
      <p>Are you sure you want to delete {itemName}?</p>
      <div className={styles.modalActions}>
        <button onClick={onCancel} className={styles.secondaryButton}>
          Cancel
        </button>
        <button 
          onClick={onConfirm} 
          className={styles.dangerButton}
          disabled={status.loading}
        >
          {status.loading ? 'Deleting...' : 'Confirm Delete'}
        </button>
      </div>
      {status.error && <p className={styles.errorText}>{status.error}</p>}
    </div>
  </div>
); 