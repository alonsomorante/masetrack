import { ParsedWorkout, ExerciseType } from '@/types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateParsedWorkout(workout: ParsedWorkout): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!workout.exercise_name || workout.exercise_name.trim() === '') {
    errors.push('Exercise name is required');
  }

  const type = workout.exercise_type;

  if (type === 'strength_weighted') {
    if (!workout.weight_kg && workout.weight_kg !== 0) {
      errors.push('Weight is required for weighted exercises');
    }
    if (workout.weight_kg && typeof workout.weight_kg === 'number' && workout.weight_kg <= 0) {
      errors.push('Weight must be greater than 0');
    }
    if (!workout.reps) {
      errors.push('Reps are required for strength exercises');
    }
    if (!workout.sets) {
      errors.push('Sets are required for strength exercises');
    }
  }

  if (type === 'strength_bodyweight') {
    if (!workout.reps) {
      errors.push('Reps are required for bodyweight exercises');
    }
    if (!workout.sets) {
      errors.push('Sets are required for bodyweight exercises');
    }
  }

  if (type === 'isometric_time' || type === 'cardio_time') {
    if (!workout.duration_seconds) {
      errors.push('Duration is required for time-based exercises');
    }
  }

  if (type === 'cardio_distance' || type === 'cardio_both') {
    if (!workout.distance_km) {
      errors.push('Distance is required for distance-based cardio');
    }
  }

  if (type === 'cardio_both') {
    if (!workout.duration_seconds) {
      errors.push('Duration is required when tracking both time and distance');
    }
  }

  if (workout.rir !== null && workout.rir !== undefined) {
    const rirValue = Array.isArray(workout.rir) ? workout.rir[0] : workout.rir;
    if (typeof rirValue === 'number' && (rirValue < 0 || rirValue > 5)) {
      errors.push('RIR must be between 0 and 5');
    }
  }

  if (workout.sets && workout.sets < 1) {
    errors.push('Sets must be at least 1');
  }

  if (workout.reps) {
    const repsValue = Array.isArray(workout.reps) ? workout.reps[0] : workout.reps;
    if (typeof repsValue === 'number' && repsValue < 1) {
      errors.push('Reps must be at least 1');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export function sanitizeExerciseName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\sáéíóúñÁÉÍÓÚÑ-]/gi, '')
    .trim();
}

export function normalizeWeight(weight: number | number[] | null): number | number[] | null {
  if (weight === null || weight === undefined) return null;
  
  if (Array.isArray(weight)) {
    return weight.map(w => Math.round(w * 10) / 10);
  }
  
  return Math.round(weight * 10) / 10;
}

export function normalizeReps(reps: number | number[] | null): number | number[] | null {
  if (reps === null || reps === undefined) return null;
  
  if (Array.isArray(reps)) {
    return reps.map(r => Math.round(r));
  }
  
  return Math.round(reps);
}

export function normalizeSets(sets: number | null): number | null {
  if (sets === null || sets === undefined) return null;
  return Math.round(sets);
}

export function normalizeRIR(rir: number | number[] | null): number | number[] | null {
  if (rir === null || rir === undefined) return null;
  
  if (Array.isArray(rir)) {
    return rir.map(r => Math.min(5, Math.max(0, Math.round(r))));
  }
  
  return Math.min(5, Math.max(0, Math.round(rir)));
}

export function validateRIR(rir: number | number[] | null): boolean {
  if (rir === null || rir === undefined) return true;
  
  if (Array.isArray(rir)) {
    return rir.every(r => r >= 0 && r <= 5);
  }
  
  return rir >= 0 && rir <= 5;
}

export function validateDuration(seconds: number | null): boolean {
  if (seconds === null || seconds === undefined) return true;
  return seconds > 0 && seconds <= 14400;
}

export function validateDistance(km: number | null): boolean {
  if (km === null || km === undefined) return true;
  return km > 0 && km <= 500;
}

export function getMissingFields(workout: ParsedWorkout): string[] {
  const fields: string[] = [];
  const type = workout.exercise_type;

  if (!workout.exercise_name) {
    fields.push('exercise_name');
  }

  if (type === 'strength_weighted') {
    if (!workout.weight_kg) fields.push('weight_kg');
  }
  if (type === 'strength_weighted' || type === 'strength_bodyweight') {
    if (!workout.reps) fields.push('reps');
    if (!workout.sets) fields.push('sets');
    if (!workout.rir) fields.push('rir');
  }
  if (type === 'isometric_time' || type === 'cardio_time') {
    if (!workout.duration_seconds) fields.push('duration_seconds');
  }
  if (type === 'cardio_distance' || type === 'cardio_both') {
    if (!workout.distance_km) fields.push('distance_km');
  }
  if (type === 'cardio_both') {
    if (!workout.duration_seconds) fields.push('duration_seconds');
  }

  return fields;
}

export function isWorkoutComplete(workout: ParsedWorkout): boolean {
  return getMissingFields(workout).length === 0;
}

export function formatMissingFieldsMessage(missingFields: string[]): string {
  const fieldLabels: Record<string, string> = {
    exercise_name: 'nombre del ejercicio',
    weight_kg: 'peso (kg)',
    reps: 'repeticiones',
    sets: 'series',
    rir: 'RIR',
    duration_seconds: 'duración',
    distance_km: 'distancia',
  };

  const labels = missingFields.map(field => fieldLabels[field] || field);
  
  if (labels.length === 1) {
    return `Falta: ${labels[0]}`;
  }
  
  if (labels.length === 2) {
    return `Faltan: ${labels[0]} y ${labels[1]}`;
  }
  
  const lastLabel = labels.pop();
  return `Faltan: ${labels.join(', ')} y ${lastLabel}`;
}
