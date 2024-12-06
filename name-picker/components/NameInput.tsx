import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface NameInputProps {
  onSubmit: (names: string[]) => void;
  initialNames?: string[];
  savedLists?: { name: string; options: any[] }[];
  onLoadList?: (list: { name: string; options: any[] }) => void;
}

export default function NameInput({ onSubmit, initialNames, savedLists = [], onLoadList }: NameInputProps) {
  const [inputValue, setInputValue] = useState(initialNames ? initialNames.join(', ') : '');
  const [error, setError] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowTooltip(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Split and clean names
    const names = inputValue
      .split(',')
      .map(name => name.trim())
      .filter(name => name !== '');
    
    // Check for duplicates
    const uniqueNames = new Set(names);
    if (uniqueNames.size !== names.length) {
      setError('Please remove duplicate names before continuing.');
      return;
    }

    // Validate minimum number of names
    if (names.length < 2) {
      setError('Please enter at least two names separated by commas.');
      return;
    }

    onSubmit(Array.from(uniqueNames));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enter Names for Sorting</CardTitle>
        {showTooltip && (
          <CardDescription>
            Enter names separated by commas
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Enter names separated by commas..."
            className="w-full h-32 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background 
              placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring 
              focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
          />
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
        <Button 
          onClick={handleSubmit}
          disabled={!inputValue.trim()}
          className="w-full"
        >
          Continue
        </Button>
        {savedLists && savedLists.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Saved Lists</h3>
            <div className="grid gap-2">
              {savedLists.map((list, index) => (
                <Button
                  key={index}
                  variant="outline"
                  onClick={() => onLoadList?.(list)}
                  className="w-full justify-between"
                >
                  <span>{list.name}</span>
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
