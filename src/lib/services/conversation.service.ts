import { User, ParsedWorkout, ExerciseType } from '@/types';
import {
  getUserByPhone,
  createUser,
  updateUser,
  getExerciseByName,
  createWorkoutEntry,
  createCustomExercise,
  getCustomExerciseByName,
  getUserCustomExercises,
} from '@/lib/supabase/client';
import { parseWorkoutMessage, parseFollowUpResponse, detectUserIntent } from '@/lib/services/claude.service';
import { findExerciseByName, getExercisesListText, EXERCISES_DATA, getExercisesByMuscleGroup, ExerciseDataExtended } from '@/lib/data/exercises.catalog';

export class ConversationService {
  private user: User | null = null;

  // Comandos disponibles (palabras exactas)
  private readonly COMMANDS = {
    HELP: ['hola', 'ayuda', 'help', 'menu', 'comandos', 'info'],
    EXERCISES: ['ejercicios', 'lista', 'catalogo', 'catálogo'],
    WEB: ['web', 'dashboard', 'link', 'enlace', 'url'],
    CANCEL: ['cancelar', 'cancel', 'borrar', 'eliminar', 'borra', 'parar', 'detener'],
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
      ? `¡Bienvenido a Masetrack${userName}! 👋\n\nTu sistema de entrenamiento, a tu manera.`
      : `¡Hola de nuevo${userName}! 👋`;
    
    message += '\n\n📝 *CÓMO REGISTRAR:*\n';
    message += '\n*Fuerza:*\n';
    message += '"Nombre + Peso + Reps + Series + RIR"\n';
    message += '• "Press banca 80kg 10 reps 3 series RIR 2"\n';
    message += '• "Sentadilla barra 100kg 8 reps 4 series"\n';
    message += '• "Curl biceps 20kg 12 reps 3 series RIR 1"\n';
    message += '\n*RIR (Repeticiones en Reserva):*\n';
    message += '• 0 = Al fallo\n';
    message += '• 1 = Una rep más\n';
    message += '• 2-5 = Esa cantidad más\n';
    message += '\n*Por tiempo:*\n';
    message += '"Nombre + Tiempo"\n';
    message += '• "Plancha 60 segundos"\n';
    message += '• "Abdominales 2 minutos"\n';
    message += '\n*Cardio:*\n';
    message += '"Nombre + Tiempo/Distancia"\n';
    message += '• "Caminadora 30 minutos"\n';
    message += '• "Correr 5 kilómetros"\n';
    message += '\n💡 *SIN LÍMITES:*\n';
    message += '• Nombra tus ejercicios como prefieras\n';
    message += '• "Pull-down agarre neutral", "Press banca inclinado", etc.\n';
    message += '• Todo se guarda automáticamente\n';
    message += '\n📋 *COMANDOS:*\n';
    message += '• "ejercicios" - Ver tus ejercicios guardados\n';
    message += '• "web" - Link del dashboard\n';
    message += '• "cancelar" - Cancelar registro actual';
    
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

  // Mensaje de lista de ejercicios personalizados del usuario
  private async getExercisesMessage(): Promise<string> {
    const userExercises = await getUserCustomExercises(this.user!.phone_number);
    
    let message = '📋 *TUS EJERCICIOS GUARDADOS*\n\n';
    
    if (!userExercises || userExercises.length === 0) {
      message += 'No tienes ejercicios guardados aún.\n\n';
      message += '💡 *Cómo funciona:*\n';
      message += '• Escribe el nombre de tu ejercicio + datos\n';
      message += '• Ej: "Press banca 80kg 10 reps 3 series"\n';
      message += '• Se guardará automáticamente\n';
      message += '\n💡 Nombra tus ejercicios como prefieras:\n';
      message += '• "Press banca inclinado"\n';
      message += '• "Pull-down agarre neutral"\n';
      message += '• "Sentadilla profundidad"\n';
      return message;
    }
    
    // Agrupar por grupo muscular
    const grouped = userExercises.reduce((acc, ex) => {
      const group = ex.muscle_group || 'otros';
      if (!acc[group]) acc[group] = [];
      acc[group].push(ex.name);
      return acc;
    }, {} as Record<string, string[]>);
    
    Object.entries(grouped).forEach(([group, exercises]) => {
      message += `*${group.toUpperCase()}:*\n`;
      exercises.forEach(name => {
        message += `  • ${name}\n`;
      });
      message += '\n';
    });
    
    message += '💡 Para registrar usa el nombre exacto seguido de los datos.\n';
    message += 'Ej: "Press banca 80kg 10 reps 3 series"';
    
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

      // Detectar intención del usuario con Claude (solo cuando no hay un workout pendiente activo)
      const hasPendingWorkout = !!context.pending_workout?.exercise_name;
      let userIntent = { intent: 'unknown', confidence: 0 } as { intent: string; confidence: number };
      
      // Solo usar detección inteligente si no estamos en medio de recopilar datos específicos
      if (!['waiting_for_weight', 'waiting_for_reps_and_sets', 'waiting_for_rir', 'waiting_for_comment'].includes(state)) {
        userIntent = await detectUserIntent(message, state, hasPendingWorkout);
        console.log(`🎯 Intención detectada: ${userIntent.intent} (confianza: ${userIntent.confidence})`);
      }

      // Detectar intención de nuevo registro/reinicio - funciona en CUALQUIER estado
      // Esto debe ir primero para interceptar antes de procesar como datos del ejercicio actual
      const newRegistrationPatterns = [
        /nuevo\s+(registro|ejercicio|entrenamiento)/i,
        /iniciar\s+(nuevo|otro)/i,
        /empezar\s+(nuevo|otro|de\s+nuevo)/i,
        /quiero\s+(hacer|registrar)\s+(otro|nuevo)/i,
        /^nuevo$/i,
        /^otro$/i,
        /^reiniciar$/i,
      ];

      const wantsNewRegistration = newRegistrationPatterns.some(pattern => pattern.test(message));
      
      if (wantsNewRegistration && context.pending_workout) {
        console.log('🆕 Usuario quiere iniciar nuevo registro, limpiando datos anteriores');
        // Limpiar TODO el contexto y estado para empezar completamente fresco
        await updateUser(this.user!.phone_number, {
          conversation_state: 'registration_complete',
          conversation_context: {},
        });
        // Informar al usuario y esperar nuevo ejercicio
        return '✅ Entendido. Vamos a registrar un nuevo ejercicio.\n\n' +
               'Escribe el nombre del ejercicio seguido de los datos.\n' +
               'Ejemplo: "Press de banca 80kg 10 reps 3 series"';
      }

      // Procesar según intención detectada o comandos simples
      if (state === 'registration_complete' || state === 'session_closed') {
        // Priorizar intención detectada por Claude sobre comandos simples
        if (userIntent.intent === 'help' || this.isCommand(message, this.COMMANDS.HELP)) {
          return this.getHelpMessage();
        }
        
        if (userIntent.intent === 'exercises_list' || this.isCommand(message, this.COMMANDS.EXERCISES)) {
          return await this.getExercisesMessage();
        }
        
        if (userIntent.intent === 'web_dashboard' || this.isCommand(message, this.COMMANDS.WEB)) {
          return this.getWebMessage();
        }

        // Si quiere crear un workout, dejar que handleWorkoutInput lo procese
        if (userIntent.intent === 'create_workout') {
          console.log('📝 Usuario quiere crear un nuevo ejercicio');
          // Continuar al handleWorkoutInput normal
        }
      }

      // Comando cancelar - funciona en cualquier estado de registro de entrenamiento
      // Verificar tanto intención detectada como comandos simples
      if (userIntent.intent === 'cancel' || this.isCommand(message, this.COMMANDS.CANCEL)) {
        return this.handleCancelRegistration(context);
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
        case 'confirm_cancel':
          return this.handleConfirmCancel(message, context);
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
          return this.handleUnknownState(context);
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
      return `🤔 No entendí "${message}".\n\n` +
             `💡 *Formato:*\n` +
             `"Nombre del ejercicio + datos"\n` +
             `Ej: "Press banca 80kg 10 reps 3 series RIR 2"\n` +
             `Ej: "Sentadilla 100kg 8 reps 4 series"\n\n` +
             `💡 Nombra tus ejercicios como prefieras, sin límites.`;
    }

    // Buscar solo en ejercicios personalizados del usuario (no en catálogo)
    const customExercise = await getCustomExerciseByName(this.user!.phone_number, parsed.exercise_name);

    if (customExercise) {
      // El ejercicio ya existe para este usuario
      return this.processExerciseByType(parsed, customExercise as any, context, true);
    }

    // El ejercicio NO existe - crear automáticamente como personalizado sin preguntar
    console.log(`🆕 Creando ejercicio automáticamente: ${parsed.exercise_name}`);

    // Crear ejercicio personalizado automáticamente
    const newExercise = await createCustomExercise({
      user_phone: this.user!.phone_number,
      name: parsed.exercise_name,
      muscle_group: 'otros', // Por defecto, usuario puede editar después
    });

    if (!newExercise) {
      return `❌ Error al crear el ejercicio "${parsed.exercise_name}".\n\n` +
             `Intenta de nuevo o usa otro nombre.`;
    }

    // Procesar el ejercicio recién creado
    return this.processExerciseByType(parsed, newExercise, context, true);
  }

  private async askForExerciseType(exercise: ExerciseDataExtended, parsed: ParsedWorkout, context: Record<string, any>): Promise<string> {
    // Crear contexto LIMPIO para resolver el tipo de ejercicio
    const newContext = {
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
    
    // Check if user provided any weight in their message - if so, force strength_weighted
    const userProvidedWeight = parsed.weight_kg !== null && parsed.weight_kg !== undefined;
    
    // If user provided weight, force strength_weighted type
    const finalExerciseType = userProvidedWeight ? 'strength_weighted' : exerciseType;
    
    // Validate based on exercise type
    const validation = this.validateExerciseData(parsed, finalExerciseType);
    
    // If validation fails OR no weight provided, ask for ALL missing data at once
    if (!validation.valid || !userProvidedWeight) {
      // Create clean context
      const newContext = {
        pending_workout: {
          ...parsed,
          exercise_name: exerciseName,
          exercise_type: finalExerciseType,
          is_custom: isCustom,
          custom_exercise_id: isCustom ? exercise.id : null
        },
      };

      // Determine what's actually missing
      const missingFields = [...validation.missingFields];
      
      // Always add weight as missing if not provided
      if (!userProvidedWeight) {
        if (!missingFields.includes('peso')) {
          missingFields.push('peso');
        }
      }

      // If no missing fields but no weight, still ask
      if (missingFields.length === 0 && !userProvidedWeight) {
        missingFields.push('peso');
      }

      // Only proceed if we have weight OR we know it's bodyweight
      if (userProvidedWeight && missingFields.length === 0 && validation.valid) {
        // Continue to save - all required data present
      } else {
        // Build the message with missing fields
        const displayText = this.formatWorkoutDisplay(
          { ...parsed, exercise_name: exerciseName, exercise_type: finalExerciseType },
          finalExerciseType, 
          exerciseName, 
          isCustom
        );

        // Build examples for missing fields
        const exampleParts: string[] = [];
        if (missingFields.includes('peso')) exampleParts.push('80kg');
        if (missingFields.includes('reps')) exampleParts.push('10 reps');
        if (missingFields.includes('series')) exampleParts.push('3 series');
        if (missingFields.includes('RIR')) exampleParts.push('RIR 2');
        if (missingFields.includes('duración')) exampleParts.push('60 segundos');
        if (missingFields.includes('distancia')) exampleParts.push('5 km');
        
        const exampleText = exampleParts.join(' ');

        // Ask for ALL missing fields at once
        const missingText = missingFields.join(', ');
        
        await updateUser(this.user!.phone_number, {
          conversation_state: 'waiting_for_reps_and_sets',
          conversation_context: newContext,
        });

        // Special message if only weight is missing
        if (missingFields.length === 1 && missingFields[0] === 'peso') {
          return `${displayText}\n\n⚠️ Falta: peso (kg)\n\nEjemplo: "80kg"\nO escribe "sin peso" si es con tu peso corporal`;
        }

        return `${displayText}\n\n⚠️ Falta: ${missingText}\n\nEjemplo: "${exampleText}"\nO escribe todos los datos juntos.`;
      }
    }

    // Validation passed and has weight - save the workout
    const newContext = {
      pending_workout: { 
        ...parsed, 
        exercise_name: exerciseName,
        exercise_type: finalExerciseType,
        is_custom: isCustom,
        custom_exercise_id: isCustom ? exercise.id : null
      },
    };

    // Format display based on type
    const displayText = this.formatWorkoutDisplay(
      { ...parsed, exercise_name: exerciseName, exercise_type: finalExerciseType },
      finalExerciseType, 
      exerciseName, 
      isCustom
    );

    // Ask for RIR only for strength exercises if not provided
    if (finalExerciseType.includes('strength') && parsed.rir === null) {
      await updateUser(this.user!.phone_number, {
        conversation_state: 'waiting_for_rir',
        conversation_context: newContext,
      });
      return `${displayText}\n\n¿RIR (0-5)?`;
    }

    // Save directly without asking for comment
    const workoutToSave = newContext.pending_workout;
    await this.saveWorkout(workoutToSave, null);
    await updateUser(this.user!.phone_number, {
      conversation_state: 'confirm_save',
      conversation_context: {},
    });
    return this.buildConfirmationMessage(workoutToSave, null);
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
      exercise_type: 'strength_weighted', // Switch to weighted since user provided weight
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

    const msgLower = message.toLowerCase().trim();

    // Check if user says "sin peso" or similar - convert to bodyweight
    const noWeightPatterns = [
      'sin peso', 'sin kg', 'mi peso', 'mi propio peso', 
      'peso corporal', 'solo reps', 'sin carga', 'sin mancuernas',
      'solo', 'sin'
    ];
    
    let convertToBodyweight = false;
    for (const pattern of noWeightPatterns) {
      if (msgLower.includes(pattern) && !msgLower.includes('con') && !msgLower.includes('kg')) {
        convertToBodyweight = true;
        break;
      }
    }

    // Also check if the exercise type is bodyweight and no weight was provided
    const isBodyweightExercise = workout.exercise_type === 'strength_bodyweight';

    const parseResult = await parseFollowUpResponse(message, workout);

    let updatedWorkout = parseResult.merged;

    // Check if user provided weight in this response
    const userProvidedWeight = parseResult.extracted.weight_kg !== null && parseResult.extracted.weight_kg !== undefined;
    
    // If user provided weight, switch to weighted type and keep the weight
    if (userProvidedWeight) {
      updatedWorkout = {
        ...updatedWorkout,
        exercise_type: 'strength_weighted',
        // weight_kg already set from parseResult.merged
      };
    } else if (convertToBodyweight) {
      // Only convert to bodyweight if user explicitly says "sin peso" AND didn't provide weight
      updatedWorkout = {
        ...updatedWorkout,
        exercise_type: 'strength_bodyweight',
        weight_kg: null
      };
    } else if (isBodyweightExercise) {
      // If original was bodyweight but user didn't say "sin peso" and didn't provide weight,
      // keep as bodyweight (no weight_kg)
      updatedWorkout = {
        ...updatedWorkout,
        exercise_type: 'strength_bodyweight',
        weight_kg: null
      };
    }

    // Save extracted data ALWAYS
    const newContext = {
      ...context,
      pending_workout: updatedWorkout,
    };

    await updateUser(this.user!.phone_number, {
      conversation_context: newContext,
    });

    // Get missing fields from the updated workout
    const exerciseType = updatedWorkout.exercise_type || 'strength_weighted';
    const validation = this.validateExerciseData(updatedWorkout, exerciseType);
    const missingFields = validation.missingFields;

    // If only RIR is missing, change state to waiting_for_rir
    if (missingFields.length === 1 && missingFields[0] === 'rir') {
      await updateUser(this.user!.phone_number, {
        conversation_state: 'waiting_for_rir',
        conversation_context: newContext,
      });

      if (parseResult.clarification_needed === 'explain_rir') {
        return `💡 *RIR = Repeticiones en Reserva*

Es cuántas repeticiones más podrías haber hecho antes de parar:
• 0 = Llegaste al fallo (no podías más)
• 1 = Podías hacer 1 rep más
• 2-5 = Podías hacer esa cantidad de reps más

¿Cuántas reps te faltaban? (0-5) 💪`;
      }

      return `💪 ¡Perfecto! Ya tengo: ${updatedWorkout.reps} reps, ${updatedWorkout.sets} series

Ahora necesito el RIR (0-5):
• 0 = Al fallo
• 1 = Una rep más
• 2-5 = Esa cantidad más

Ejemplo: "RIR 2" o "0"`;
    }

    // If multiple fields are missing, keep asking
    if (!validation.valid || missingFields.length > 0) {
      const missingText = missingFields.join(', ');
      
      const displayText = this.formatWorkoutDisplay(
        { ...updatedWorkout, exercise_name: updatedWorkout.exercise_name || 'Ejercicio' },
        exerciseType,
        updatedWorkout.exercise_name || 'Ejercicio',
        updatedWorkout.is_custom ?? false
      );

      // Build examples for missing fields
      const exampleParts: string[] = [];
      if (missingFields.includes('peso')) exampleParts.push('80kg');
      if (missingFields.includes('reps')) exampleParts.push('10 reps');
      if (missingFields.includes('series')) exampleParts.push('3 series');
      if (missingFields.includes('RIR')) exampleParts.push('RIR 2');
      if (missingFields.includes('duración')) exampleParts.push('60 segundos');
      if (missingFields.includes('distancia')) exampleParts.push('5 km');
      const exampleText = exampleParts.join(' ');

      return `${displayText}\n\n⚠️ Falta: ${missingText}\n\nEjemplo: "${exampleText}"\nO escribe todos los datos juntos.`;
    }

    // All data complete - save
    const exerciseName = updatedWorkout.exercise_name || 'Ejercicio';
    const isCustom = updatedWorkout.is_custom ?? false;

    // Save directly without asking for comment
    await this.saveWorkout(updatedWorkout, null);
    await updateUser(this.user!.phone_number, {
      conversation_state: 'confirm_save',
      conversation_context: {},
    });

    const displayText = this.formatWorkoutDisplay(
      { ...updatedWorkout, exercise_name: exerciseName },
      exerciseType,
      exerciseName,
      isCustom
    );

    return this.buildConfirmationMessage(
      { ...updatedWorkout, exercise_name: exerciseName },
      null
    );
  }

  private async handleWaitingForRir(message: string, context: Record<string, any>): Promise<string> {
    const workout = context.pending_workout as ParsedWorkout;

    // Primero intentar parsear manualmente números simples (0-5) como RIR
    const simpleRirMatch = message.trim().match(/^(\d)$/);
    let updatedWorkout = workout;
    let rirDetected = false;

    if (simpleRirMatch) {
      const rirValue = parseInt(simpleRirMatch[1]);
      if (rirValue >= 0 && rirValue <= 5) {
        updatedWorkout = {
          ...workout,
          rir: rirValue,
        };
        rirDetected = true;
      }
    }

    // Si no detectamos número simple, usar Claude
    if (!rirDetected) {
      const parseResult = await parseFollowUpResponse(message, workout);
      updatedWorkout = parseResult.merged;

      if (parseResult.clarification_needed === 'explain_rir') {
        return `💡 *RIR = Repeticiones en Reserva*

Es cuántas repeticiones más podrías haber hecho antes de parar:
• 0 = Llegaste al fallo (no podías más)
• 1 = Podías hacer 1 rep más
• 2-5 = Podías hacer esa cantidad de reps más

¿Cuántas reps te faltaban? (0-5) 💪`;
      }

      // Verificar si Claude detectó RIR
      if (parseResult.is_complete || updatedWorkout.rir !== null) {
        const exerciseType = updatedWorkout.exercise_type || 'strength_weighted';
        const exerciseName = updatedWorkout.exercise_name || 'Ejercicio';
        const isCustom = updatedWorkout.is_custom ?? false;
        const displayText = this.formatWorkoutDisplay(updatedWorkout, exerciseType, exerciseName, isCustom);

        const newContext = {
          ...context,
          pending_workout: updatedWorkout,
        };

        await updateUser(this.user!.phone_number, {
          conversation_state: 'waiting_for_comment',
          conversation_context: newContext,
        });

        return `${displayText}\n\n¿Comentario? Responde 'no' para saltar.`;
      }
    }

    // Si detectamos RIR válido
    if (rirDetected) {
      const exerciseType = updatedWorkout.exercise_type || 'strength_weighted';
      const exerciseName = updatedWorkout.exercise_name || 'Ejercicio';
      const isCustom = updatedWorkout.is_custom ?? false;
      const displayText = this.formatWorkoutDisplay(updatedWorkout, exerciseType, exerciseName, isCustom);

      const newContext = {
        ...context,
        pending_workout: updatedWorkout,
      };

      await updateUser(this.user!.phone_number, {
        conversation_state: 'waiting_for_comment',
        conversation_context: newContext,
      });

      return `${displayText}\n\n¿Comentario? Responde 'no' para saltar.`;
    }

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

    const msgLower = message.toLowerCase().trim();

    // Detectar intención de editar datos
    const editPatterns = [
      { pattern: /cambiar|editar|modificar|corregir.*peso/i, field: 'weight', message: '¿Cuántos kg quieres usar?' },
      { pattern: /cambiar|editar|modificar|corregir.*rep/i, field: 'reps', message: '¿Cuántas repeticiones?' },
      { pattern: /cambiar|editar|modificar|corregir.*seri|set/i, field: 'sets', message: '¿Cuántas series?' },
      { pattern: /cambiar|editar|modificar|corregir.*rir/i, field: 'rir', message: '¿Qué RIR? (0-5)' },
    ];

    for (const editPattern of editPatterns) {
      if (editPattern.pattern.test(msgLower)) {
        const newContext = {
          ...context,
          previous_state: 'waiting_for_comment',
          editing_field: editPattern.field,
        };

        let nextState: import('@/types').ConversationState;
        switch (editPattern.field) {
          case 'weight':
            nextState = 'waiting_for_weight';
            break;
          case 'rir':
            nextState = 'waiting_for_rir';
            break;
          case 'reps':
          case 'sets':
          default:
            nextState = 'waiting_for_reps_and_sets';
        }

        await updateUser(this.user!.phone_number, {
          conversation_state: nextState,
          conversation_context: newContext,
        });

        return `✏️ ${editPattern.message}\n\n` +
               `Dime el nuevo valor y actualizaré los datos.`;
      }
    }

    // Guardar directamente sin pedir comentario
    const notes = null;

    try {
      // Validar datos antes de guardar
      const validation = this.validateWorkoutData(workout);

      if (!validation.valid) {
        console.log('⚠️ Datos inválidos detectados:', validation.errors);

        // Intentar recuperación inteligente
        const recovery = await this.attemptSmartRecovery(workout, context);

        if (recovery.success && recovery.newState) {
          await updateUser(this.user!.phone_number, {
            conversation_state: recovery.newState as import('@/types').ConversationState,
          });
          return recovery.message;
        }

        // No se pudo recuperar automáticamente, pedir corrección
        const errorsText = validation.errors.join('\n• ');
        return `⚠️ Encontré problemas en los datos:\n• ${errorsText}\n\n` +
               `¿Quieres corregirlos? Escribe:\n` +
               `• "cambiar peso", "cambiar reps", "cambiar series" o "cambiar rir"\n` +
               `• O escribe "cancelar" para descartar y empezar de nuevo`;
      }

      await this.saveWorkout(workout, notes);

      await updateUser(this.user!.phone_number, {
        conversation_state: 'confirm_save',
        conversation_context: {},
      });

      const confirmationMessage = this.buildConfirmationMessage(workout, notes);
      return confirmationMessage;
    } catch (error) {
      console.error('❌ Error saving workout:', error);

      // Diferenciar tipos de errores
      if (error instanceof Error) {
        if (error.message.includes('network') || error.message.includes('timeout')) {
          return '⚠️ Error de conexión con la base de datos.\n\n' +
                 'Reintentando automáticamente...\n' +
                 'Si persiste, espera unos segundos e intenta de nuevo.';
        }
        if (error.message.includes('constraint') || error.message.includes('duplicate')) {
          return '⚠️ Error: Datos duplicados o restricción violada.\n\n' +
                 'Parece que este ejercicio ya fue registrado.\n' +
                 'Escribe "nuevo" para registrar otro ejercicio.';
        }
      }

      return '❌ Error al guardar el entrenamiento.\n\n' +
             'Detalles técnicos: ' + (error instanceof Error ? error.message : 'Error desconocido') + '\n' +
             'Por favor, intenta de nuevo o escribe "ayuda" para soporte.';
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

  private async handleUnknownState(context: Record<string, any> = {}): Promise<string> {
    console.error('⚠️ Estado desconocido detectado. Intentando recuperación...');

    // Si hay datos pendientes, intentar recuperar
    if (context.pending_workout?.exercise_name) {
      const workout = context.pending_workout;
      console.log('🔄 Recuperando workout:', workout.exercise_name);

      // Determinar qué datos faltan y volver al estado apropiado
      let recoveryState: import('@/types').ConversationState = 'registration_complete';
      let recoveryMessage = '';

      if (!workout.weight_kg && workout.exercise_type === 'strength_weighted') {
        recoveryState = 'waiting_for_weight';
        recoveryMessage = `⚠️ Detecté un problema técnico, pero puedo continuar con: ${workout.exercise_name}\n\n¿Cuántos kg usaste?`;
      } else if (!workout.reps || !workout.sets) {
        recoveryState = 'waiting_for_reps_and_sets';
        recoveryMessage = `⚠️ Detecté un problema técnico, pero puedo continuar con: ${workout.exercise_name}\n\nFaltan reps o series. ¿Cuántas hiciste?`;
      } else if (!workout.rir) {
        recoveryState = 'waiting_for_rir';
        recoveryMessage = `⚠️ Detecté un problema técnico, pero puedo continuar con: ${workout.exercise_name}\n\nSolo falta el RIR (0-5). ¿Cuál fue?`;
      } else {
        recoveryState = 'waiting_for_comment';
        recoveryMessage = `⚠️ Detecté un problema técnico, pero tengo todos los datos de: ${workout.exercise_name}\n\n¿Comentario antes de guardar?`;
      }

      await updateUser(this.user!.phone_number, {
        conversation_state: recoveryState,
        conversation_context: context,
      });

      return recoveryMessage;
    }

    // No hay datos para recuperar, reiniciar limpio
    await updateUser(this.user!.phone_number, {
      conversation_state: 'registration_complete',
      conversation_context: {},
    });

    return '⚠️ Hubo un problema técnico.\n\n' +
           'No se encontraron datos para recuperar.\n' +
           'Volvamos a empezar. Describe tu entrenamiento.';
  }

  private async handlePendingVerification(): Promise<string> {
    return '⚠️ *Verificación requerida*\n\n' +
           'Necesitas verificar tu cuenta antes de usar WhatsApp.\n\n' +
           '1. Accede a: https://workout-wsp-tracker.vercel.app\n' +
           '2. Ingresa el código de verificación que recibiste por SMS\n' +
           '3. Una vez verificado, podrás usar el bot de WhatsApp\n\n' +
           '¿No recibiste el SMS? Verifica tu número en la web.';
  }

  private async handleCancelRegistration(context: Record<string, any> = {}): Promise<string> {
    // Si hay un workout pendiente, pedir confirmación
    if (context.pending_workout?.exercise_name) {
      await updateUser(this.user!.phone_number, {
        conversation_state: 'confirm_cancel',
        conversation_context: context, // Mantener datos por si acaso
      });
      return '⚠️ ¿Estás seguro de cancelar?\n\n' +
             `Se perderán los datos de: ${context.pending_workout.exercise_name}\n\n` +
             'Responde "sí" para confirmar el cancelamiento\n' +
             'Responde "no" para continuar con el registro';
    }

    // No hay datos pendientes, cancelar directamente
    await updateUser(this.user!.phone_number, {
      conversation_state: 'registration_complete',
      conversation_context: {},
    });
    return '❌ Registro cancelado.\n\n' +
           'Puedes empezar de nuevo con otro ejercicio.\n' +
           'Escribe el nombre del ejercicio seguido de los datos.';
  }

  private async handleConfirmCancel(message: string, context: Record<string, any>): Promise<string> {
    const msgLower = message.toLowerCase().trim();

    if (msgLower === 'sí' || msgLower === 'si' || msgLower === 's' || msgLower === 'yes') {
      // Confirmado: cancelar y limpiar
      await updateUser(this.user!.phone_number, {
        conversation_state: 'registration_complete',
        conversation_context: {},
      });
      return '❌ Registro cancelado.\n\n' +
             'Puedes empezar de nuevo con otro ejercicio.';
    }

    // No confirmado: volver al estado anterior
    const previousState = context.previous_state || 'registration_complete';
    await updateUser(this.user!.phone_number, {
      conversation_state: previousState,
      conversation_context: context,
    });

    return '✅ Continuamos con el registro.\n\n' +
           'Describe los datos que faltan o escribe "ayuda" si necesitas orientación.';
  }

  // Función de validación robusta con recuperación inteligente
  private validateWorkoutData(workout: ParsedWorkout): { valid: boolean; errors: string[]; suggestedFix?: string } {
    const errors: string[] = [];

    if (!workout.exercise_name) {
      errors.push('Falta el nombre del ejercicio');
    }

    // Validar por tipo de ejercicio
    switch (workout.exercise_type) {
      case 'strength_weighted':
        if (!workout.weight_kg || (Array.isArray(workout.weight_kg) && workout.weight_kg.some(w => w <= 0))) {
          errors.push('Peso inválido (debe ser mayor a 0)');
        }
        if (typeof workout.weight_kg === 'number' && workout.weight_kg > 500) {
          errors.push('Peso muy alto (máximo 500kg)');
        }
        // falls through

      case 'strength_bodyweight':
        if (!workout.reps || (Array.isArray(workout.reps) && workout.reps.some(r => r <= 0))) {
          errors.push('Repeticiones inválidas (debe ser mayor a 0)');
        }
        if (typeof workout.reps === 'number' && workout.reps > 100) {
          errors.push('Repeticiones muy altas (máximo 100)');
        }

        if (!workout.sets || workout.sets <= 0) {
          errors.push('Series inválidas (debe ser mayor a 0)');
        }
        if (workout.sets && workout.sets > 20) {
          errors.push('Demasiadas series (máximo 20)');
        }

        // Validar RIR
        if (workout.rir !== null && workout.rir !== undefined) {
          const rirValues = Array.isArray(workout.rir) ? workout.rir : [workout.rir];
          if (rirValues.some(r => r < 0 || r > 5)) {
            errors.push('RIR debe estar entre 0 y 5');
          }
        }

        // Validar que arrays tengan longitud consistente
        const sets = workout.sets || 1;
        if (Array.isArray(workout.weight_kg) && workout.weight_kg.length > sets) {
          errors.push(`Más pesos (${workout.weight_kg.length}) que series (${sets})`);
        }
        if (Array.isArray(workout.reps) && workout.reps.length > sets) {
          errors.push(`Más repeticiones (${workout.reps.length}) que series (${sets})`);
        }
        if (Array.isArray(workout.rir) && workout.rir.length > sets) {
          errors.push(`Más valores RIR (${workout.rir.length}) que series (${sets})`);
        }
        break;

      case 'isometric_time':
      case 'cardio_time':
        if (!workout.duration_seconds || workout.duration_seconds <= 0) {
          errors.push('Duración inválida (debe ser mayor a 0 segundos)');
        }
        if (workout.duration_seconds && workout.duration_seconds > 86400) {
          errors.push('Duración muy larga (máximo 24 horas)');
        }
        break;

      case 'cardio_distance':
        if (!workout.distance_km || workout.distance_km <= 0) {
          errors.push('Distancia inválida (debe ser mayor a 0)');
        }
        if (workout.distance_km && workout.distance_km > 1000) {
          errors.push('Distancia muy larga (máximo 1000km)');
        }
        break;

      case 'cardio_both':
        if (!workout.duration_seconds || workout.duration_seconds <= 0) {
          errors.push('Duración inválida (debe ser mayor a 0 segundos)');
        }
        if (!workout.distance_km || workout.distance_km <= 0) {
          errors.push('Distancia inválida (debe ser mayor a 0)');
        }
        break;
    }

    // Generar sugerencia de corrección
    let suggestedFix: string | undefined;
    if (errors.length > 0) {
      suggestedFix = 'Revisa los siguientes datos: ' + errors.join(', ');
    }

    return {
      valid: errors.length === 0,
      errors,
      suggestedFix
    };
  }

  // Función para intentar corregir datos automáticamente
  private async attemptSmartRecovery(workout: ParsedWorkout, context: Record<string, any>): Promise<{ success: boolean; message: string; newState?: string }> {
    console.log('🧠 Intentando recuperación inteligente...');

    // Caso 1: RIR fuera de rango
    if (workout.rir !== null && workout.rir !== undefined) {
      const rirValues = Array.isArray(workout.rir) ? workout.rir : [workout.rir];
      const invalidRir = rirValues.findIndex(r => r < 0 || r > 5);

      if (invalidRir !== -1) {
        // Corregir a valor dentro de rango
        const correctedRir = rirValues.map(r => Math.max(0, Math.min(5, r)));
        const newWorkout = {
          ...workout,
          rir: Array.isArray(workout.rir) ? correctedRir : correctedRir[0]
        };

        await updateUser(this.user!.phone_number, {
          conversation_context: { ...context, pending_workout: newWorkout }
        });

        return {
          success: true,
          message: `✅ Corregí automáticamente el RIR (debe ser 0-5). Continuamos...`,
          newState: 'waiting_for_comment'
        };
      }
    }

    // Caso 2: Arrays más largos que sets - truncar
    if (workout.sets) {
      let modified = false;
      const newWorkout = { ...workout };

      if (Array.isArray(workout.weight_kg) && workout.weight_kg.length > workout.sets) {
        newWorkout.weight_kg = workout.weight_kg.slice(0, workout.sets);
        modified = true;
      }
      if (Array.isArray(workout.reps) && workout.reps.length > workout.sets) {
        newWorkout.reps = workout.reps.slice(0, workout.sets);
        modified = true;
      }
      if (Array.isArray(workout.rir) && workout.rir.length > workout.sets) {
        newWorkout.rir = workout.rir.slice(0, workout.sets);
        modified = true;
      }

      if (modified) {
        await updateUser(this.user!.phone_number, {
          conversation_context: { ...context, pending_workout: newWorkout }
        });

        return {
          success: true,
          message: `✅ Corregí automáticamente los datos (eliminé valores extra). Continuamos...`,
          newState: 'waiting_for_comment'
        };
      }
    }

    return {
      success: false,
      message: 'No pude corregir automáticamente los datos. Por favor revisa la información.'
    };
  }
}
