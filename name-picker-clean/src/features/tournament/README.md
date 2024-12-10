# Tournament Feature

## Overview

- Tournament creation and configuration
- Match management
- Results tracking
- Tournament history

## Directory Structure

### `/api`

- `storage.ts` - Tournament data persistence

### `/components`

- `Tournament.tsx` - Main tournament component
- `NameInput.tsx` - Name input for tournament setup
- `Results.tsx` - Tournament results display
- `TournamentHistory.tsx` - History of past tournaments
- `Bracket.tsx` - Tournament bracket visualization

### `/hooks`

- `useTournament.ts` - Tournament state management

### `/types`

- `tournament.ts` - Tournament-related type definitions

## Usage

```typescript
import {
  Tournament,
  useTournament,
  type TournamentResult
} from '@/features/tournament';

// Using the tournament hook
const tournament = useTournament();

// Rendering tournament components
<Tournament />
<Results />
<TournamentHistory />
``` 
