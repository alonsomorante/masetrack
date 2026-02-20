import { ParsedWorkout, ExerciseType } from '@/types';

export function formatDuration(seconds: number | null | undefined): string {
  if (!seconds) return '';
  
  if (seconds < 60) {
    return `${seconds} seg`;
  }
  
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (remainingSeconds > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${minutes} min`;
  }
  
  const hours = Math.floor(seconds / 3600);
  const remainingMinutes = Math.floor((seconds % 3600) / 60);
  if (remainingMinutes > 0) {
    return `${hours}h ${remainingMinutes}m`;
  }
  return `${hours} hora${hours > 1 ? 's' : ''}`;
}

export function formatWeight(weight: number | number[] | null | undefined): string {
  if (weight === null || weight === undefined) return '—';
  
  if (Array.isArray(weight)) {
    const uniqueWeights = [...new Set(weight)];
    if (uniqueWeights.length === 1) {
      return `${uniqueWeights[0]} kg`;
    }
    return weight.map(w => `${w} kg`).join(', ');
  }
  
  return `${weight} kg`;
}

export function formatReps(reps: number | number[] | null | undefined): string {
  if (reps === null || reps === undefined) return '—';
  
  if (Array.isArray(reps)) {
    const uniqueReps = [...new Set(reps)];
    if (uniqueReps.length === 1) {
      return `${uniqueReps[0]}`;
    }
    return reps.join(', ');
  }
  
  return `${reps}`;
}

export function formatRIR(rir: number | number[] | null | undefined): string {
  if (rir === null || rir === undefined) return '—';
  
  if (Array.isArray(rir)) {
    const uniqueRIR = [...new Set(rir)];
    if (uniqueRIR.length === 1) {
      return `RIR: ${uniqueRIR[0]}`;
    }
    return rir.map(r => `RIR: ${r}`).join(', ');
  }
  
  return `RIR: ${rir}`;
}

export function buildStrengthSetLines(
  parsed: ParsedWorkout,
  isWeighted: boolean
): string[] {
  const lines: string[] = [];
  const sets = parsed.sets || 1;
  const weights = Array.isArray(parsed.weight_kg) ? parsed.weight_kg : (parsed.weight_kg ? [parsed.weight_kg] : []);
  const reps = Array.isArray(parsed.reps) ? parsed.reps : (parsed.reps ? [parsed.reps] : []);
  const rirs = Array.isArray(parsed.rir) ? parsed.rir : (parsed.rir ? [parsed.rir] : []);

  for (let i = 0; i < sets; i++) {
    const setNum = i + 1;
    const weight = weights[i] !== undefined ? weights[i] : weights[0];
    const rep = reps[i] !== undefined ? reps[i] : reps[0];
    const rir = rirs[i] !== undefined ? rirs[i] : rirs[0];

    let line = `Set ${setNum}: `;
    
    if (isWeighted && weight !== undefined) {
      line += `${weight} kg × ${rep || '—'} reps`;
    } else {
      line += `${rep || '—'} reps`;
    }
    
    if (rir !== undefined) {
      line += ` (RIR: ${rir})`;
    } else {
      line += ' (RIR: —)';
    }
    
    lines.push(line);
  }

  return lines;
}

export function formatWorkoutSummary(
  parsed: ParsedWorkout,
  exerciseName: string,
  isCustom: boolean = false
): string {
  const customTag = isCustom ? ' (Personalizado)' : '';
  const type = parsed.exercise_type as ExerciseType;

  switch (type) {
    case 'strength_weighted': {
      const lines = buildStrengthSetLines(parsed, true);
      return `🏋️ ${exerciseName}${customTag}\n📊 Resumen por set:\n${lines.join('\n')}`;
    }

    case 'strength_bodyweight': {
      const lines = buildStrengthSetLines(parsed, false);
      return `💪 ${exerciseName}${customTag}\n📊 Resumen por set:\n${lines.join('\n')}`;
    }

    case 'isometric_time': {
      const durationText = formatDuration(parsed.duration_seconds);
      return `⏱️ ${exerciseName}${customTag}: ${durationText}`;
    }

    case 'cardio_time': {
      const durationText = formatDuration(parsed.duration_seconds);
      const caloriesText = parsed.calories ? ` (${parsed.calories} cal)` : '';
      return `🏃 ${exerciseName}${customTag}: ${durationText}${caloriesText}`;
    }

    case 'cardio_distance': {
      const distanceText = parsed.distance_km ? `${parsed.distance_km}km` : '—';
      return `🏃 ${exerciseName}${customTag}: ${distanceText}`;
    }

    case 'cardio_both': {
      const timeText = formatDuration(parsed.duration_seconds);
      const distText = parsed.distance_km ? `${parsed.distance_km}km` : '';
      const separator = timeText && distText ? ' + ' : '';
      return `🏃 ${exerciseName}${customTag}: ${timeText}${separator}${distText}`;
    }

    default:
      return `🏋️ ${exerciseName}${customTag}`;
  }
}

export function formatMissingDataMessage(missingFields: string[]): string {
  const fieldLabels: Record<string, string> = {
    weight_kg: 'peso (kg)',
    reps: 'repeticiones',
    sets: 'series',
    rir: 'RIR',
    duration_seconds: 'duración',
    distance_km: 'distancia',
  };

  const labels = missingFields.map(field => fieldLabels[field] || field);

  if (labels.length === 0) {
    return '';
  }

  if (labels.length === 1) {
    return `⚠️ Falta: ${labels[0]}`;
  }

  if (labels.length === 2) {
    return `⚠️ Faltan: ${labels[0]} y ${labels[1]}`;
  }

  const lastLabel = labels.pop();
  return `⚠️ Faltan: ${labels.join(', ')} y ${lastLabel}`;
}

export function formatSuccessMessage(exerciseName: string): string {
  return `✅ ${exerciseName} guardado correctamente`;
}

export function formatErrorMessage(error: string): string {
  return `❌ Error: ${error}`;
}

export function formatWelcomeMessage(name: string): string {
  return `¡Bienvenido a Masetrack, ${name}! 🎉\n\nTu cuenta está activa.\n\n📱 Para registrar entrenamientos:\n• Escríbenos por WhatsApp\n• Ejemplo: "Press de banca 80kg 10 reps 3 series"\n• Guardaré todo automáticamente\n\n💻 Para ver tu progreso:\n• Accede a: https://workout-wsp-tracker.vercel.app\n\n¿Preguntas? Responde aquí o escribe "ayuda"\n\n¡A entrenar! 💪`;
}

export function formatHelpMessage(): string {
  return `📖 *Guía de Comandos*\n\n` +
    `*Registrar ejercicio:*\n` +
    `• "Press banca 80kg 10 reps 3 series"\n` +
    `• "Dominadas 10 reps 3 sets"\n` +
    `• "Plancha 60 segundos"\n\n` +
    `*Comandos:*\n` +
    `• "ayuda" - Ver esta guía\n` +
    `• "ejercicios" - Ver mis ejercicios\n` +
    `• "web" - Link del dashboard\n` +
    `• "cancelar" - Cancelar operación actual`;
}

export function formatRIRExplanation(): string {
  return `📊 *RIR (Repeticiones en Reserva)*\n\n` +
    `Indica cuántas repeticiones más podrías hacer antes de llegar al fallo.\n\n` +
    `• *RIR 0* = Fallo (no puedes hacer más)\n` +
    `• *RIR 1* = Podrías hacer 1 más\n` +
    `• *RIR 2* = Podrías hacer 2 más\n` +
    `• etc.\n\n` +
    `Ejemplo: "10 reps RIR 2" = Hiciste 10 reps pero podrías haber hecho 2 más.`;
}
