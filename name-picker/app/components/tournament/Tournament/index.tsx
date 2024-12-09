"use client";

import React from "react";
import {
  VStack,
  Text,
  useColorModeValue,
  Box,
} from "@chakra-ui/react";
import { Card } from "@/components/core/Card";
import type { Match } from "@/lib/types";

interface TournamentProps {
  matches: Match[];
}

export function Tournament({ matches }: TournamentProps): JSX.Element {
  const textColor = useColorModeValue("gray.700", "gray.200");

  return (
    <VStack spacing={4} w="full">
      {matches.map((match, index) => (
        <Card key={index} variant="outline" w="full">
          <Box p={4}>
            <VStack spacing={2}>
              <Text
                color={match.winner === "1" ? "green.500" : textColor}
                fontSize="lg"
                fontWeight={match.winner === "1" ? "bold" : "normal"}
              >
                {match.name1}
              </Text>
              <Text color={textColor} fontSize="sm">
                vs
              </Text>
              <Text
                color={match.winner === "2" ? "green.500" : textColor}
                fontSize="lg"
                fontWeight={match.winner === "2" ? "bold" : "normal"}
              >
                {match.name2 || "Bye"}
              </Text>
            </VStack>
          </Box>
        </Card>
      ))}
    </VStack>
  );
} 