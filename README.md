# Masetrack

Aplicación de tracking de entrenamientos vía WhatsApp y web

## Descripción

Masetrack es una aplicación full-stack que permite a los usuarios registrar y hacer seguimiento de sus entrenamientos de gimnasio de forma sencilla, tanto mediante WhatsApp como a través de una interfaz web moderna.

### Características principales

- 🤖 **Integración con WhatsApp**: Registra entrenamientos enviando mensajes de texto natural
- 💻 **Dashboard Web**: Visualiza tu progreso, historial y estadísticas
- 🏋️ **Múltiples tipos de ejercicios**: Fuerza con peso, peso corporal, isométricos, cardio
- 📊 **Estadísticas detalladas**: Volumen total, progreso por ejercicio, historial completo
- 🔔 **Verificación segura**: Códigos de verificación vía WhatsApp
- 🌍 **Multi-país**: Soporte para múltiples países de América

## Tecnologías

- **Frontend**: Next.js 16, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Serverless Functions
- **Base de datos**: Supabase (PostgreSQL)
- **Mensajería**: Twilio WhatsApp API / WhatsApp Cloud API
- **IA**: Anthropic Claude (para parseo de mensajes)
- **Despliegue**: Vercel

## Requisitos previos

- Node.js 18+
- Cuenta de Supabase
- Cuenta de Twilio (o configuración de WhatsApp Cloud API)
- Cuenta de Anthropic (Claude API)

## Instalación

1. Clonar el repositorio:
```bash
git clone https://github.com/TU_USUARIO/Masetrack.git
cd Masetrack
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
Crear archivo `.env.local` con:
```env
# Supabase
SUPABASE_URL=tu_supabase_url
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# Twilio (si usas Twilio)
TWILIO_ACCOUNT_SID=tu_account_sid
TWILIO_AUTH_TOKEN=tu_auth_token
TWILIO_PHONE_NUMBER=tu_numero_twilio

# Anthropic
ANTHROPIC_API_KEY=tu_api_key

# App
NEXT_PUBLIC_APP_URL=https://tu-app.vercel.app
```

4. Configurar base de datos:
Ejecutar los scripts SQL en Supabase:
- `scripts/setup.sql`
- `scripts/database-update.sql`
- `scripts/migration_add_exercise_types.sql`

5. Iniciar servidor de desarrollo:
```bash
npm run dev
```

## Estructura del proyecto

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── dashboard/         # Dashboard pages
│   ├── login/             # Login page
│   ├── verify/            # Verification page
│   └── page.tsx           # Home/Register page
├── components/            # React components
├── lib/                   # Utilities y servicios
│   ├── auth/             # Authentication
│   ├── data/             # Data access
│   ├── services/         # External services
│   └── supabase/         # Supabase client
├── types/                 # TypeScript types
└── scripts/              # Database scripts
```

## Uso

### Vía WhatsApp
1. Envía un mensaje al número configurado
2. Escribe tu entrenamiento en lenguaje natural:
   - "Press de banca 80kg 10 reps 3 series"
   - "Dominadas 10 reps 3 sets"
   - "Plancha 60 segundos"
3. El bot te pedirá RIR (Repeticiones en Reserva)
4. Confirma y se guarda automáticamente

### Vía Web
1. Regístrate con tu número de teléfono
2. Recibe código de verificación por WhatsApp
3. Ingresa el código y accede al dashboard
4. Visualiza tu historial y estadísticas

## Contribuir

1. Fork el repositorio
2. Crea una rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT - ver archivo [LICENSE](LICENSE)

## Contacto

Para soporte o preguntas, contactar a través de WhatsApp o abrir un issue en GitHub.

---

**Nota**: Este proyecto está en desarrollo activo. Algunas funcionalidades pueden cambiar.
