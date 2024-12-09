"use client";

import React, { useState, useCallback } from "react";
import {
  VStack,
  Text,
  Button,
  Input,
  useColorModeValue,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Box,
} from "@chakra-ui/react";
import { Card } from "@/components/core/Card";
import { defaultNames } from "@/lib/constants";

interface NameInputFormProps {
  onSubmit: (names: string[]) => void;
}

export function NameInputForm({ onSubmit }: NameInputFormProps): JSX.Element {
  const [currentName, setCurrentName] = useState("");
  const [names, setNames] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const textColor = useColorModeValue("gray.700", "gray.200");

  const handleAddName = useCallback(() => {
    if (!currentName.trim()) {
      setError("Name cannot be empty");
      return;
    }

    if (names.includes(currentName.trim())) {
      setError("Name already exists");
      return;
    }

    setNames([...names, currentName.trim()]);
    setCurrentName("");
    setError(null);
  }, [currentName, names]);

  const handleKeyPress = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        handleAddName();
      }
    },
    [handleAddName]
  );

  const handleRemoveName = useCallback((index: number) => {
    const newNames = names.filter((_, i) => i !== index);
    setNames(newNames);
  }, [names]);

  const handleSubmit = useCallback(() => {
    if (names.length < 2) {
      setError("At least two names are required");
      return;
    }

    onSubmit(names);
  }, [names, onSubmit]);

  const handleUseDefaultNames = useCallback(() => {
    setNames(defaultNames);
    setError(null);
  }, []);

  return (
    <Card variant="outline" w="full">
      <Box p={6}>
        <VStack spacing={6} align="stretch">
          <Text fontSize="xl" fontWeight="bold" color={textColor}>
            Enter Names
          </Text>

          <FormControl isInvalid={!!error}>
            <FormLabel htmlFor="name-input" color={textColor}>
              Add names for the tournament
            </FormLabel>
            <Input
              id="name-input"
              value={currentName}
              onChange={(e) => setCurrentName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter a name"
              size="lg"
            />
            {error && <FormErrorMessage>{error}</FormErrorMessage>}
          </FormControl>

          <Button
            colorScheme="purple"
            onClick={handleAddName}
            isDisabled={!currentName.trim()}
          >
            Add Name
          </Button>

          {names.length > 0 && (
            <VStack align="stretch" spacing={2}>
              <Text fontWeight="medium" color={textColor}>
                Added Names:
              </Text>
              {names.map((name, index) => (
                <Button
                  key={index}
                  variant="outline"
                  justifyContent="space-between"
                  onClick={() => handleRemoveName(index)}
                  rightIcon={<span>×</span>}
                >
                  {name}
                </Button>
              ))}
            </VStack>
          )}

          <Button
            colorScheme="purple"
            variant="solid"
            onClick={handleSubmit}
            isDisabled={names.length < 2}
          >
            Start Tournament
          </Button>

          {names.length === 0 && (
            <Button
              variant="ghost"
              colorScheme="purple"
              onClick={handleUseDefaultNames}
            >
              Use Default Names
            </Button>
          )}
        </VStack>
      </Box>
    </Card>
  );
} 