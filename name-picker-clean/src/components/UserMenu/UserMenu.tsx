import React from 'react';
import { Button } from '../ui/Button/Button';
import type { UserSession, UserPreferences, Theme } from '../../types/tournament';
import styles from './UserMenu.module.scss';

interface UserMenuProps {
  session: UserSession;
  onLogout: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onUpdatePreferences: (preferences: Partial<UserPreferences>) => void;
  isAdmin: boolean;
}

export function UserMenu({
  session,
  onLogout,
  onExport,
  onImport,
  onUpdatePreferences,
  isAdmin,
}: UserMenuProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleThemeChange = (theme: Theme) => {
    onUpdatePreferences({ theme });
  };

  const handleAutoAdvanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdatePreferences({ autoAdvance: e.target.checked });
  };

  const handleShowTimerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdatePreferences({ showTimer: e.target.checked });
  };

  const handleMatchesPerPageChange = (value: number) => {
    onUpdatePreferences({ matchesPerPage: value });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImport(file);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={styles.menu}>
      <div className={styles.header}>
        <h3>User Menu</h3>
        {isAdmin && <div className={styles.adminBadge}>Admin</div>}
      </div>

      <div className={styles.section}>
        <h4>Preferences</h4>
        <div className={styles.preferences}>
          <div className={styles.preference}>
            <span>Auto-advance</span>
            <input
              type="checkbox"
              checked={session.preferences.autoAdvance}
              onChange={handleAutoAdvanceChange}
            />
          </div>
          <div className={styles.preference}>
            <span>Show Timer</span>
            <input
              type="checkbox"
              checked={session.preferences.showTimer}
              onChange={handleShowTimerChange}
            />
          </div>
          <div className={styles.preference}>
            <span>Matches per Page</span>
            <select
              value={session.preferences.matchesPerPage}
              onChange={(e) => handleMatchesPerPageChange(Number(e.target.value))}
            >
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={4}>4</option>
            </select>
          </div>
          <div className={styles.preference}>
            <span>Theme</span>
            <select
              value={session.preferences.theme}
              onChange={(e) => handleThemeChange(e.target.value as Theme)}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h4>Data Management</h4>
        <div className={styles.actions}>
          <Button variant="outline" size="small" onClick={onExport}>
            Export Data
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            style={{ display: 'none' }}
          />
          <Button variant="outline" size="small" onClick={handleImportClick}>
            Import Data
          </Button>
        </div>
      </div>

      <div className={styles.footer}>
        <Button variant="outline" size="small" onClick={onLogout}>
          Logout
        </Button>
        <div className={styles.info}>
          <p>Logged in as: {session.username}</p>
          <p>Since: {new Date(session.createdAt).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
} 