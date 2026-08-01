# Cozy Pomodoro

Temporizador Pomodoro (Focus / Short Break / Long Break) con una lista de
tareas. Cada persona crea su cuenta y sus tareas quedan guardadas de forma
permanente, asociadas a esa cuenta.

Deploy en vivo: https://metodo-pomodoro-4ohr.vercel.app

¿No conocés la técnica Pomodoro? Ver [GUIA_POMODORO.md](GUIA_POMODORO.md).

## Funcionalidad

- Temporizador con tres modos (25 / 5 / 15 minutos) y alarma sonora al
  terminar.
- Lista de tareas: agregar, marcar como completada y borrar.
- Registro e inicio de sesión por email y contraseña.
- Las tareas persisten en una base de datos y son privadas de cada cuenta
  (nadie más puede verlas ni modificarlas).
- La sesión se mantiene 30 días en el navegador; pasado ese tiempo solo pide
  volver a iniciar sesión — no borra ningún dato.

## Stack

- Frontend: HTML, CSS y JavaScript sin frameworks ni build step.
- Backend: funciones serverless de Vercel (Node.js) bajo `/api`, sin
  Next.js — cada archivo es un endpoint.
- Base de datos: Postgres en [Neon](https://neon.tech), vía
  `@neondatabase/serverless`.
- Autenticación: contraseñas hasheadas con `bcryptjs`; sesión en una cookie
  `httpOnly` firmada con HMAC-SHA256 (sin dependencias externas de JWT).

## Estructura del proyecto

```
index.html          Página única (login/registro + app)
style.css            Estilos
script.js             Lógica del timer, auth y tareas (fetch a /api)
manifest.json      Configuración de PWA
sw.js                    Service worker mínimo (requerido para instalar la PWA)

api/
  auth/
    signup.js        POST — crear cuenta
    login.js          POST — iniciar sesión
    logout.js       POST — cerrar sesión
    me.js               GET  — usuario de la sesión actual
  tasks/
    index.js          GET (listar) / POST (crear)
    [id].js            PATCH (marcar completada) / DELETE (borrar)

lib/
  db.js                  Conexión a Postgres + creación de tablas
  session.js         Firma y verificación de la cookie de sesión
```

## Base de datos

Se crean automáticamente dos tablas (`CREATE TABLE IF NOT EXISTS`) la
primera vez que se llama a cualquier endpoint, no hace falta correr ninguna
migración a mano:

- `users (id, email, password_hash, created_at)`
- `tasks (id, user_id, text, completed, created_at)` — `user_id` referencia
  a `users` con `ON DELETE CASCADE`.

## Variables de entorno

Configurar en el proyecto de Vercel (Settings → Environment Variables),
en Production y Preview:

| Variable | De dónde sale |
|---|---|
| `DATABASE_URL` o `POSTGRES_URL` | Las crea automáticamente la integración de Neon al conectar la base de datos desde la pestaña **Storage** del proyecto en Vercel. |
| `SESSION_SECRET` | Se genera a mano (una cadena aleatoria larga) y se carga manualmente. Firma las cookies de sesión — si se cambia, todas las sesiones activas quedan invalidadas. |

## Deploy

El proyecto está conectado al repositorio de GitHub
[`recursos-docentes/metodo_pomodoro`](https://github.com/recursos-docentes/metodo_pomodoro),
rama `main`. Cualquier cambio subido a `main` (por ejemplo con
**Add file → Upload files** en GitHub) dispara un deploy automático en
Vercel.

No hay paso de build: Vercel instala las dependencias de `package.json` y
sirve los archivos estáticos junto con las funciones de `/api` tal cual
están.

## Seguridad — qué cubre y qué no

Cubre: contraseñas hasheadas (nunca en texto plano), consultas SQL
parametrizadas (sin inyección), cookies de sesión `httpOnly` + `Secure` +
`SameSite=Lax`, y separación estricta de datos entre cuentas.

No incluye (aceptable para un uso personal, a tener en cuenta si el
proyecto crece): límite de intentos de login, verificación de email al
registrarse, ni recuperación de contraseña olvidada.
