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
    validation/  # Input validation utilities
    utils/       # Utility functions (formatting, etc.)
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

## IMPORTANT RULE - Prompt Synchronization

**⚠️ CRITICAL:** Any changes made to `prompts/workout-parser.md` MUST be simultaneously implemented in `src/lib/services/claude.service.ts` in the `systemPrompt` variable.

### Why This Matters
The `prompts/workout-parser.md` file serves as documentation and a reference for developers, but the actual prompt sent to Claude AI is defined in the `systemPrompt` variable within `claude.service.ts`. These two must always be in sync.

### Process for Updating Prompts
1. Update `prompts/workout-parser.md` with the new rules/examples
2. **ALSO** update the `systemPrompt` variable in `src/lib/services/claude.service.ts`
3. Ensure both files contain identical information
4. Test the changes before deploying

### Verification Checklist
- [ ] Changes applied to `prompts/workout-parser.md`
- [ ] Changes applied to `src/lib/services/claude.service.ts` systemPrompt
- [ ] Both files are consistent
- [ ] Build passes without errors
- [ ] Test with actual workout messages

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
  - [x] Add retry logic with exponential backoff
  - [x] Implement logging for debugging
  - [x] Add timeout handling
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
- [x] **Create validation module**
  - [x] Create `src/lib/validation/exercise-validator.ts`
  - [x] Add input sanitization functions
  - [x] Implement exercise name normalization
  - [x] Create duration/sets/reps validation
  - [x] Add custom exercise type mapping
  - [x] Implement feedback message generation
- [x] **Update message formatting**
  - [x] Create `src/lib/utils/message-formatter.ts`
  - [x] Add success message templates
  - [x] Create error message templates
  - [x] Implement confirmation message logic
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

## Flujo de Registro y Login (SMS)

### Registro Nuevo Usuario
1. Usuario entra a `/` (homepage)
2. Ingresa: Nombre + Teléfono (con selector de país de 19 países de América)
3. Sistema valida teléfono único
4. Genera código SMS de 6 dígitos
5. Envía SMS vía Twilio al número del usuario
6. Redirige a `/verify?phone=+51999XXXXXX&register=true`
7. Usuario ingresa código recibido por SMS
8. Sistema verifica código y marca usuario como verificado
9. Sistema intenta enviar mensaje de bienvenida por WhatsApp
   - Si tiene éxito: Usuario recibe mensaje en WhatsApp
   - Si falla (no está en Sandbox): Guarda estado y continúa
10. Redirige a `/dashboard`
11. Dashboard verifica estado de WhatsApp
    - Si no está en Sandbox: Muestra banner amarillo con instrucciones para unirse
    - Si está en Sandbox: Muestra dashboard normal

### Login Usuario Existente
1. Usuario entra a `/login`
2. Ingresa: Teléfono (con selector de país)
3. Sistema valida que usuario existe en la base de datos
4. Genera código SMS de 6 dígitos
5. Envía SMS vía Twilio
6. Redirige a `/verify?phone=+51999XXXXXX`
7. Usuario ingresa código
8. Sistema verifica código
9. Redirige a `/dashboard`
10. Dashboard muestra banner si el usuario aún no está en WhatsApp Sandbox

### Uso WhatsApp (Tracking de Entrenamientos)
1. Usuario ya registrado y verificado en la web
2. Usuario envía mensaje por WhatsApp al número de Twilio (+14155238886)
3. Sistema reconoce número de teléfono (ya está en DB)
4. Inicia flujo normal de tracking de entrenamientos:
   - Parsea mensaje con Claude
   - Pide datos faltantes si es necesario
   - Muestra resumen por set
   - Pide confirmación
   - Pide comentario
   - Guarda en base de datos
5. Datos sincronizados automáticamente con dashboard web

### Mensaje de Bienvenida por WhatsApp
```
¡Bienvenido a Masetrack, [Nombre]! 🎉

Tu cuenta está activa.

📱 Para registrar entrenamientos:
• Escríbenos por WhatsApp a este número
• Ejemplo: "Press de banca 80kg 10 reps 3 series"
• Guardaré todo automáticamente

💻 Para ver tu progreso:
• Accede a: https://workout-wsp-tracker.vercel.app
• Revisa tu historial y estadísticas

¿Preguntas? Responde aquí o escribe "ayuda"

¡A entrenar! 💪
```

### Datos Técnicos
- **Número de WhatsApp Sandbox:** +14155238886
- **Número de SMS Twilio:** +18204449516 (número de teléfono regular)
- **Países soportados:** 19 países de América (Perú default)
- **Costo SMS:** ~$0.0075 USD por mensaje
- **Costo WhatsApp:** Gratis cuando el usuario inicia la conversación

## Flujo de Autenticación y WhatsApp

### Flujo Completo de Registro (Usuarios Nuevos)
1. Usuario nuevo entra a homepage (`/`)
2. Ingresa nombre + teléfono
3. Sistema genera código SMS de 6 dígitos
4. Envía SMS vía Twilio
5. Redirige a `/verify?phone=...&register=true`
6. Usuario ingresa código SMS
7. Sistema verifica código
8. **SI ES REGISTRO (register=true):** Envía mensaje de bienvenida por WhatsApp
9. Redirige a dashboard
10. Usuario puede usar la aplicación

### Flujo de Login (Usuarios Existentes)
1. Usuario existente entra a `/login`
2. Ingresa teléfono
3. Sistema genera código SMS
4. Envía SMS vía Twilio
5. Redirige a `/verify?phone=...` (SIN register=true)
6. Usuario ingresa código
7. Sistema verifica código
8. **NO envía mensaje de WhatsApp** (usuario ya registrado)
9. Redirige a dashboard

### Nota Importante
El mensaje de bienvenida por WhatsApp SOLO debe enviarse durante el registro inicial (`isRegister = true`). Los usuarios existentes que hacen login no deben recibir este mensaje.

## Fix de Bug: Substring Matching en Comandos

**Fecha:** 2026-02-06  
**Archivo:** `src/lib/services/conversation.service.ts`  
**Problema:** La función `isCommand` usaba `includes()` para verificar comandos, causando que palabras como "curl" coincidan con "url".

**Ejemplo del bug:**
- Usuario envía: "Lying leg curl 60kg..."
- Sistema detecta: `'curl'.includes('url')` → `true`
- Resultado: Muestra mensaje del dashboard en lugar de procesar ejercicio

**Solución aplicada:**
```typescript
private isCommand(message: string, commandList: string[]): boolean {
  const msg = message.toLowerCase().trim();
  const words = msg.split(/\s+/);
  return commandList.some(cmd => words.includes(cmd));
}
```

**Verificación:** Usar coincidencia de palabras completas en lugar de substrings.
