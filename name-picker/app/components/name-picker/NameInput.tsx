import React, { useState, useEffect, useCallback } from 'react';
import {
  Button,
  CardBody,
  CardHeader,
  Alert,
  AlertTitle,
  AlertDescription,
  Select
} from "@chakra-ui/react";
import { Card } from '@chakra-ui/card';
import { defaultNames, bracketTypes, BracketType } from '@/app/lib/defaults';

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

export default function NameInput({ 
  onSubmit, 
  initialNames, 
  savedLists = [], 
  onLoadList 
}: NameInputProps) {
  const [state, setState] = useState<NameInputState>({
    inputValue: initialNames ? initialNames.join(', ') : defaultNames.join(', '),
    error: null,
    showTooltip: true,
    bracketType: 'single',
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setState((prev) => ({ ...prev, showTooltip: false }));
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
      .map((name) => name.trim())
      .filter((name) => name !== '');
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      const names = processNames(state.inputValue);
      const error = validateNames(names);

      setState((prev) => ({ ...prev, error }));

      if (!error) {
        onSubmit(names, state.bracketType);
      }
    },
    [state.inputValue, state.bracketType, onSubmit, processNames, validateNames]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setState((prev) => ({ ...prev, inputValue: e.target.value }));
    },
    []
  );

  const handleLoadList = useCallback(
    (list: SavedList) => {
      onLoadList?.(list);
    },
    [onLoadList]
  );

  const handleBracketTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setState((prev) => ({ ...prev, bracketType: e.target.value as BracketType }));
    },
    []
  );

  return (
    <Card variant="outline" w="full" maxW="xl" mx="auto">
      <CardHeader>
        <h2 className="text-2xl text-center">
          🐱 Aaron&apos;s Baby Boy Cat Name Picker 🐱
        </h2>
        <p className="text-center text-base">
          Let&apos;s find the purrfect name for your new furry friend!
        </p>
      </CardHeader>
      <CardBody className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Select
              value={state.bracketType}
              onChange={handleBracketTypeChange}
              variant="outline"
              size="md"
              mb={4}
            >
              {bracketTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
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
              <Alert status="error">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            )}
          </div>
          <Button
            type="submit"
            disabled={!state.inputValue.trim()}
            variant="solid"
            colorScheme="blue"
            w="full"
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
                  size="sm"
                  onClick={() => handleLoadList(list)}
                  w="full"
                  justifyContent="space-between"
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
      </CardBody>
    </Card>
  );
}