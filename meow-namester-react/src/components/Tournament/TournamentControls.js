import React, { useState } from 'react';
import { 
  SpeakerWaveIcon, 
  SpeakerXMarkIcon, 
  MusicalNoteIcon,
  ExclamationCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import styles from './Tournament.module.css';

const TournamentControls = ({ 
  onEndEarly, 
  isTransitioning, 
  isMuted, 
  onToggleMute,
  onNextTrack,
  trackInfo,
  audioError,
  onRetryAudio,
  onRandomize
}) => {
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleEndConfirm = () => {
    setShowConfirmation(false);
    onEndEarly();
  };

  return (
    <div className={styles.tournamentControls} role="toolbar" aria-label="Tournament controls">
      <div className={styles.soundControls}>
        <button
          onClick={onToggleMute}
          className={`${styles.soundToggleButton} ${isMuted ? styles.muted : ''}`}
          aria-label={isMuted ? "Unmute tournament sounds" : "Mute tournament sounds"}
          aria-pressed={isMuted}
          disabled={isTransitioning}
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? (
            <SpeakerXMarkIcon className={styles.icon} aria-hidden="true" />
          ) : (
            <SpeakerWaveIcon className={styles.icon} aria-hidden="true" />
          )}
        </button>

        <button
          onClick={onNextTrack}
          className={styles.soundToggleButton}
          aria-label="Next track"
          disabled={isTransitioning}
          title={`Now Playing: ${trackInfo.name}\nClick for next track`}
        >
          <MusicalNoteIcon className={styles.icon} aria-hidden="true" />
        </button>

        {audioError && (
          <button
            onClick={onRetryAudio}
            className={`${styles.soundToggleButton} ${styles.error}`}
            aria-label="Retry playing audio"
            title={audioError}
          >
            <ExclamationCircleIcon className={styles.icon} aria-hidden="true" />
          </button>
        )}

        <div className={styles.trackInfo} aria-live="polite">
          <span className={styles.trackName}>{trackInfo.name}</span>
        </div>
      </div>

      <button
        onClick={onRandomize}
        className={styles.randomizeButton}
        disabled={isTransitioning}
        aria-label="Randomize tournament order"
        title="Randomize tournament order"
      >
        <ArrowPathIcon aria-hidden="true" />
        Randomize
      </button>

      <button 
        onClick={() => setShowConfirmation(true)}
        className={styles.controlButton}
        disabled={isTransitioning}
        aria-label="End tournament early"
      >
        End Tournament Early
      </button>

      {showConfirmation && (
        <>
          <div 
            className={styles.modalBackdrop} 
            onClick={() => setShowConfirmation(false)}
            aria-hidden="true"
          />
          <div 
            className={styles.modal}
            role="dialog"
            aria-labelledby="confirm-end-title"
            aria-describedby="confirm-end-description"
          >
            <h2 id="confirm-end-title" className={styles.modalTitle}>End Tournament?</h2>
            <p id="confirm-end-description" className={styles.modalText}>
              Are you sure you want to end the tournament early?
            </p>
            <div className={styles.modalActions}>
              <button 
                onClick={handleEndConfirm} 
                className={styles.confirmButton}
                autoFocus
              >
                Yes, End Tournament
              </button>
              <button 
                onClick={() => setShowConfirmation(false)} 
                className={styles.cancelButton}
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TournamentControls; 