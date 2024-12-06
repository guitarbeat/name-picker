import React, { useState, useCallback } from 'react';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Input
} from "@chakra-ui/react";
import { Option } from '../../lib/sortingLogic';
import { motion } from "framer-motion";

interface ConfirmNamesProps {
  options: Option[];
  onConfirm: () => void;
  onEdit: () => void;
  onSave?: (listName: string) => void;
  onRandomPick?: () => void;
}

interface SaveState {
  showSave: boolean;
  listName: string;
}

export default function ConfirmNames({ options, onConfirm, onEdit, onSave, onRandomPick }: ConfirmNamesProps) {
  const [saveState, setSaveState] = useState<SaveState>({
    showSave: false,
    listName: ''
  });

  const handleSave = useCallback(() => {
    const { listName } = saveState;
    if (listName.trim() && onSave) {
      onSave(listName.trim());
      setSaveState({ showSave: false, listName: '' });
    }
  }, [saveState, onSave]);

  const toggleSave = useCallback(() => {
    setSaveState(prev => ({ ...prev, showSave: !prev.showSave }));
  }, []);

  const updateListName = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSaveState(prev => ({ ...prev, listName: e.target.value }));
  }, []);

  return (
    <Card variant="outline">
      <CardHeader>
        <Heading className="text-2xl text-center">
          🐱 Pawesome Name List 🐱
        </Heading>
      </CardHeader>
      <CardBody className="space-y-4">
        <div className="grid gap-2">
          {options.map((option, index) => (
            <motion.div
              key={option.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="p-3 bg-card rounded-lg border border-border flex items-center gap-2"
              role="listitem"
              aria-label={`Name option: ${option.name}`}
            >
              <span className="text-lg" role="img" aria-label="Cat emoji">😺</span>
              {option.name}
            </motion.div>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Button 
              onClick={onEdit} 
              variant="outline" 
              className="flex-1"
              aria-label="Edit names"
            >
              <span role="img" aria-label="Edit">✏️</span> Edit Names
            </Button>
            <Button 
              onClick={onConfirm} 
              className="flex-1"
              aria-label="Start picking names"
            >
              <span role="img" aria-label="Target">🎯</span> Start Picking
            </Button>
          </div>

          {onRandomPick && (
            <Button 
              onClick={onRandomPick}
              variant="secondary"
              className="w-full"
              aria-label="Pick a random name"
            >
              <span role="img" aria-label="Dice">🎲</span> Random Pick
            </Button>
          )}

          {onSave && (
            <div className="space-y-2">
              {!saveState.showSave ? (
                <Button 
                  onClick={toggleSave}
                  variant="outline"
                  className="w-full"
                  aria-label="Save names for later"
                >
                  <span role="img" aria-label="Save">💾</span> Save These Names for Later
                </Button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2 p-3 bg-card/50 rounded-lg border border-border"
                >
                  <Input
                    type="text"
                    value={saveState.listName}
                    onChange={updateListName}
                    placeholder="Name this list of potential cat names..."
                    className="w-full"
                    aria-label="List name input"
                  />
                  <div className="flex gap-2">
                    <Button 
                      onClick={toggleSave}
                      variant="outline"
                      className="flex-1"
                      aria-label="Cancel saving"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSave}
                      className="flex-1"
                      disabled={!saveState.listName.trim()}
                      aria-label="Save list"
                    >
                      Save List
                    </Button>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
