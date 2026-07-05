# Deploy de PayComerce en Hostinger Business (app Node.js)

Tu plan Business incluye **5 apps web de Node.js**. PayComerce usa **1** de esas.
Estos son los pasos. Los marcados con 🖥️ se hacen por **SSH/Terminal** de Hostinger
(hPanel → Avanzado → Acceso SSH). Si algo se traba, avisame y lo vemos juntos.

## 1. Crear la app Node.js en hPanel
- hPanel → **Sitios web** → tu dominio → **Node.js** (o "Aplicaciones Node.js").
- **Node version:** 20 o 22.
- **Application root:** una carpeta, ej. `paycomerce` (queda en `~/domains/tudominio/paycomerce` o similar).
- **Application startup file:** `.next/standalone/server.js`
- **Dominio/subdominio:** elegí dónde se ve (ej. `app.tudominio.com`).

## 2. Subir el código
Opción A (recomendada) — **Git**: subí el proyecto a un repo (GitHub) y cloná en la carpeta.
Opción B — **File Manager / SFTP**: subí TODO el proyecto MENOS `node_modules`, `.next` y `data`.

## 3. Instalar y compilar 🖥️ (por SSH, dentro de la carpeta de la app)
```bash
cd ~/domains/tudominio/paycomerce      # ajustá la ruta real
npm install                            # baja better-sqlite3 para Linux (importante)
npm run build                          # genera .next/standalone
# Next standalone necesita que copies los estáticos y public adentro:
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public
```

## 4. Variables de entorno (hPanel → la app → Environment variables)
```
NODE_ENV = production
PORT = (lo asigna Hostinger; si te deja fijarlo, poné el que indique)
HOSTNAME = 0.0.0.0
DATA_DIR = /home/USUARIO/paycomerce-data      # carpeta PERSISTENTE fuera del build
UPLOAD_DIR = /home/USUARIO/paycomerce-uploads # imágenes subidas (persistente)
AUTH_SECRET = una-frase-larga-y-secreta-aca   # firma las sesiones del panel (¡cambiala!)
```
> ⚠️ `DATA_DIR` y `UPLOAD_DIR` van **fuera** de la carpeta del código para que un
> redeploy no borre la base de datos ni las imágenes. Creá esas carpetas una vez:
> `mkdir -p ~/paycomerce-data ~/paycomerce-uploads`
>
> Nota: como `UPLOAD_DIR` queda fuera de `public`, más adelante conviene servir las
> imágenes con una ruta propia; para el primer deploy podés dejar `UPLOAD_DIR` sin
> definir (usa `public/uploads`) y hacer backup manual.

## 5. Arrancar / Reiniciar
- En hPanel, botón **Restart** de la app Node.js.
- Startup file: `.next/standalone/server.js`.

## 6. Cargar credenciales reales (desde el panel /admin → Configuración y Mi plan)
- **Mercado Pago:** Access Token de producción (o TEST para probar).
- **ARCA/AFIP:** token de AfipSDK + CUIT + punto de venta + certificado.
- Con dominio público (https), MP y el webhook ya funcionan de verdad.

## Checklist rápido
- [ ] App Node.js creada (Node 20/22, startup `.next/standalone/server.js`)
- [ ] `npm install` + `npm run build` corridos EN el servidor (Linux)
- [ ] `.next/static` y `public` copiados dentro de `.next/standalone`
- [ ] `DATA_DIR` / `UPLOAD_DIR` a carpetas persistentes
- [ ] App reiniciada y abriendo en tu dominio

## Importante para escalar (multi-tienda)
Hoy la app es de **una sola tienda**. Para servir **muchos comercios** desde esta
misma app Node (sin gastar los otros 4 slots), hay que hacerla **multi-tienda**
(cada comercio con su subdominio y sus datos). Es el siguiente paso de arquitectura.
