import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { defaultNames, bracketTypes, BracketType } from '@/lib/defaults';

interface NameInputProps {
  onSubmit: (names: string[], bracketType: BracketType) => void;
  initialNames?: string[];
  savedLists?: { name: string; options: string[] }[];
  onLoadList?: (list: { name: string; options: string[] }) => void;
}

interface NameInputState {
  inputValue: string;
  error: string | null;
  showTooltip: boolean;
  bracketType: BracketType;
}

interface SavedList {
  name: string;
  options: string[];
}

export default function NameInput({ onSubmit, initialNames, savedLists = [], onLoadList }: NameInputProps) {
  const [state, setState] = useState<NameInputState>({
    inputValue: initialNames ? initialNames.join(', ') : defaultNames.join(', '),
    error: null,
    showTooltip: true,
    bracketType: 'single'
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setState(prev => ({ ...prev, showTooltip: false }));
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const validateNames = useCallback((names: string[]): string | null => {
    if (names.length < 2) {
      return 'Please enter at least two names separated by commas.';
    }
    
    const uniqueNames = new Set(names);
    if (uniqueNames.size !== names.length) {
      return 'Please remove duplicate names before continuing.';
    }
    
    return null;
  }, []);

  const processNames = useCallback((inputValue: string): string[] => {
    return inputValue
      .split(',')
      .map(name => name.trim())
      .filter(name => name !== '');
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    const names = processNames(state.inputValue);
    const error = validateNames(names);
    
    setState(prev => ({ ...prev, error }));
    
    if (!error) {
      onSubmit(names, state.bracketType);
    }
  }, [state.inputValue, state.bracketType, onSubmit, processNames, validateNames]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setState(prev => ({ ...prev, inputValue: e.target.value }));
  }, []);

  const handleLoadList = useCallback((list: SavedList) => {
    onLoadList?.(list);
  }, [onLoadList]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl text-center">
          🐱 Aaron&apos;s Baby Boy Cat Name Picker 🐱
        </CardTitle>
        <CardDescription className="text-center text-base">
          Let&apos;s find the purrfect name for your new furry friend! 
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Select
              value={state.bracketType}
              onValueChange={(value: BracketType) => 
                setState(prev => ({ ...prev, bracketType: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select bracket type" />
              </SelectTrigger>
              <SelectContent>
                {bracketTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <textarea
              value={state.inputValue}
              onChange={handleInputChange}
              placeholder="Enter some pawsome names separated by commas..."
              className="w-full h-32 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background 
                placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring 
                focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              aria-label="Name input"
              aria-invalid={state.error ? 'true' : 'false'}
              aria-describedby={state.error ? 'name-input-error' : undefined}
            />
            {state.error && (
              <Alert variant="destructive">
                <AlertDescription id="name-input-error">{state.error}</AlertDescription>
              </Alert>
            )}
          </div>
          <Button 
            type="submit"
            disabled={!state.inputValue.trim()}
            className="w-full"
            aria-label="Start picking names"
          >
            Start Picking! 🐾
          </Button>
        </form>
        {savedLists && savedLists.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Previous Name Lists</h3>
            <div className="grid gap-2">
              {savedLists.map((list, index) => (
                <Button
                  key={index}
                  variant="outline"
                  onClick={() => handleLoadList(list)}
                  className="w-full justify-between"
                  aria-label={`Load saved list: ${list.name}`}
                >
                  <span>{list.name} 🐱</span>
                  <span className="text-xs text-muted-foreground">
                    {list.options.length} names
                  </span>
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
