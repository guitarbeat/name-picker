import React, { useState } from 'react';
import { getTournamentResults, renameTournament, TournamentResult, getCurrentUser } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from 'date-fns';

export function TournamentHistory() {
  const [results, setResults] = useState<TournamentResult[]>(getTournamentResults());
  const [selectedResult, setSelectedResult] = useState<TournamentResult | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingName, setEditingName] = useState('');
  const [filterUser, setFilterUser] = useState<string | null>(getCurrentUser());

  const handleRename = (result: TournamentResult) => {
    setSelectedResult(result);
    setEditingName(result.name || '');
    setIsDialogOpen(true);
  };

  const handleSaveRename = () => {
    if (selectedResult) {
      renameTournament(selectedResult.timestamp, editingName);
      setResults(getTournamentResults());
      setIsDialogOpen(false);
    }
  };

  const filteredResults = filterUser
    ? results.filter(result => result.userName === filterUser)
    : results;

  if (results.length === 0) {
    return null;
  }

  const uniqueUsers = Array.from(new Set(results.map(r => r.userName))).sort();

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Recent Tournaments</h2>
        <select
          className="px-3 py-2 border rounded-md"
          value={filterUser || ''}
          onChange={(e) => setFilterUser(e.target.value || null)}
        >
          <option value="">All Users</option>
          {uniqueUsers.map(user => (
            <option key={user} value={user}>{user}</option>
          ))}
        </select>
      </div>
      <div className="space-y-4">
        {filteredResults.map((result) => (
          <div
            key={result.timestamp}
            className="border rounded-lg p-4 bg-card"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-lg font-semibold">
                  {result.name || format(result.timestamp, 'PPp')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Winner: {result.winner.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  By: {result.userName}
                </p>
              </div>
              {result.userName === getCurrentUser() && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRename(result)}
                >
                  Rename
                </Button>
              )}
            </div>
            <div className="mt-2">
              <h4 className="text-sm font-medium mb-1">Final Rankings:</h4>
              <ol className="list-decimal list-inside text-sm text-muted-foreground">
                {result.sortedList.map((item) => (
                  <li key={item.id} className="ml-2">
                    {item.name}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        ))}
      </div>

      <Dialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} title="Rename Tournament">
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Tournament</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              placeholder="Enter tournament name"
            />
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveRename}>
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
