# User Feature

## Overview

- User authentication
- Session management
- User preferences
- User interface components

## Directory Structure

### `/components`

- `UserMenu.tsx` - User menu and authentication UI

### `/hooks`

- `useSession.ts` - Session management hook

## Usage

```typescript
import { UserMenu, useSession } from '@/features/user';

// Using the session hook
const { session, login, logout } = useSession();

// Rendering user components
<UserMenu onLogin={handleLogin} isAdmin={false} />
``` 
