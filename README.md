# Mis Finanzas

Aplicación web estática para distribuir tus ingresos en distintos **bolsillos** según **bloques** de porcentaje configurables. Pensada para usar desde el móvil, sin backend y alojable en GitHub Pages.

## Funcionalidades

- **Calcular**: ingresa un monto en COP (ej: `1.500.000` o `1.500.000,50`) y te muestra cuánto va a cada bolsillo, con el detalle por bloque y cuánto queda "sin asignar".
- **Bolsillos**: crea, edita y elimina los destinos finales del dinero.
- **Bloques**: asigna a cada bloque un nombre, un porcentaje del ingreso y un bolsillo destino. La barra de progreso te avisa el porcentaje libre; no deja asignar más del 100% (la suma parcial es válida).
- **Persistencia local**: todo se guarda en `localStorage` del navegador. Directo y sin cuentas.
- **Respaldo**: exporta/importa tu configuración como archivo JSON, y comparte la configuración completa mediante un enlace con datos codificados en la URL (ideal para pasarla a otro dispositivo).
- **PWA ligera**: instalable en la pantalla de inicio del móvil (`manifest.json` + iconos).

## Cómo correrlo localmente

Como usa módulos ES, hay que servirlo vía HTTP (no funciona abriendo el archivo directo `file://`). Desde la raíz del proyecto:

```bash
npx serve .
# o bien
python3 -m http.server 8080
```

Luego abre `http://localhost:8080`.

## Cómo publicarlo en GitHub Pages

1. Sube este repositorio a GitHub:
   ```bash
   git init
   git add .
   git commit -m "App de finanzas personales"
   git branch -M main
   git remote add origin https://github.com/TU-USUARIO/personal_finance.git
   git push -u origin main
   ```
2. En GitHub: **Settings → Pages → Source = Deploy from a branch** y elige la rama **main** + carpeta raíz ( `/ (root)` ). Guarda.
3. Tras unos segundos quedará disponible en `https://TU-USUARIO.github.io/personal_finance/`.

> Los enlaces usan rutas relativas, así que no es necesaria configuración extra por el subdirectorio del repositorio.

## Nota sobre los datos

La configuración vive en el navegador en el que se usa. Para migrar a otro dispositivo usa **Exportar/Importar** o el botón **Compartir enlace**. Si borras los datos de navegación del sitio, se pierde (por eso está el respaldo). En iOS, Safari puede purgar el almacenamiento si la app no se usa durante varios días seguidos.
