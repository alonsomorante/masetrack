# Plan de Correcciones - Masetrack

Fecha: 2026-02-06

## Cambios Necesarios

### 1. BUG CRÍTICO: Mensaje de WhatsApp enviado a usuarios existentes

**Problema:** El mensaje de bienvenida por WhatsApp se envía tanto a usuarios nuevos como existentes cuando verifican el código. Solo debería enviarse a usuarios NUEVOS durante el registro.

**Archivos a modificar:**

#### A. `src/app/verify/page.tsx` (línea 33)
Cambiar:
```typescript
body: JSON.stringify({ phone, code }),
```
Por:
```typescript
body: JSON.stringify({ phone, code, isRegister }),
```

#### B. `src/app/api/auth/verify-code/route.ts`

Línea 12: Cambiar
```typescript
const { phone, code } = await request.json()
```
Por:
```typescript
const { phone, code, isRegister } = await.request.json()
```

Líneas 43-75: Reemplazar TODO el bloque de envío de WhatsApp con:

```typescript
    // Intentar enviar mensaje de bienvenida por WhatsApp (SOLO para usuarios nuevos)
    let whatsappJoined = true
    if (isRegister) {
      try {
        const welcomeMessage = `¡Bienvenido a Masetrack, ${user.name}! 🎉

Tu cuenta está activa.

📱 Para registrar entrenamientos:
• Escríbenos por WhatsApp a este número
• Ejemplo: "Press de banca 80kg 10 reps 3 series"
• Guardaré todo automáticamente

💻 Para ver tu progreso:
• Accede a: https://workout-wsp-tracker.vercel.app
• Revisa tu historial y estadísticas

¿Preguntas? Responde aquí o escribe "ayuda"

¡A entrenar! 💪`

        await sendWhatsAppMessage(phone, welcomeMessage)
      } catch (error: any) {
        // Si es error de Sandbox (número no válido para WhatsApp), ignorar silenciosamente
        if (error.message?.includes('not a valid WhatsApp') || 
            error.code === 21614 ||
            error.status === 400) {
          whatsappJoined = false
          console.log(`Usuario ${phone} no está en WhatsApp Sandbox, continuando sin enviar mensaje`)
        } else {
          // Otros errores sí los loggeamos pero no bloqueamos al usuario
          console.error('Error enviando WhatsApp de bienvenida:', error)
        }
      }
    }
```

---

### 2. AGENTS.md - Actualizaciones necesarias

**Agregar al final del archivo:**

```markdown
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
1. Usuario existent entra a `/login`
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
```