"use client";

import React, { useCallback } from "react";
import {
  VStack,
  Text,
  useColorModeValue,
  Container,
} from "@chakra-ui/react";
import { NameInputForm } from "@/components/tournament/NameInputForm";
import { TournamentSorter } from "@/components/tournament/TournamentSorter";
import { Tournament } from "@/components/tournament/Tournament";
import Background from "@/components/ui/Background";
import { useTournamentState } from "@/lib/hooks";
import type { Match } from "@/lib/types";

const InputView = ({
  onSubmit,
}: {
  onSubmit: (names: string[]) => void;
}): JSX.Element => {
  return (
    <Container maxW="container.md" py={8}>
      <NameInputForm onSubmit={onSubmit} />
    </Container>
  );
};

const TournamentView = ({
  names,
  onComplete,
}: {
  names: string[];
  onComplete: (sortedNames: string[]) => void;
}): JSX.Element => {
  return (
    <Container maxW="container.lg" py={8}>
      <TournamentSorter names={names} onComplete={onComplete} />
    </Container>
  );
};

const ResultsView = ({
  matches,
  onReset,
}: {
  matches: Match[];
  onReset: () => void;
}): JSX.Element => {
  const textColor = useColorModeValue("gray.700", "gray.200");

  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={8}>
        <Text fontSize="2xl" fontWeight="bold" color={textColor}>
          Tournament Results
        </Text>
        <Tournament matches={matches} />
        <Text
          as="button"
          color={textColor}
          textDecoration="underline"
          onClick={onReset}
          cursor="pointer"
          _hover={{ opacity: 0.8 }}
        >
          Start New Tournament
        </Text>
      </VStack>
    </Container>
  );
};

export default function Home(): JSX.Element {
  const { appState, names, matches, setNames, setAppState, reset } =
    useTournamentState();

  const handleComplete = useCallback(
    () => {
      setAppState("results");
    },
    [setAppState]
  );

  return (
    <main>
      <Background>
        {appState === "input" && <InputView onSubmit={setNames} />}
        {appState === "sorting" && (
          <TournamentView names={names} onComplete={handleComplete} />
        )}
        {appState === "results" && (
          <ResultsView matches={matches} onReset={reset} />
        )}
      </Background>
    </main>
  );
}
