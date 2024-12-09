"use client";

import React, { useState, useCallback } from "react";
import {
  VStack,
  Text,
  useColorModeValue,
  Box,
} from "@chakra-ui/react";
import { Card } from "@/components/core/Card";
import type { Match, MatchResult } from "@/lib/types";
import { shuffleArray } from "@/lib/utils";

interface TournamentSorterProps {
  names: string[];
  onComplete: (sortedNames: string[]) => void;
}

export function TournamentSorter({ names, onComplete }: TournamentSorterProps): JSX.Element {
  const [matches, setMatches] = useState<Match[]>(() => {
    const shuffledNames = shuffleArray([...names]);
    const initialMatches: Match[] = [];
    const now = new Date().toISOString();
    
    for (let i = 0; i < shuffledNames.length; i += 2) {
      if (i + 1 < shuffledNames.length) {
        initialMatches.push({
          id: crypto.randomUUID(),
          createdAt: now,
          name1: shuffledNames[i],
          name2: shuffledNames[i + 1],
          winner: null,
          timestamp: Date.now(),
        });
      } else {
        // Handle odd number of names
        initialMatches.push({
          id: crypto.randomUUID(),
          createdAt: now,
          name1: shuffledNames[i],
          name2: null,
          winner: "1", // Automatically advance single names
          timestamp: Date.now(),
        });
      }
    }
    return initialMatches;
  });

  const [currentRound, setCurrentRound] = useState(1);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  const textColor = useColorModeValue("gray.700", "gray.200");

  const currentPair = matches[currentMatchIndex]
    ? [matches[currentMatchIndex].name1, matches[currentMatchIndex].name2]
    : [null, null];

  const handleChoice = useCallback(
    (winner: string, position: MatchResult) => {
      const updatedMatches = [...matches];
      updatedMatches[currentMatchIndex] = {
        ...updatedMatches[currentMatchIndex],
        winner: position,
      };
      setMatches(updatedMatches);

      if (currentMatchIndex + 1 < matches.length) {
        setCurrentMatchIndex(currentMatchIndex + 1);
      } else {
        // Process winners for next round
        const winners = updatedMatches
          .map((match) => (match.winner === "1" ? match.name1 : match.name2))
          .filter((name): name is string => name !== null);

        if (winners.length === 1) {
          // Tournament complete
          onComplete(winners);
        } else {
          // Set up next round
          const nextRoundMatches: Match[] = [];
          const now = new Date().toISOString();
          
          for (let i = 0; i < winners.length; i += 2) {
            if (i + 1 < winners.length) {
              nextRoundMatches.push({
                id: crypto.randomUUID(),
                createdAt: now,
                name1: winners[i],
                name2: winners[i + 1],
                winner: null,
                timestamp: Date.now(),
              });
            } else {
              // Handle odd number of winners
              nextRoundMatches.push({
                id: crypto.randomUUID(),
                createdAt: now,
                name1: winners[i],
                name2: null,
                winner: "1",
                timestamp: Date.now(),
              });
            }
          }
          setMatches(nextRoundMatches);
          setCurrentMatchIndex(0);
          setCurrentRound(currentRound + 1);
        }
      }
    },
    [currentMatchIndex, currentRound, matches, onComplete]
  );

  return (
    <VStack spacing={8} w="full" maxW="4xl" mx="auto">
      <Text fontSize="2xl" fontWeight="bold" color={textColor} textAlign="center">
        Round {currentRound}: Choose the name you prefer
      </Text>
      <VStack spacing={6} w="full">
        <Card
          variant="outline"
          w="full"
          isClickable={!!currentPair[0]}
          isHoverable
          motionProps={{
            initial: { opacity: 0, y: 20 },
            animate: { opacity: 1, y: 0 },
            exit: { opacity: 0, y: -20 },
            whileHover: { scale: 1.02 },
            whileTap: { scale: 0.98 },
          }}
          onClick={() => currentPair[0] && handleChoice(currentPair[0], "1")}
        >
          <Box p={6}>
            <Text
              fontSize="xl"
              fontWeight="semibold"
              color={textColor}
              textAlign="center"
            >
              {currentPair[0] || "Waiting..."}
            </Text>
          </Box>
        </Card>

        <Text fontSize="lg" fontWeight="medium" color={textColor}>
          vs
        </Text>

        <Card
          variant="outline"
          w="full"
          isClickable={!!currentPair[1]}
          isHoverable
          motionProps={{
            initial: { opacity: 0, y: -20 },
            animate: { opacity: 1, y: 0 },
            exit: { opacity: 0, y: 20 },
            whileHover: { scale: 1.02 },
            whileTap: { scale: 0.98 },
            style: {
              opacity: currentPair[1] ? 1 : 0.5,
            },
          }}
          onClick={() => currentPair[1] && handleChoice(currentPair[1], "2")}
        >
          <Box p={6}>
            <Text
              fontSize="xl"
              fontWeight="semibold"
              color={textColor}
              textAlign="center"
            >
              {currentPair[1] || "Bye"}
            </Text>
          </Box>
        </Card>
      </VStack>
    </VStack>
  );
} 