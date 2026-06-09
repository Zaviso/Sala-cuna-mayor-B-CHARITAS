# Instrucciones para Deployar Cloud Functions

Este proyecto ahora usa **Cloud Functions de Firebase** para manejar las subidas de fotos de forma segura.

## ¿Qué necesitas hacer?

### 1. Instalar Firebase CLI (UNA SOLA VEZ)

Abre PowerShell y corre:

```powershell
npm install -g firebase-tools
```

### 2. Iniciar sesión en Firebase (UNA SOLA VEZ)

```powershell
firebase login
```

Se abrirá el navegador. Inicia sesión con tu cuenta de Google que tiene acceso a Firebase.

### 3. Deployar las Cloud Functions

Navega a la carpeta del proyecto y corre:

```powershell
cd "c:\Users\silva\OneDrive\Escritorio\web-centro-padres-jardin-CHARITAS"
firebase deploy --only functions
```

**Eso es todo.** Espera a que termine (toma 2-3 minutos).

## ¿Qué hace esto?

✅ Crea una Cloud Function en los servidores de Google
✅ Las fotos se suben a Firebase Storage (seguro)
✅ Funciona sin problemas de CORS
✅ Está protegido automáticamente

## Si algo sale mal

Si hay error, revisar:
1. ¿Iniciaste sesión con `firebase login`?
2. ¿Estás en la carpeta correcta?
3. Revisar que `firebase.json` exista

## Después de deployar

No necesitas hacer nada más. La app funcionará automáticamente con las Cloud Functions.
