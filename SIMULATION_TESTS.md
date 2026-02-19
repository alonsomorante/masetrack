# Simulador de Conversaciones - Workout Tracker

Este documento contiene escenarios de prueba para verificar el comportamiento del bot.

## Cómo usar

Cada escenario incluye:
- **Entrada**: Mensaje del usuario
- **Estado esperado**: Respuesta del bot
- **Datos extraídos**: Lo que debería haber extraído Claude
- **Posibles fallas**: Errores comunes a verificar

---

## ESCENARIO 1: Mensaje completo de una vez

**Entrada:**
```
Usuario: "Bench press 80kg 10 reps 3 series RIR 2"
```

**Comportamiento esperado:**
- Bot muestra resumen completo
- Pide confirmación para guardar

**Verificar:**
- ✅ Exercise: "Bench press"
- ✅ Weight: 80kg
- ✅ Reps: 10
- ✅ Sets: 3
- ✅ RIR: 2
- ✅ Mensaje: "🏋️ Resumen: Bench press 80kg × 10 reps × 3 sets × RIR 2. ¿Guardar? ✅"

**Fallas posibles:**
- ❌ No extrae RIR
- ❌ Confunde series con reps
- ❌ Pregunta por datos que ya dio

---

## ESCENARIO 2: Solo ejercicio + peso (el problema de hoy)

**Entrada:**
```
Usuario: "Press banca 70 kilos"
```

**Comportamiento esperado:**
- Extrae: exercise="Press banca", weight=70kg
- Faltan: reps, sets, rir
- Pregunta: "¿Reps, sets y RIR? 🔢"

**Verificar:**
- ✅ Exercise: "Press de banca" (o similar)
- ✅ Weight: 70
- ✅ NO pregunta por ejercicio ni peso
- ✅ Pregunta por reps, sets, rir

**Fallas posibles:**
- ❌ Dice "No reconocí como ejercicio" (CONFIRMADO HOY)
- ❌ Interpreta "70 kilos" como parte del nombre
- ❌ Pide ejercicio de nuevo

---

## ESCENARIO 3: Respuesta ambigua a RIR

**Entrada paso 1:**
```
Usuario: "Pec fly 30kg 8 reps 2 sets"
```

**Entrada paso 2:**
```
Usuario: "más o menos"
```

**Comportamiento esperado:**
- Detecta ambigüedad
- Pide clarificación: "¿Cuántas más? 0-5 💪"

**Verificar:**
- ✅ No asume número
- ✅ Pide número específico

**Fallas posibles:**
- ❌ Asume RIR 1
- ❌ No entiende la respuesta

---

## ESCENARIO 4: RIR mixto por set

**Entrada:**
```
Usuario: "senti que en el primer set lo di todo pero en la última pude haber hecho 1 más"
```

**Comportamiento esperado (asumiendo 2 sets):**
- Extrae: RIR [0, 1]
- Muestra resumen con RIR por set

**Verificar:**
- ✅ Set 1: RIR 0
- ✅ Set 2: RIR 1
- ✅ RIR es array [0, 1], no número único

**Fallas posibles:**
- ❌ Asume RIR 1 para todos
- ❌ No detecta que es mixto

---

## ESCENARIO 5: Pregunta "¿Qué es RIR?"

**Entrada paso 1:**
```
Usuario: "Press 60kg 10 reps 3 sets"
```

**Entrada paso 2:**
```
Usuario: "que es el rir"
```

**Comportamiento esperado:**
- Detecta que es una pregunta, no un valor
- Explica: "RIR = Repeticiones en Reserva..."
- Pregunta de nuevo: "¿Cuántas más? 0-5 💪"

**Verificar:**
- ✅ NO asume RIR 1
- ✅ Explica qué es
- ✅ Vuelve a preguntar

**Fallas posibles:**
- ❌ Asume RIR 1 (CONFIRMADO HOY)
- ❌ Guarda sin RIR

---

## ESCENARIO 6: Datos ya proporcionados no se repiten

**Entrada paso 1:**
```
Usuario: "Bench press 3 sets"
```

**Comportamiento esperado:**
- Extrae: exercise="Bench press", sets=3
- Faltan: weight, reps, rir
- Pregunta: "¿Peso, reps y RIR? 🏋️🔢💪"

**Verificar:**
- ✅ NO pregunta "¿Qué ejercicio?"
- ✅ NO pregunta "¿Cuántos sets?"
- ✅ Solo pregunta lo que falta

**Fallas posibles:**
- ❌ Pregunta "¿Sets y reps?" (CONFIRMADO HOY - preguntaba sets de nuevo)

---

## ESCENARIO 7: Typos y variaciones

**Entradas a probar:**
```
Usuario: "press banca 80kg" (sin "de")
Usuario: "dominadas 10 repeticiones" (repeticiones vs reps)
Usuario: "sentadilla 100 kilos" (kilos vs kg)
Usuario: "bench 80" (abreviado)
```

**Comportamiento esperado:**
- Extrae correctamente a pesar de typos
- Interpreta "kilos" como kg
- Interpreta "repeticiones" como reps

**Verificar:**
- ✅ Flexible con typos
- ✅ Reconoce variaciones

---

## ESCENARIO 8: Solo dice "sí" a llegaste al fallo

**Entrada paso 1:**
```
Usuario: "Press 80kg 10 reps 3 sets"
```

**Entrada paso 2 (bot pregunta RIR):**
```
Bot: "¿Fallo? 0-5 💪"
```

**Entrada paso 3:**
```
Usuario: "sí"
```

**Comportamiento esperado:**
- Interpreta "sí" como RIR 0 (llegó al fallo)
- RIR = [0, 0, 0] para los 3 sets

**Verificar:**
- ✅ RIR = 0
- ✅ No pide más clarificación

**Fallas posibles:**
- ❌ Pregunta "¿Cuántas más?"
- ❌ No entiende "sí"

---

## ESCENARIO 9: Mensaje incompleto sin ejercicio claro

**Entrada:**
```
Usuario: "80kg 10 reps"
```

**Comportamiento esperado:**
- Detecta que falta ejercicio
- Pregunta: "¿Qué ejercicio? 🏋️"
- Extrae: weight=80kg, reps=10

**Verificar:**
- ✅ Pide ejercicio
- ✅ Extrae datos numéricos

---

## ESCENARIO 10: Comando "ayuda" en medio de flujo

**Entrada paso 1:**
```
Usuario: "Bench press 80kg"
```

**Entrada paso 2:**
```
Usuario: "ayuda"
```

**Comportamiento esperado:**
- Detecta comando
- Muestra mensaje de ayuda
- Conserva contexto del ejercicio

**Verificar:**
- ✅ Muestra ayuda
- ✅ No pierde "Bench press 80kg"

---

## RESULTADOS DE PRUEBAS

### Pruebas Exitosas ✅
- [ ] Escenario 1: Mensaje completo
- [ ] Escenario 2: Ejercicio + peso
- [ ] Escenario 3: RIR ambiguo
- [ ] Escenario 4: RIR mixto
- [ ] Escenario 5: Pregunta qué es RIR
- [ ] Escenario 6: No repetir datos
- [ ] Escenario 7: Typos
- [ ] Escenario 8: "sí" = RIR 0
- [ ] Escenario 9: Sin ejercicio
- [ ] Escenario 10: Comando ayuda

### Fallas Detectadas ❌
- **Escenario 2**: "Press banca 70 kilos" → "No reconocí como ejercicio" (CONFIRMADO)
- **Escenario 5**: "que es el rir" → Asume RIR 1 (CONFIRMADO)
- **Escenario 6**: "Bench press 3 sets" → Pide "Sets y reps" de nuevo (CONFIRMADO)

### Pendientes de Verificación
- [ ] Escenario 4: RIR mixto por set
- [ ] Escenario 8: "sí" como RIR 0
