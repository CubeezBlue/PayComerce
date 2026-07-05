# Deploy de PayComerce en Hostinger Business (app Node.js)

Tu plan Business incluye **5 apps web de Node.js**. PayComerce usa **1**.
Los pasos con 🖥️ se hacen por **SSH/Terminal** de Hostinger (hPanel → Avanzado → SSH).
Si algo se traba, avisame y lo vemos juntos.

## 0. Subir el código a GitHub (una vez)
Ya está todo commiteado en Git. Creá un repo en GitHub y subilo 🖥️ (desde tu compu):
```bash
git remote add origin https://github.com/TU_USUARIO/paycomerce.git
git branch -M main
git push -u origin main
```

## 1. Crear la app Node.js en hPanel
- hPanel → **Sitios web** → tu dominio → **Node.js** (o "Aplicaciones Node.js").
- **Node version:** 20 o 22.
- **Application root:** `paycomerce` (queda en `~/domains/tudominio/paycomerce`).
- **Application startup file:** `.next/standalone/server.js`
- Elegí el dominio/subdominio donde se ve.

## 2. Traer el código al servidor 🖥️
```bash
cd ~/domains/tudominio/paycomerce
git clone https://github.com/TU_USUARIO/paycomerce.git .
```

## 3. Instalar y compilar 🖥️
```bash
npm install          # baja better-sqlite3 para Linux (¡clave, no subir node_modules!)
npm run build        # compila y copia estáticos al standalone (automático)
mkdir -p ~/paycomerce-data ~/paycomerce-uploads
```

## 4. Variables de entorno (hPanel → la app → Environment variables)
```
NODE_ENV = production
HOSTNAME = 0.0.0.0
DATA_DIR = /home/USUARIO/paycomerce-data
UPLOAD_DIR = /home/USUARIO/paycomerce-uploads
AUTH_SECRET = una-frase-larga-y-secreta   # ¡cambiala!
```
> `DATA_DIR` y `UPLOAD_DIR` van **fuera** del código para que un redeploy no borre
> las bases ni las imágenes.

## 5. Arrancar
- Startup file: `.next/standalone/server.js` → **Restart** en hPanel.
- Debería abrir en tu dominio con la tienda demo.

## 6. Actualizar en el futuro 🖥️
```bash
cd ~/domains/tudominio/paycomerce
git pull && npm install && npm run build
# y Restart en hPanel
```

## 7. Cargar credenciales reales (desde /admin → Configuración)
- Mercado Pago: Access Token de producción.
- ARCA: token de AfipSDK + CUIT + certificado. Con dominio https, MP y el webhook andan de verdad.

---

## ⚠️ Multi-tienda por subdominio (importante)
La app identifica cada comercio por el **subdominio** (`negocio.tudominio.com`).
Para que funcione con muchos comercios necesitás un **subdominio comodín**
(`*.tudominio.com`) apuntando a esta app. Según el plan, en Hostinger esto puede:
- **Soportarse** con un registro DNS wildcard + agregar `*.tudominio.com` a la app → ideal.
- **No soportarse** en shared → ahí cada comercio se agrega a mano, o se usa un VPS.

**Para el primer deploy** no hace falta: la app abre en tu dominio y sirve la tienda
demo. Cuando quieras habilitar los subdominios reales, lo configuramos (o evaluamos
un VPS si Hostinger no da wildcard).

## Checklist
- [ ] Repo en GitHub y `git push`
- [ ] App Node.js creada (Node 20/22, startup `.next/standalone/server.js`)
- [ ] `npm install` + `npm run build` en el servidor (Linux)
- [ ] Variables de entorno cargadas (incl. AUTH_SECRET)
- [ ] Carpetas `paycomerce-data` / `paycomerce-uploads` creadas
- [ ] App reiniciada y abriendo en tu dominio
