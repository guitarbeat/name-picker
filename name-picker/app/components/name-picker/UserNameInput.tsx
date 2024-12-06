import React, { useState } from 'react';
import { Button } from "@chakra-ui/react"
import { Input } from "@chakra-ui/react"
import { Card, CardBody, CardHeader, Heading } from "@chakra-ui/react"
import { getCurrentUser, setCurrentUser } from '@/app/lib/storage';

interface UserNameInputProps {
  onSubmit: () => void;
}

export default function UserNameInput({ onSubmit }: UserNameInputProps) {
  const [userName, setUserName] = useState(getCurrentUser() || '');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userName.trim()) {
      setError('Please enter your name');
      return;
    }

    setCurrentUser(userName.trim());
    onSubmit();
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <Heading>Enter Your Name</Heading>
      </CardHeader>
      <CardBody>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              value={userName}
              onChange={(e) => {
                setUserName(e.target.value);
                setError(null);
              }}
              placeholder="Your name"
              className={error ? 'border-red-500' : ''}
            />
            {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
          </div>
          <Button type="submit" className="w-full">
            Continue
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
