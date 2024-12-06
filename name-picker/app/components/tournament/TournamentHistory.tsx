import React, { useState } from 'react';
import { getTournamentResults, renameTournament, TournamentResult, getCurrentUser } from '@/app/lib/storage';
import {
  Button,
  Input,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Select
} from "@chakra-ui/react";
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
        <Select
          value={filterUser || ''}
          onChange={(e) => setFilterUser(e.target.value || null)}
          width="auto"
        >
          <option value="">All Users</option>
          {uniqueUsers.map(user => (
            <option key={user} value={user}>{user}</option>
          ))}
        </Select>
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

      <Modal isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Rename Tournament</ModalHeader>
          <ModalBody>
            <Input
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              placeholder="Enter tournament name"
            />
          </ModalBody>
          <ModalFooter>
            <Button
              variant="outline"
              mr={3}
              onClick={() => setIsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleSaveRename}>
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
