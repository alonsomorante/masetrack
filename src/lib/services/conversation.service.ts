import { User, ParsedWorkout, ExerciseType } from '@/types';
import {
  getUserByPhone,
  createUser,
  updateUser,
  getExerciseByName,
  createWorkoutEntry,
  createCustomExercise,
  getCustomExerciseByName,
} from '@/lib/supabase/client';
import { parseWorkoutMessage, parseFollowUpResponse } from '@/lib/services/claude.service';
import { findExerciseByName, getExercisesListText, EXERCISES_DATA, getExercisesByMuscleGroup, ExerciseDataExtended } from '@/lib/data/exercises.catalog';

export class ConversationService {
  private user: User | null = null;

  // Comandos disponibles
  private readonly COMMANDS = {
    HELP: ['hola', 'ayuda', 'help', 'menu', 'comandos', 'info'],
    EXERCISES: ['ejercicios', 'lista', 'catalogo', 'catálogo'],
    WEB: ['web', 'dashboard', 'link', 'enlace', 'url'],
    CANCEL: ['cancelar', 'cancel', 'borrar', 'eliminar', 'borra', 'nuevo', 'otro'],
  };

  // Helper function to format reps for display
  private formatReps(reps: number | number[] | null, sets: number | null): string {
    if (!reps) return '?';
    if (Array.isArray(reps)) {
      if (reps.length === 1) return `${reps[0]}`;
      return reps.map((r, i) => `Set ${i + 1}: ${r}`).join(', ');
    }
    return `${reps}`;
  }

  // Helper function to format RIR for display
  private formatRIR(rir: number | number[] | null): string {
    if (rir === null) return '';
    if (Array.isArray(rir)) {
      if (rir.length === 0) return '';
      if (rir.every(r => r === rir[0])) return ` (RIR: ${rir[0]})`;
      return ` (RIR: ${rir.map((r, i) => `Set ${i + 1}: ${r}`).join(', ')})`;
    }
    return ` (RIR: ${rir})`;
  }

  // Helper function to format duration
  private formatDuration(seconds: number | null | undefined): string {
    if (!seconds) return '';
    if (seconds < 60) return `${seconds} segundos`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutos`;
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours} horas`;
  }

  // Helper function to get reps for a specific set
  private getRepsForSet(reps: number | number[] | null, setIndex: number): number {
    if (!reps) return 0;
    if (Array.isArray(reps)) {
      return reps[setIndex] || reps[reps.length - 1] || 0;
    }
    return reps;
  }

  // Helper function to get weight for a specific set
  private getWeightForSet(weight: number | number[] | null, setIndex: number): number | null {
    if (weight === null) return null;
    if (Array.isArray(weight)) {
      return weight[setIndex] ?? weight[weight.length - 1] ?? null;
    }
    return weight;
  }

  private getTotalSets(workout: ParsedWorkout): number {
    const total = Math.max(
      workout.sets ?? 0,
      Array.isArray(workout.reps) ? workout.reps.length : 0,
      Array.isArray(workout.rir) ? workout.rir.length : 0,
      Array.isArray(workout.weight_kg) ? workout.weight_kg.length : 0
    );

    return total > 0 ? total : 1;
  }

  private buildStrengthSetLines(workout: ParsedWorkout, includeWeight: boolean): string[] {
    const totalSets = this.getTotalSets(workout);
    const lines: string[] = [];

    for (let setIndex = 0; setIndex < totalSets; setIndex += 1) {
      const weight = includeWeight ? this.getWeightForSet(workout.weight_kg ?? null, setIndex) : null;
      const reps = this.getRepsForSet(workout.reps ?? null, setIndex);
      const rir = this.getRIRForSet(workout.rir ?? null, setIndex);
      const repsText = reps > 0 ? `${reps} reps` : '— reps';
      const weightText = includeWeight ? `${weight ?? '—'} kg` : '';
      const baseText = includeWeight ? `${weightText} × ${repsText}` : repsText;

      let line = `• Set ${setIndex + 1}: ${baseText}`;
      if (rir !== null) {
        line += ` (RIR: ${rir})`;
      }
      lines.push(line);
    }

    return lines;
  }

  // Helper function to get RIR for a specific set
  private getRIRForSet(rir: number | number[] | null, setIndex: number): number | null {
    if (rir === null) return null;
    if (Array.isArray(rir)) {
      return rir[setIndex] ?? rir[rir.length - 1] ?? null;
    }
    return rir;
  }

  // Verificar si el mensaje es un comando
  private isCommand(message: string, commandList: string[]): boolean {
    const msg = message.toLowerCase().trim();
    const words = msg.split(/\s+/);
    return commandList.some(cmd => words.includes(cmd));
  }

  // Mensaje de ayuda/bienvenida
  private getHelpMessage(isNewUser: boolean = false): string {
    const userName = this.user?.name ? ` ${this.user.name}` : '';
    
    let message = isNewUser 
      ? `¡Hola${userName}! 👋 Soy tu asistente de entrenamiento.`
      : `¡Hola de nuevo${userName}! 👋`;
    
    message += '\n\n📋 *COMANDOS DISPONIBLES:*\n';
    message += '• "ejercicios" - Ver lista de ejercicios\n';
    message += '• "web" - Obtener link del dashboard\n';
    message += '• "cancelar" - Cancelar registro actual\n';
    message += '• Describe tu entrenamiento directamente\n';
    message += '\n💪 *CÓMO REGISTRAR:*\n';
    message += '\n*Ejercicios de Fuerza:*\n';
    message += '"Ejercicio + Peso + Reps + Series + RIR"\n';
    message += '• "Press de banca 80kg 10 reps 3 series RIR 1"\n';
    message += '• "Dominadas 10 reps 3 series al fallo"\n';
    message += '💡 *RIR = Repeticiones en Reserva (0-5)\n';
    message += '   0 = al fallo, 1 = una más, etc.\n';
    message += '\n*Ejercicios Isométricos:*\n';
    message += '"Ejercicio + Tiempo"\n';
    message += '• "Plancha 60 segundos"\n';
    message += '• "Plancha 2 minutos"\n';
    message += '\n*Cardio:*\n';
    message += '"Ejercicio + Tiempo/Distancia"\n';
    message += '• "Caminadora 30 minutos"\n';
    message += '• "Correr 5 kilómetros"\n';
    message += '\n✨ Si no reconozco un ejercicio, te ayudaré a crearlo.';
    
    return message;
  }

  // Mensaje con link al dashboard web
  private getWebMessage(): string {
    const userName = this.user?.name ? ` ${this.user.name}` : '';
    
    return `¡Hola${userName}! 👋\n\n` +
           `💻 Accede a tu dashboard aquí:\n` +
           `https://workout-wsp-tracker.vercel.app\n\n` +
           `Allí podrás:\n` +
           `• Ver tu historial completo\n` +
           `• Visualizar estadísticas\n` +
           `• Editar o eliminar registros\n\n` +
           `Inicia sesión con tu número de teléfono.`;
  }

  // Mensaje de lista de ejercicios
  private getExercisesMessage(): string {
    const grouped = getExercisesByMuscleGroup();
    let message = '📋 *EJERCICIOS DISPONIBLES*\n\n';
    
    Object.entries(grouped).forEach(([group, exercises]) => {
      message += `*${group.toUpperCase()}:*\n`;
      exercises.forEach(ex => {
        const icon = this.getExerciseTypeIcon(ex.exercise_type);
        message += `  ${icon} ${ex.name}\n`;
      });
      message += '\n';
    });
    
    message += '📖 *Leyenda:*\n';
    message += '🏋️ Fuerza con peso\n';
    message += '💪 Peso corporal\n';
    message += '⏱️ Por tiempo (isométrico/cardio)\n';
    message += '🏃 Cardio por distancia\n\n';
    message += '💡 Escribe el nombre del ejercicio seguido de los detalles.';
    
    return message;
  }

  // Get icon for exercise type
  private getExerciseTypeIcon(type?: string): string {
    switch (type) {
      case 'strength_weighted': return '🏋️';
      case 'strength_bodyweight': return '💪';
      case 'isometric_time': return '⏱️';
      case 'cardio_time':
      case 'cardio_distance':
      case 'cardio_both': return '🏃';
      default: return '•';
    }
  }

  async processMessage(phoneNumber: string, message: string): Promise<string> {
    try {
      console.log(`🔍 Procesando mensaje para ${phoneNumber}: "${message}"`);
      
      this.user = await getUserByPhone(phoneNumber);

      if (!this.user) {
        console.log(`👤 Usuario nuevo: ${phoneNumber}`);
        await createUser(phoneNumber, '');
        return this.getHelpMessage(true);
      }

      const state = this.user.conversation_state;
      const context = this.user.conversation_context || {};

      console.log(`📊 Estado: ${state}, Contexto:`, JSON.stringify(context, null, 2));

      // Verificar comandos primero (excepto si estamos en medio de un flujo)
      if (state === 'registration_complete' || state === 'session_closed') {
        if (this.isCommand(message, this.COMMANDS.HELP)) {
          return this.getHelpMessage();
        }
        
        if (this.isCommand(message, this.COMMANDS.EXERCISES)) {
          return this.getExercisesMessage();
        }
        
        if (this.isCommand(message, this.COMMANDS.WEB)) {
          return this.getWebMessage();
        }
      }

      // Comando cancelar - funciona en cualquier estado de registro de entrenamiento
      if (this.isCommand(message, this.COMMANDS.CANCEL)) {
        return this.handleCancelRegistration();
      }

      switch (state) {
        case 'pending_verification':
          return this.handlePendingVerification();
        case 'new_user':
          return this.handleNewUser(message);
        case 'registration_complete':
        case 'session_closed':
          return this.handleWorkoutInput(message, context);
        case 'waiting_for_weight':
          return this.handleWaitingForWeight(message, context);
        case 'waiting_for_reps_and_sets':
          return this.handleWaitingForRepsAndSets(message, context);
        case 'waiting_for_rir':
          return this.handleWaitingForRir(message, context);
        case 'waiting_for_comment':
          return this.handleWaitingForComment(message, context);
        case 'confirm_save':
          return this.handleConfirmSave(message, context);
        case 'creating_custom_exercise_name':
          return this.handleCreatingCustomExerciseName(message, context);
        case 'creating_custom_exercise_muscle':
          return this.handleCreatingCustomExerciseMuscle(message, context);
        case 'resolving_exercise_type':
          return this.handleResolvingExerciseType(message, context);
        default:
          return this.handleUnknownState();
      }
    } catch (error) {
      console.error(`❌ Error en processMessage para ${phoneNumber}:`, error);
      throw error;
    }
  }

  private async handleNewUser(message: string): Promise<string> {
    if (message.length >= 2) {
      await updateUser(this.user!.phone_number, {
        name: message,
        conversation_state: 'registration_complete',
        conversation_context: {},
      });
      return this.getHelpMessage();
    }
    return '¿Cómo te llamas?';
  }

  private async handleWorkoutInput(message: string, context: Record<string, any>): Promise<string> {
    const parsed = await parseWorkoutMessage(message);

    if (!parsed.exercise_name) {
      return `🤔 No reconocí "${message}" como un ejercicio.\n\n` +
             `💡 *Opciones:*\n` +
             `• Escribe "ejercicios" para ver la lista disponible\n` +
             `• Intenta con un formato como: "Press de banca 80kg 10 reps 3 series"\n` +
             `• Si es un ejercicio nuevo, te ayudaré a registrarlo`;
    }

    // Buscar en ejercicios oficiales
    const officialExercise = findExerciseByName(parsed.exercise_name);
    if (officialExercise) {
      // Verificar si el tipo es ambiguo
      if (parsed.is_ambiguous && officialExercise.allowed_types.length > 1) {
        return this.askForExerciseType(officialExercise, parsed, context);
      }
      return this.processExerciseByType(parsed, officialExercise, context);
    }

    // Buscar en ejercicios personalizados
    const customExercise = await getCustomExerciseByName(this.user!.phone_number, parsed.exercise_name);
    if (customExercise) {
      return this.processExerciseByType(parsed, customExercise as any, context, true);
    }

    // Crear ejercicio personalizado
    const newContext = {
      ...context,
      pending_custom_exercise: { name: parsed.exercise_name, parsed },
    };
    await updateUser(this.user!.phone_number, {
      conversation_state: 'creating_custom_exercise_name',
      conversation_context: newContext,
    });
    return `🤔 No encontré "${parsed.exercise_name}" en el catálogo.\n\n` +
           `¿Quieres crearlo como ejercicio personalizado?\n` +
           `Responde *"sí"* para continuar o *"no"* para cancelar.`;
  }

  private async askForExerciseType(exercise: ExerciseDataExtended, parsed: ParsedWorkout, context: Record<string, any>): Promise<string> {
    const newContext = {
      ...context,
      pending_workout: parsed,
      pending_exercise: exercise,
    };
    
    await updateUser(this.user!.phone_number, {
      conversation_state: 'resolving_exercise_type',
      conversation_context: newContext,
    });

    let message = `🤔 *"${exercise.name}"* puede hacerse de diferentes formas:\n\n`;
    
    exercise.allowed_types.forEach((type, index) => {
      const option = index + 1;
      switch (type) {
        case 'isometric_time':
          message += `${option}. ⏱️ *Por tiempo* (isométrica)\n   Ej: "${exercise.name} 60 segundos"\n\n`;
          break;
        case 'strength_bodyweight':
          message += `${option}. 💪 *Con repeticiones* (dinámica)\n   Ej: "${exercise.name} 15 reps 3 series"\n\n`;
          break;
        case 'cardio_time':
          message += `${option}. ⏱️ *Por tiempo*\n   Ej: "${exercise.name} 30 minutos"\n\n`;
          break;
        case 'cardio_distance':
          message += `${option}. 🏃 *Por distancia*\n   Ej: "${exercise.name} 5 kilómetros"\n\n`;
          break;
      }
    });
    
    message += `Responde con el número de la opción que prefieres (1-${exercise.allowed_types.length})\n`;
    message += `O describe directamente cómo lo hiciste.`;
    
    return message;
  }

  private async handleResolvingExerciseType(message: string, context: Record<string, any>): Promise<string> {
    const exercise = context.pending_exercise as ExerciseDataExtended;
    const parsed = context.pending_workout as ParsedWorkout;
    
    // Check if user selected a number
    const selection = parseInt(message.trim());
    if (!isNaN(selection) && selection >= 1 && selection <= exercise.allowed_types.length) {
      const selectedType = exercise.allowed_types[selection - 1];
      parsed.exercise_type = selectedType;
      parsed.is_ambiguous = false;
      return this.processExerciseByType(parsed, exercise, {});
    }
    
    // User provided a new description
    return this.handleWorkoutInput(message, {});
  }

  private async processExerciseByType(
    parsed: ParsedWorkout, 
    exercise: ExerciseDataExtended | any, 
    context: Record<string, any>,
    isCustom: boolean = false
  ): Promise<string> {
    const exerciseType = parsed.exercise_type || exercise.default_type || 'strength_weighted';
    const exerciseName = exercise.name || parsed.exercise_name;
    
    // Validate based on exercise type
    const validation = this.validateExerciseData(parsed, exerciseType);
    if (!validation.valid) {
      const newContext = {
        ...context,
        pending_workout: {
          ...parsed,
          exercise_name: exerciseName,
          exercise_type: exerciseType,
          is_custom: isCustom,
          custom_exercise_id: isCustom ? exercise.id : null
        },
      };

      // Check if we have some data already
      const hasWeight = parsed.weight_kg !== null && parsed.weight_kg !== undefined;
      const hasReps = parsed.reps !== null && parsed.reps !== undefined;
      const hasSets = parsed.sets !== null && parsed.sets !== undefined;
      const hasRir = parsed.rir !== null && parsed.rir !== undefined;
      
      // Build dynamic message for missing fields
      const missingFields: string[] = [];
      if (!hasReps) missingFields.push('reps');
      if (!hasSets) missingFields.push('series');
      if (!hasRir) missingFields.push('RIR');
      
      const missingText = missingFields.join(', ');
      const exampleParts: string[] = [];
      if (!hasReps) exampleParts.push('10 reps');
      if (!hasSets) exampleParts.push('3 series');
      if (!hasRir) exampleParts.push('RIR 2');
      const exampleText = exampleParts.join(' ');
      
      if (exerciseType === 'strength_weighted') {
        if (!hasWeight) {
          // First ask for weight
          await updateUser(this.user!.phone_number, {
            conversation_state: 'waiting_for_weight',
            conversation_context: newContext,
          });
          return `${validation.message}\n\n¿Cuántos kg usaste?`;
        } else {
          // Have weight, ask for remaining fields
          await updateUser(this.user!.phone_number, {
            conversation_state: 'waiting_for_reps_and_sets',
            conversation_context: newContext,
          });
          
          const displayText = this.formatWorkoutDisplay(parsed, exerciseType, exerciseName, isCustom);
          return `${displayText}\n\n💪 Necesito: ${missingText}\nEjemplo: "${exampleText}"`;
        }
      } else if (exerciseType === 'strength_bodyweight') {
        await updateUser(this.user!.phone_number, {
          conversation_state: 'waiting_for_reps_and_sets',
          conversation_context: newContext,
        });
        
        const displayText = this.formatWorkoutDisplay(parsed, exerciseType, exerciseName, isCustom);
        return `${displayText}\n\n💪 Necesito: ${missingText}\nEjemplo: "${exampleText}"`;
      }
      
      return validation.message;
    }

    const newContext = {
      ...context,
      pending_workout: { 
        ...parsed, 
        exercise_name: exerciseName,
        exercise_type: exerciseType,
        is_custom: isCustom,
        custom_exercise_id: isCustom ? exercise.id : null
      },
    };

    // Format display based on type
    const displayText = this.formatWorkoutDisplay(parsed, exerciseType, exerciseName, isCustom);

    // Ask for RIR only for strength exercises
    if (exerciseType.includes('strength') && parsed.rir === null) {
      await updateUser(this.user!.phone_number, {
        conversation_state: 'waiting_for_rir',
        conversation_context: newContext,
      });
      return `${displayText}\n\n¿RIR (0-5) o "no sé"?`;
    }

    // For other types, go directly to comment
    await updateUser(this.user!.phone_number, {
      conversation_state: 'waiting_for_comment',
      conversation_context: newContext,
    });
    return `${displayText}\n\n¿Comentario? Responde 'no' para saltar.`;
  }

  private validateExerciseData(parsed: ParsedWorkout, exerciseType: string): { valid: boolean; message: string; missingFields: string[] } {
    const hasValidWeight = (weight: number | number[] | null): boolean => {
      if (weight === null) return false;
      if (Array.isArray(weight)) {
        return weight.length > 0 && weight.some(value => value !== null && value > 0);
      }
      return weight > 0;
    };

    const missingFields: string[] = [];

    switch (exerciseType) {
      case 'strength_weighted':
        if (!hasValidWeight(parsed.weight_kg)) {
          missingFields.push('peso');
        }
        if (!parsed.reps) {
          missingFields.push('reps');
        }
        if (!parsed.sets) {
          missingFields.push('series');
        }
        if (parsed.rir === null) {
          missingFields.push('RIR');
        }
        
        if (missingFields.length > 0) {
          const missingText = missingFields.join(', ');
          return {
            valid: false,
            missingFields,
            message: `⚠️ Falta: ${missingText}.\n\nEjemplo: "Press de banca 80kg 10 reps 3 series RIR 2"`
          };
        }
        break;
        
      case 'strength_bodyweight':
        if (!parsed.reps) {
          missingFields.push('reps');
        }
        if (!parsed.sets) {
          missingFields.push('series');
        }
        if (parsed.rir === null) {
          missingFields.push('RIR');
        }
        
        if (missingFields.length > 0) {
          const missingText = missingFields.join(', ');
          return {
            valid: false,
            missingFields,
            message: `⚠️ Falta: ${missingText}.\n\nEjemplo: "Dominadas 10 reps 3 series RIR 2"`
          };
        }
        break;
        
      case 'isometric_time':
      case 'cardio_time':
        if (!parsed.duration_seconds) {
          missingFields.push('duración');
        }
        
        if (missingFields.length > 0) {
          return {
            valid: false,
            missingFields,
            message: `⚠️ Falta la duración.\n\nEjemplo: "Plancha 60 segundos" o "Caminadora 30 minutos"`
          };
        }
        break;
        
      case 'cardio_distance':
        if (!parsed.distance_km) {
          missingFields.push('distancia');
        }
        
        if (missingFields.length > 0) {
          return {
            valid: false,
            missingFields,
            message: `⚠️ Falta la distancia.\n\nEjemplo: "Correr 5 kilómetros"`
          };
        }
        break;
    }
    
    return { valid: true, message: '', missingFields: [] };
  }

  private formatWorkoutDisplay(parsed: ParsedWorkout, exerciseType: string, exerciseName: string, isCustom: boolean): string {
    const customTag = isCustom ? ' (Personalizado)' : '';
    
    switch (exerciseType) {
      case 'strength_weighted':
        const weightedLines = this.buildStrengthSetLines(parsed, true);
        return `🏋️ ${exerciseName}${customTag}\n📊 Resumen por set:\n${weightedLines.join('\n')}`;
        
      case 'strength_bodyweight':
        const bodyweightLines = this.buildStrengthSetLines(parsed, false);
        return `💪 ${exerciseName}${customTag}\n📊 Resumen por set:\n${bodyweightLines.join('\n')}`;
        
      case 'isometric_time':
        const durationText = this.formatDuration(parsed.duration_seconds);
        return `${exerciseName}${customTag}: ${durationText}`;
        
      case 'cardio_time':
        const cardioTimeText = this.formatDuration(parsed.duration_seconds);
        const caloriesText = parsed.calories ? ` (${parsed.calories} cal)` : '';
        return `${exerciseName}${customTag}: ${cardioTimeText}${caloriesText}`;
        
      case 'cardio_distance':
        const distanceText = parsed.distance_km ? `${parsed.distance_km}km` : '';
        return `${exerciseName}${customTag}: ${distanceText}`;
        
      case 'cardio_both':
        const bothTimeText = parsed.duration_seconds ? this.formatDuration(parsed.duration_seconds) : '';
        const bothDistText = parsed.distance_km ? `${parsed.distance_km}km` : '';
        const separator = bothTimeText && bothDistText ? ' + ' : '';
        return `${exerciseName}${customTag}: ${bothTimeText}${separator}${bothDistText}`;
        
      default:
        return `${exerciseName}${customTag}`;
    }
  }

  private async handleWaitingForWeight(message: string, context: Record<string, any>): Promise<string> {
    const workout = context.pending_workout as ParsedWorkout | undefined;

    if (!workout) {
      return 'Hubo un problema. Describe tu entrenamiento de nuevo.';
    }

    const matches = message.match(/\d+(?:[.,]\d+)?/g) || [];
    const weights = matches
      .map(value => parseFloat(value.replace(',', '.')))
      .filter(value => !Number.isNaN(value));

    if (weights.length === 0) {
      return 'Indica el peso en kg, por ejemplo: "80kg" o "80".';
    }

    const weightValue = weights.length > 1 ? weights : weights[0];
    const updatedWorkout: ParsedWorkout = {
      ...workout,
      weight_kg: weightValue,
    };

    const newContext = {
      ...context,
      pending_workout: updatedWorkout,
    };

    const exerciseType = updatedWorkout.exercise_type || 'strength_weighted';
    const exerciseName = updatedWorkout.exercise_name || 'Ejercicio';
    const isCustom = updatedWorkout.is_custom ?? false;
    const displayText = this.formatWorkoutDisplay(updatedWorkout, exerciseType, exerciseName, isCustom);

    // Check which fields are still missing
    const hasReps = updatedWorkout.reps !== null && updatedWorkout.reps !== undefined;
    const hasSets = updatedWorkout.sets !== null && updatedWorkout.sets !== undefined;
    const hasRir = updatedWorkout.rir !== null && updatedWorkout.rir !== undefined;
    
    const missingFields: string[] = [];
    if (!hasReps) missingFields.push('reps');
    if (!hasSets) missingFields.push('series');
    if (!hasRir) missingFields.push('RIR');
    
    const missingText = missingFields.join(', ');
    const exampleParts: string[] = [];
    if (!hasReps) exampleParts.push('10 reps');
    if (!hasSets) exampleParts.push('3 series');
    if (!hasRir) exampleParts.push('RIR 2');
    const exampleText = exampleParts.join(' ');

    // Ask for all remaining data at once
    await updateUser(this.user!.phone_number, {
      conversation_state: 'waiting_for_reps_and_sets',
      conversation_context: newContext,
    });
    
    return `${displayText}\n\n💪 Ahora necesito: ${missingText}\nEjemplo: "${exampleText}"`;
  }

  private async handleWaitingForRepsAndSets(message: string, context: Record<string, any>): Promise<string> {
    const workout = context.pending_workout as ParsedWorkout | undefined;

    if (!workout) {
      return 'Hubo un problema. Describe tu entrenamiento de nuevo.';
    }

    const parseResult = await parseFollowUpResponse(message, workout);

    if (parseResult.clarification_needed === 'explain_rir') {
      return `💡 *RIR = Repeticiones en Reserva*

Es cuántas repeticiones más podrías haber hecho antes de parar:
• 0 = Llegaste al fallo (no podías más)
• 1 = Podías hacer 1 rep más
• 2-5 = Podías hacer esa cantidad de reps más

¿Cuántas reps te faltaban? (0-5) 💪`;
    }

    const updatedWorkout = parseResult.merged;
    const missingFields = parseResult.missing_fields;

    if (!parseResult.is_complete) {
      const missingText = missingFields.join(', ');
      const exampleParts: string[] = [];
      if (missingFields.includes('reps')) exampleParts.push('10 reps');
      if (missingFields.includes('sets')) exampleParts.push('3 series');
      if (missingFields.includes('rir')) exampleParts.push('RIR 2');
      const exampleText = exampleParts.join(' ');

      const newContext = {
        ...context,
        pending_workout: updatedWorkout,
      };

      await updateUser(this.user!.phone_number, {
        conversation_context: newContext,
      });

      return `⚠️ Aún falta: ${missingText}\n\n` +
             `Ejemplo: "${exampleText}"\n` +
             `O escribe todos los datos juntos.`;
    }

    const newContext = {
      ...context,
      pending_workout: updatedWorkout,
    };

    const exerciseType = updatedWorkout.exercise_type || 'strength_weighted';
    const exerciseName = updatedWorkout.exercise_name || 'Ejercicio';
    const isCustom = updatedWorkout.is_custom ?? false;
    const displayText = this.formatWorkoutDisplay(updatedWorkout, exerciseType, exerciseName, isCustom);

    await updateUser(this.user!.phone_number, {
      conversation_state: 'waiting_for_comment',
      conversation_context: newContext,
    });

    return `${displayText}\n\n¿Comentario? Responde 'no' para saltar.`;
  }

  private async handleWaitingForRir(message: string, context: Record<string, any>): Promise<string> {
    const workout = context.pending_workout as ParsedWorkout;

    const parseResult = await parseFollowUpResponse(message, workout);

    if (parseResult.clarification_needed === 'explain_rir') {
      return `💡 *RIR = Repeticiones en Reserva*

Es cuántas repeticiones más podrías haber hecho antes de parar:
• 0 = Llegaste al fallo (no podías más)
• 1 = Podías hacer 1 rep más
• 2-5 = Podías hacer esa cantidad de reps más

¿Cuántas reps te faltaban? (0-5) 💪`;
    }

    const updatedWorkout = parseResult.merged;

    if (parseResult.is_complete) {
      const newContext = {
        ...context,
        pending_workout: updatedWorkout,
      };

      const exerciseType = updatedWorkout.exercise_type || 'strength_weighted';
      const exerciseName = updatedWorkout.exercise_name || 'Ejercicio';
      const isCustom = updatedWorkout.is_custom ?? false;
      const displayText = this.formatWorkoutDisplay(updatedWorkout, exerciseType, exerciseName, isCustom);

      await updateUser(this.user!.phone_number, {
        conversation_state: 'waiting_for_comment',
        conversation_context: newContext,
      });

      return `${displayText}\n\n¿Comentario? Responde 'no' para saltar.`;
    }

    const newContext = {
      ...context,
      pending_workout: updatedWorkout,
    };

    await updateUser(this.user!.phone_number, {
      conversation_context: newContext,
    });

    const msgLower = message.toLowerCase().trim();
    if (/más\s+o\s+menos|aprox|no\s+estoy\s+seguro|quiz[áa]s|tal\s+vez/.test(msgLower)) {
      return `🤔 Entiendo que no estás seguro.

¿Cuántas repeticiones más crees que podrías haber hecho? Dame tu mejor estimación (0-5).

💡 *Tip:* Si llegaste al fallo = 0, si te quedó una rep más = 1.`;
    }

    return `⚠️ Necesito saber el RIR (0-5).

Ejemplos:
• "3" → RIR 3 para todos los sets
• "0, 1, 2" → Set 1: 0, Set 2: 1, Set 3: 2
• "RIR 1 en el primer set RIR 0 en los otros"

💡 Escribe "qué es el RIR" si necesitas ayuda.`;
  }

  private async handleWaitingForComment(message: string, context: Record<string, any>): Promise<string> {
    console.log(`💬 handleWaitingForComment - Mensaje: "${message}"`);
    
    const workout = context.pending_workout as any;
    
    if (!workout) {
      console.error('❌ No hay workout pendiente en el contexto');
      return 'Hubo un problema. Volvamos a empezar. Describe tu entrenamiento.';
    }

    const notes = /^no$/i.test(message) ? null : message;
    
    try {
      await this.saveWorkout(workout, notes);

      await updateUser(this.user!.phone_number, {
        conversation_state: 'confirm_save',
        conversation_context: {},
      });

      const confirmationMessage = this.buildConfirmationMessage(workout, notes);
      return confirmationMessage;
    } catch (error) {
      console.error('❌ Error saving workout:', error);
      return '❌ Error al guardar el entrenamiento. Por favor, intenta de nuevo.';
    }
  }

  private buildConfirmationMessage(workout: ParsedWorkout & { is_custom?: boolean; exercise_name?: string }, notes: string | null): string {
    const customText = workout.is_custom ? ' (Personalizado)' : '';
    const exerciseType = workout.exercise_type || 'strength_weighted';
    
    let message = `✅ *Guardado:* ${workout.exercise_name}${customText}\n`;
    
    switch (exerciseType) {
      case 'strength_weighted':
        const weightedLines = this.buildStrengthSetLines(workout, true);
        message += `\n🏋️ Resumen por set:\n${weightedLines.join('\n')}`;
        break;
        
      case 'strength_bodyweight':
        const bodyweightLines = this.buildStrengthSetLines(workout, false);
        message += `\n💪 Resumen por set:\n${bodyweightLines.join('\n')}`;
        break;
        
      case 'isometric_time':
        message += `⏱️ ${this.formatDuration(workout.duration_seconds)}`;
        break;
        
      case 'cardio_time':
        message += `⏱️ ${this.formatDuration(workout.duration_seconds)}`;
        if (workout.calories) {
          message += `\n🔥 ${workout.calories} calorías`;
        }
        break;
        
      case 'cardio_distance':
        message += `🏃 ${workout.distance_km}km`;
        break;
        
      case 'cardio_both':
        if (workout.duration_seconds) {
          message += `⏱️ ${this.formatDuration(workout.duration_seconds)}`;
        }
        if (workout.distance_km) {
          message += `\n🏃 ${workout.distance_km}km`;
        }
        if (workout.calories) {
          message += `\n🔥 ${workout.calories} calorías`;
        }
        break;
    }
    
    if (notes) {
      message += `\n📝 ${notes}`;
    }
    
    message += '\n\n¿Otro ejercicio?';
    return message;
  }

  private async saveWorkout(workout: any, notes: string | null): Promise<void> {
    console.log(`💾 Guardando workout:`, JSON.stringify(workout, null, 2));
    
    const exerciseType = workout.exercise_type || 'strength_weighted';
    const numberOfSets = workout.sets || this.getTotalSets(workout);
    
    for (let setNumber = 1; setNumber <= numberOfSets; setNumber++) {
      const setIndex = setNumber - 1;
      
      const entryData: any = {
        user_phone: this.user!.phone_number,
        exercise_id: workout.is_custom ? null : await this.getExerciseId(workout.exercise_name || ''),
        custom_exercise_id: workout.is_custom ? workout.custom_exercise_id : null,
        exercise_type: exerciseType,
        notes: setNumber === 1 ? notes : null,
      };
      
      // Add type-specific fields
      switch (exerciseType) {
        case 'strength_weighted':
          entryData.weight_kg = this.getWeightForSet(workout.weight_kg ?? null, setIndex);
          entryData.reps = this.getRepsForSet(workout.reps ?? null, setIndex);
          entryData.sets = 1;
          entryData.rir = this.getRIRForSet(workout.rir ?? null, setIndex);
          break;
          
        case 'strength_bodyweight':
          entryData.weight_kg = null;
          entryData.reps = this.getRepsForSet(workout.reps ?? null, setIndex);
          entryData.sets = 1;
          entryData.rir = this.getRIRForSet(workout.rir ?? null, setIndex);
          break;
          
        case 'isometric_time':
        case 'cardio_time':
          entryData.weight_kg = null;
          entryData.reps = null;
          entryData.sets = null;
          entryData.rir = null;
          entryData.duration_seconds = workout.duration_seconds ?? null;
          entryData.calories = workout.calories ?? null;
          break;
          
        case 'cardio_distance':
          entryData.weight_kg = null;
          entryData.reps = null;
          entryData.sets = null;
          entryData.rir = null;
          entryData.distance_km = workout.distance_km ?? null;
          break;
          
        case 'cardio_both':
          entryData.weight_kg = null;
          entryData.reps = null;
          entryData.sets = null;
          entryData.rir = null;
          entryData.duration_seconds = workout.duration_seconds ?? null;
          entryData.distance_km = workout.distance_km ?? null;
          entryData.calories = workout.calories ?? null;
          break;
      }
      
      console.log(`💾 Set ${setNumber}:`, JSON.stringify(entryData, null, 2));
      await createWorkoutEntry(entryData);
    }
    
    console.log(`✅ Workout guardado exitosamente`);
  }

  private async getExerciseId(exerciseName: string): Promise<number | null> {
    const exercise = await getExerciseByName(exerciseName);
    return exercise?.id || null;
  }

  private async handleConfirmSave(message: string, context: Record<string, any>): Promise<string> {
    if (/^no|termin[eé]|listo$/i.test(message)) {
      await updateUser(this.user!.phone_number, {
        conversation_state: 'session_closed',
        conversation_context: {},
      });
      return '¡Entrenamiento completado! 💪 Escribe cuando quieras registrar.';
    }

    await updateUser(this.user!.phone_number, {
      conversation_state: 'registration_complete',
      conversation_context: {},
    });
    return this.handleWorkoutInput(message, {});
  }

  private async handleCreatingCustomExerciseName(message: string, context: Record<string, any>): Promise<string> {
    if (/^no$/i.test(message)) {
      await updateUser(this.user!.phone_number, {
        conversation_state: 'registration_complete',
        conversation_context: {},
      });
      return '✅ Cancelado. Puedes usar un ejercicio del catálogo o intentar con otro nombre.\n\nEscribe "ejercicios" para ver la lista disponible.';
    }

    if (!/^s[ií]|yes|ok$/i.test(message)) {
      return 'Responde "sí" para crear el ejercicio o "no" para cancelar.';
    }

    const customExercise = context.pending_custom_exercise;
    await updateUser(this.user!.phone_number, {
      conversation_state: 'creating_custom_exercise_muscle',
      conversation_context: context,
    });

    return `✨ Perfecto. Vamos a crear "${customExercise.name}".\n\n` +
           `¿Qué grupo muscular trabaja?\n\n` +
           `Opciones: pecho, espalda, piernas, hombros, biceps, triceps, core, cardio, otros`;
  }

  private async handleCreatingCustomExerciseMuscle(message: string, context: Record<string, any>): Promise<string> {
    const muscleGroups = ['pecho', 'espalda', 'piernas', 'hombros', 'biceps', 'triceps', 'core', 'cardio', 'otros'];
    const muscleGroup = message.toLowerCase().trim();

    if (!muscleGroups.includes(muscleGroup)) {
      return `❌ Grupo muscular no válido.\n\nElige uno de estos:\n${muscleGroups.join(', ')}`;
    }

    const customExerciseData = context.pending_custom_exercise;
    
    try {
      const newExercise = await createCustomExercise({
        user_phone: this.user!.phone_number,
        name: customExerciseData.name,
        muscle_group: muscleGroup,
      });

      await updateUser(this.user!.phone_number, {
        conversation_state: 'registration_complete',
        conversation_context: {},
      });

      return this.processExerciseByType(customExerciseData.parsed, newExercise, {}, true);
    } catch (error) {
      console.error('Error creating custom exercise:', error);
      await updateUser(this.user!.phone_number, {
        conversation_state: 'registration_complete',
        conversation_context: {},
      });
      return '❌ Hubo un error al crear el ejercicio. Intenta de nuevo.';
    }
  }

  private async handleUnknownState(): Promise<string> {
    await updateUser(this.user!.phone_number, {
      conversation_state: 'registration_complete',
      conversation_context: {},
    });
    return 'Hubo un problema. Volvamos a empezar. Describe tu entrenamiento.';
  }

  private async handlePendingVerification(): Promise<string> {
    return '⚠️ *Verificación requerida*\n\n' +
           'Necesitas verificar tu cuenta antes de usar WhatsApp.\n\n' +
           '1. Accede a: https://workout-wsp-tracker.vercel.app\n' +
           '2. Ingresa el código de verificación que recibiste por SMS\n' +
           '3. Una vez verificado, podrás usar el bot de WhatsApp\n\n' +
           '¿No recibiste el SMS? Verifica tu número en la web.';
  }

  private async handleCancelRegistration(): Promise<string> {
    await updateUser(this.user!.phone_number, {
      conversation_state: 'registration_complete',
      conversation_context: {},
    });
    return '❌ Registro cancelado.\n\n' +
           'Puedes empezar de nuevo con otro ejercicio.\n' +
           'Escribe el nombre del ejercicio seguido de los datos.';
  }
}
