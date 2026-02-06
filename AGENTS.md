# AGENTS.md - Workout Tracker API

Guidelines for agentic coding agents working in this repository.

## Build/Lint/Test Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Lint (Next.js ESLint)
npm run lint

# Install dependencies
npm install

# Deploy to Vercel
vercel
```

**Note:** No test framework is currently configured. Add tests using Jest or Vitest if needed.

## Code Style Guidelines

### TypeScript
- **Strict mode enabled** - Always use proper types, avoid `any`
- Use interfaces for object shapes, types for unions
- Prefer `interface` over `type` for extensibility
- Use path aliases: `@/` for imports from `src/`

### Imports
```typescript
// 1. External libraries (alphabetical)
import { NextRequest, NextResponse } from 'next/server'
import Twilio from 'twilio'

// 2. Internal absolute imports (alphabetical)
import { getSupabaseClient } from '@/lib/supabase/client'
import { sendWhatsAppMessage } from '@/lib/services/twilio.service'

// 3. Relative imports (if needed)
import { MyComponent } from './components/MyComponent'
```

### Naming Conventions
- **Files:** kebab-case (e.g., `twilio.service.ts`, `route.ts`)
- **Components:** PascalCase (e.g., `ThemeProvider.tsx`)
- **Functions:** camelCase (e.g., `sendWhatsAppMessage`)
- **Types/Interfaces:** PascalCase (e.g., `ConversationState`, `User`)
- **Constants:** UPPER_SNAKE_CASE for true constants
- **API routes:** Always use `route.ts` in App Router

### Error Handling
- Always wrap async operations in try/catch
- Log errors with context: `console.error('Error in X:', error)`
- Return appropriate HTTP status codes in API routes
- Use early returns for validation errors

```typescript
export async function POST(request: NextRequest) {
  try {
    const { name, phone } = await request.json()
    
    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Nombre y teléfono requeridos' },
        { status: 400 }
      )
    }
    // ... logic
  } catch (error) {
    console.error('Error en registro:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
```

### React Components
- Use functional components with explicit return types when complex
- Mark client components with `'use client'` at top
- Use React hooks following rules of hooks
- Destructure props in function parameters

```typescript
'use client'

import { useState, useEffect } from 'react'

interface Props {
  title: string
  onAction: () => void
}

export function MyComponent({ title, onAction }: Props) {
  const [count, setCount] = useState(0)
  // ...
}
```

### Styling (Tailwind + CSS)
- Use Tailwind utility classes as primary styling method
- Custom CSS in `globals.css` using `@layer components` for reusable patterns
- CSS variables for theme colors (see `globals.css` for industrial theme)
- Dark mode support via `.dark` and `.light` classes
- Use theme colors: `var(--bg-primary)`, `var(--accent)`, etc.

### API Routes (Next.js App Router)
- Place in `src/app/api/[route]/route.ts`
- Export named functions: `GET`, `POST`, `PUT`, `DELETE`, etc.
- Always use `NextRequest` and `NextResponse`
- Validate request body before processing

### Database (Supabase)
- Use `getSupabaseClient()` from `@/lib/supabase/client`
- Handle errors from Supabase queries
- Use TypeScript types from `src/types/index.ts`

### Environment Variables
Required variables (in `.env.local`):
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`
- `ANTHROPIC_API_KEY`

### Project Structure
```
src/
  app/           # Next.js App Router
    api/         # API routes
    dashboard/   # Dashboard pages
    layout.tsx   # Root layout
    globals.css  # Global styles
  components/    # React components
    theme/       # Theme-related components
    layout/      # Layout components
    workouts/    # Workout components
  lib/           # Utility libraries
    auth/        # Authentication utilities
    data/        # Data access
    services/    # External services (Twilio, etc.)
    supabase/    # Supabase client
  types/         # TypeScript types
```

### Language
- UI text in Spanish (this is a Spanish-language app)
- Code comments can be in Spanish or English
- Error messages should be user-friendly in Spanish

### Git
- No pre-commit hooks configured
- Commit when explicitly requested by user
- Never commit `.env.local` or secrets

## Detailed Implementation Todo

### 1. Prompts Updates
- [ ] **prompts/workout-parser.md**
  - [ ] Review and update system prompt instructions
  - [ ] Add validation examples for edge cases
  - [ ] Clarify expected output format (JSON structure)
  - [ ] Update exercise type mapping guidelines
  - [ ] Add examples for common user input variations
  - [ ] Document error handling scenarios

### 2. Types Updates
- [ ] **src/types/index.ts**
  - [ ] Add `ExerciseType` enum for standardization
  - [ ] Create `ParsedExercise` interface for AI responses
  - [ ] Define `ValidationError` interface for error handling
  - [ ] Update `WorkoutExercise` interface if needed
  - [ ] Add type guards for runtime validation
  - [ ] Create utility types for exercise transformation

### 3. Claude Service Updates
- [ ] **src/lib/services/claude.service.ts**
  - [ ] Refactor `parseWorkoutMessage()` to use updated prompts
  - [ ] Implement proper error handling for API failures
  - [ ] Add response validation before returning
  - [ ] Create helper function for prompt formatting
  - [ ] Add retry logic with exponential backoff
  - [ ] Implement logging for debugging
  - [ ] Add timeout handling
  - [ ] Create type-safe response parsing

### 4. Conversation Service Updates
- [ ] **src/lib/services/conversation.service.ts**
  - [ ] Refactor `handleIncomingMessage()` flow
  - [ ] Add message validation layer
  - [ ] Update state management logic
  - [ ] Implement proper error recovery
  - [ ] Add metrics/logging for message processing
  - [ ] Create helper functions for workout creation
  - [ ] Update response formatting functions
  - [ ] Add conversation state persistence

### 5. Validation & Message Formatting
- [ ] **Create validation module**
  - [ ] Create `src/lib/validation/exercise-validator.ts`
  - [ ] Add input sanitization functions
  - [ ] Implement exercise name normalization
  - [ ] Create duration/sets/reps validation
  - [ ] Add custom exercise type mapping
  - [ ] Implement feedback message generation
- [ ] **Update message formatting**
  - [ ] Create `src/lib/utils/message-formatter.ts`
  - [ ] Add success message templates
  - [ ] Create error message templates
  - [ ] Implement confirmation message logic
  - [ ] Add multi-format response support (text/WhatsApp)

### Testing & Verification
- [ ] Add unit tests for validation functions
- [ ] Add integration tests for Claude service
- [ ] Test conversation flow end-to-end
- [ ] Verify error handling scenarios
- [ ] Validate message formatting output
- [ ] Test with various user input styles
- [ ] Verify Supabase data persistence

### Documentation
- [ ] Update API documentation
- [ ] Add inline code comments
- [ ] Update README with new features
- [ ] Document error codes and handling
- [ ] Add example request/response pairs
