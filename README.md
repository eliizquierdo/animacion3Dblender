# Plan Animación 3D con Blender

Aplicación web para seguir un plan de 20 sesiones de aprendizaje de animación 3D con Blender. Incluye temporizador Pomodoro integrado, notas por sesión y seguimiento de progreso — todo guardado en la nube, accesible desde cualquier dispositivo.

Deploy en vivo: https://animacion3-dblender.vercel.app

## Funcionalidad

- Plan de 20 sesiones organizado en 4 semanas, con objetivos y recursos por sesión.
- Temporizador Pomodoro integrado (25 min foco / 5 min descanso corto / 15 min descanso largo) con alarma sonora.
- Notas por sesión: qué hice, qué me bloqueó, qué sigue — se guardan automáticamente al escribir.
- Contador de pomodoros por sesión.
- Marcar sesiones como completadas; el panel lateral muestra el progreso con íconos de check.
- Recursos de cada semana en acordeón colapsable.
- Registro e inicio de sesión por email y contraseña.
- Todo el progreso persiste en base de datos y es privado de cada cuenta.
- La sesión se mantiene 30 días en el navegador.

## Stack

- Frontend: HTML, CSS y JavaScript sin frameworks ni build step.
- Backend: funciones serverless de Vercel (Node.js) bajo `/api`.
- Base de datos: Postgres en [Neon](https://neon.tech), vía `@neondatabase/serverless`.
- Autenticación: contraseñas hasheadas con `bcryptjs`; sesión en una cookie `httpOnly` firmada con HMAC-SHA256.

## Estructura del proyecto

```
index.html          Pantalla de login / registro (estilo oscuro, redirige a plan.html)
plan.html           App principal: plan de sesiones + timer Pomodoro
manifest.json       Configuración de PWA
sw.js               Service worker mínimo

api/
  auth/
    signup.js       POST — crear cuenta
    login.js        POST — iniciar sesión
    logout.js       POST — cerrar sesión
    me.js           GET  — usuario de la sesión actual
  plan/
    index.js        GET — cargar todo el progreso del plan
    [id].js         PATCH — guardar progreso de una sesión

lib/
  db.js             Conexión a Postgres + creación de tablas al primer uso
  session.js        Firma y verificación de la cookie de sesión
```

## Base de datos

**Dónde está:** proyecto Neon en [console.neon.tech](https://console.neon.tech), base de datos `neondb` (dentro del proyecto que antes se llamaba `java_journey` / renombrar a gusto desde Settings del proyecto — es solo una etiqueta visual, no afecta la conexión).

Las tablas se crean automáticamente la primera vez que se llama a cualquier endpoint (`CREATE TABLE IF NOT EXISTS`), sin necesidad de correr migraciones a mano:

- `users (id, email, password_hash, created_at)` — una fila por cuenta registrada.
- `tasks (id, user_id, text, completed, priority, created_at)` — heredado del Pomodoro original, no se usa activamente en esta versión.
- `plan_sessions (id, user_id, session_id, completed, notes_done, notes_block, notes_next, pomodoros, updated_at)` — una fila por sesión del plan por usuario. Se guarda con UPSERT (`ON CONFLICT ... DO UPDATE`), así que guardar dos veces la misma sesión actualiza en vez de duplicar.

## Variables de entorno

Configurar en el proyecto de Vercel (Settings → Environment Variables), en Production y Preview:

| Variable | De dónde sale |
|---|---|
| `DATABASE_URL` o `POSTGRES_URL` | Panel de Neon → proyecto → Connection string de la base `neondb`. También aparece en Vercel si la integración de Neon está conectada. |
| `SESSION_SECRET` | Cadena aleatoria larga generada a mano. Firma las cookies de sesión — si se cambia, todas las sesiones activas quedan invalidadas. |

## Deploy

El proyecto está conectado al repositorio de GitHub
[`eliizquierdo/animacion3Dblender`](https://github.com/eliizquierdo/animacion3Dblender),
rama `main`. Cualquier cambio subido a `main` dispara un deploy automático en Vercel.

No hay paso de build: Vercel instala las dependencias de `package.json` y sirve los archivos estáticos junto con las funciones de `/api`.

## Seguridad — qué cubre y qué no

Cubre: contraseñas hasheadas (nunca en texto plano), consultas SQL parametrizadas (sin inyección SQL), cookies `httpOnly` + `Secure` + `SameSite=Lax`, y separación estricta de datos entre cuentas.

No incluye (aceptable para uso personal): límite de intentos de login, verificación de email al registrarse, ni recuperación de contraseña olvidada.
