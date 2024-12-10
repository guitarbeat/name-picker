import React, { useState } from 'react';
import { Button, Card } from '@components/ui';
import { DEFAULT_NAMES } from '@constants/names';
import styles from './NameInput.module.scss';

interface NameInputProps {
  onSubmit: (names: string[]) => void;
  useDefaultNames?: boolean;
}

export function NameInput({ onSubmit, useDefaultNames = false }: NameInputProps) {
  const [customNames, setCustomNames] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const names = useDefaultNames 
      ? DEFAULT_NAMES 
      : customNames.split('\n').filter(name => name.trim());
    
    if (names.length >= 2) {
      onSubmit(names);
    }
  };

  return (
    <Card className={styles.container}>
      <h2 className={styles.title}>
        {useDefaultNames ? 'Start Cat Name Tournament' : 'Enter Names'}
      </h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        {!useDefaultNames && (
          <textarea
            value={customNames}
            onChange={(e) => setCustomNames(e.target.value)}
            placeholder="Enter names (one per line)"
            rows={10}
            className={styles.input}
          />
        )}
        <div className={styles.buttonGroup}>
          <Button type="submit" variant="primary">
            {useDefaultNames ? 'Start Tournament' : 'Submit Names'}
          </Button>
        </div>
      </form>
    </Card>
  );
} 