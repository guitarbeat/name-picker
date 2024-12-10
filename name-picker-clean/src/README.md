# Project Structure

## Core Directories

### `/components`
- `/Layout` - Layout components used across the app
- `/ui` - Reusable UI components (Button, Card, etc.)

### `/features`
Feature-based modules, each containing:
- `/api` - API/data layer
- `/components` - Feature-specific components
- `/hooks` - Custom hooks
- `/types` - TypeScript types
- `/utils` - Helper functions

Current features:
- `/tournament` - Tournament management
- `/user` - User management and authentication

### `/styles`
- `/global` - Global styles and reset
- `/theme` - Theme variables and design tokens

### `/constants`
Application-wide constants and configuration

### `/types`
Global TypeScript types (most types live in features)

## Import Convention
```typescript
// UI Components
import { Button, Card } from '@/components/ui';

// Feature modules
import { Tournament, useTournament } from '@/features/tournament';
import { UserMenu, useSession } from '@/features/user';

// Constants
import { DEFAULT_NAMES } from '@/constants';
```

## Style Organization
- Global styles: `src/styles/global/`
- Theme variables: `src/styles/theme/`
- Component styles: Co-located with components using CSS Modules 