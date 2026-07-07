# Deploy con GitHub Actions (compila afuera, Hostinger solo corre)

**Por qué:** compilar en Hostinger revienta la memoria/procesos (503) y a veces no
reinicia el proceso (landing rota por chunks viejos). Con esto, GitHub compila en
Linux y sube a Hostinger solo el resultado ya armado, y **reinicia** la app. Hostinger
corre 1 proceso, sin `npm install`/`next build` en el servidor.

El workflow ya está en `.github/workflows/deploy.yml`. Configurar una sola vez:

## 1. Desvincular el auto-deploy de Git en Hostinger
En hPanel → tu app Node → **desconectá el repositorio de GitHub** (o desactivá el
auto-deploy). Así Hostinger deja de compilar por su cuenta y no compite con Actions.
El **archivo de arranque** de la app debe ser **`server.js`**.

## 2. SSH (ya lo tenés activo)
IP `212.85.6.189`, puerto `65002`, usuario `u883925531`.

## 3. Llave SSH para el deploy
En tu PC (Git Bash):
```bash
ssh-keygen -t ed25519 -C "github-deploy" -f ~/paycomerce_deploy -N ""
```
- La **pública** (`paycomerce_deploy.pub`) → cargala en hPanel → SSH → Agregar llave.
- La **privada** (`paycomerce_deploy`) → va como secreto en GitHub (paso 5).

## 4. Encontrar APP_PATH
La carpeta raíz de tu app Node en hPanel (ej: `/home/u883925531/domains/paycomerce.com/...`
o donde esté `server.js`). Es **donde se sube el build**.

## 5. Secretos en GitHub
Repo `PayComerce` → Settings → Secrets and variables → Actions → New repository secret:

| Nombre | Valor |
|---|---|
| `SSH_HOST` | `212.85.6.189` |
| `SSH_USER` | `u883925531` |
| `SSH_PORT` | `65002` |
| `SSH_KEY` | todo el contenido del archivo `paycomerce_deploy` (la privada) |
| `APP_PATH` | la ruta del paso 4 |

## 6. Variables de entorno de la app (en hPanel, como ya tenés)
`DATA_DIR`, `UPLOAD_DIR` (fuera de APP_PATH), `AUTH_SECRET`, `OWNER_PASSWORD`,
`RESEND_API_KEY`, `EMAIL_FROM`.

## 7. Listo
Cada push a `main` (o "Run workflow" en la pestaña **Actions**) compila y despliega
solo. Cuando termine en verde, la web ya corre la versión nueva y reiniciada.

> ⚠️ `DATA_DIR`/`UPLOAD_DIR` deben estar FUERA de APP_PATH: el deploy reemplaza APP_PATH.
