import React, { useState } from 'react';
import { Button } from '../ui/Button/Button';
import { Card } from '../ui/Card/Card';
import { DEFAULT_NAMES } from '@/constants/names';
import styles from './NameInput.module.scss';

interface NameInputProps {
  onSubmit: (names: string[]) => void;
  useDefaultNames?: boolean;
}

export function NameInput({ onSubmit, useDefaultNames = false }: NameInputProps) {
  const [names, setNames] = useState<string[]>([]);
  const [currentName, setCurrentName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAddName = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = currentName.trim();
    
    if (!trimmedName) {
      setError('Please enter a name');
      return;
    }

    if (names.includes(trimmedName)) {
      setError('This name is already in the list');
      return;
    }

    setNames([...names, trimmedName]);
    setCurrentName('');
    setError(null);
  };

  const handleRemoveName = (nameToRemove: string) => {
    setNames(names.filter(name => name !== nameToRemove));
  };

  const handleSubmit = () => {
    const finalNames = useDefaultNames ? [...DEFAULT_NAMES, ...names] : names;
    
    if (finalNames.length < 2) {
      setError('Please add at least 2 names for the tournament');
      return;
    }

    onSubmit(finalNames);
  };

  const handleClearAll = () => {
    setNames([]);
    setCurrentName('');
    setError(null);
  };

  return (
    <Card className={styles.container}>
      <div className={styles.header}>
        <h2>Name Tournament</h2>
        <p>Add names to start a tournament</p>
      </div>

      <form onSubmit={handleAddName} className={styles.inputForm}>
        <div className={styles.inputRow}>
          <input
            type="text"
            value={currentName}
            onChange={(e) => setCurrentName(e.target.value)}
            placeholder="Enter a name..."
            className={styles.input}
          />
          <Button type="submit" size="small">
            Add Name
          </Button>
        </div>
        {error && <p className={styles.error}>{error}</p>}
      </form>

      <div className={styles.nameList}>
        <div className={styles.listHeader}>
          <h3>Added Names ({names.length})</h3>
          {names.length > 0 && (
            <Button variant="outline" size="small" onClick={handleClearAll}>
              Clear All
            </Button>
          )}
        </div>
        {names.length > 0 ? (
          <div className={styles.names}>
            {names.map((name) => (
              <div key={name} className={styles.nameTag}>
                <span>{name}</span>
                <button
                  onClick={() => handleRemoveName(name)}
                  className={styles.removeButton}
                  type="button"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.emptyMessage}>No names added yet</p>
        )}
      </div>

      <div className={styles.footer}>
        <Button
          onClick={handleSubmit}
          disabled={!useDefaultNames && names.length < 2}
          fullWidth
        >
          Start Tournament ({useDefaultNames ? names.length + DEFAULT_NAMES.length : names.length} names)
        </Button>
      </div>
    </Card>
  );
} 