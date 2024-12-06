import React, { useState } from 'react';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Option } from '../utils/sortingLogic';
import { motion } from "framer-motion";

interface ConfirmNamesProps {
  options: Option[];
  onConfirm: () => void;
  onEdit: () => void;
  onSave?: (listName: string) => void;
  onRandomPick?: () => void;
}

export default function ConfirmNames({ options, onConfirm, onEdit, onSave, onRandomPick }: ConfirmNamesProps) {
  const [listName, setListName] = useState('');
  const [showSave, setShowSave] = useState(false);

  const handleSave = () => {
    if (listName.trim() && onSave) {
      onSave(listName.trim());
      setShowSave(false);
      setListName('');
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Confirm Names</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          {options.map((option, index) => (
            <motion.div
              key={option.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="p-2 bg-gray-800 rounded-lg"
            >
              {option.name}
            </motion.div>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Button onClick={onEdit} variant="outline" className="flex-1">
              Edit List
            </Button>
            <Button onClick={onConfirm} className="flex-1">
              Start Sorting
            </Button>
          </div>

          {onRandomPick && (
            <Button 
              onClick={onRandomPick}
              variant="secondary"
              className="w-full"
            >
              Pick Random Name
            </Button>
          )}

          {onSave && (
            <div className="space-y-2">
              {!showSave ? (
                <Button 
                  onClick={() => setShowSave(true)}
                  variant="outline"
                  className="w-full"
                >
                  Save This List
                </Button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <Input
                    type="text"
                    value={listName}
                    onChange={(e) => setListName(e.target.value)}
                    placeholder="Enter a name for this list"
                    className="w-full"
                  />
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => setShowSave(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSave}
                      disabled={!listName.trim()}
                      className="flex-1"
                    >
                      Save
                    </Button>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
