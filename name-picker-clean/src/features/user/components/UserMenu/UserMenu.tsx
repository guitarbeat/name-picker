import { useState } from 'react';
import { Button } from '@components/ui';
import styles from './UserMenu.module.scss';

interface UserMenuProps {
  onLogin: (username: string) => void;
}

export function UserMenu({ onLogin }: UserMenuProps) {
  const [username, setUsername] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onLogin(username.trim());
      setIsEditing(false);
    }
  };

  return (
    <div className={styles.userMenu}>
      {isEditing ? (
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="Enter username"
            className={styles.input}
            autoFocus
          />
          <div className={styles.buttons}>
            <Button type="submit" variant="primary">
              Save
            </Button>
            <Button 
              type="button" 
              variant="secondary"
              size="small"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button onClick={() => setIsEditing(true)}>
          Login
        </Button>
      )}
    </div>
  );
} 