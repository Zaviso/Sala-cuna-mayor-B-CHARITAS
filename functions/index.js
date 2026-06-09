const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

admin.initializeApp();

const storage = admin.storage();

// Cloud Function para subir fotos a la galería
exports.uploadGalleryPhoto = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        try {
            // Solo permitir POST
            if (req.method !== 'POST') {
                return res.status(400).send('Solo se permiten solicitudes POST');
            }

            // Obtener datos del request
            const { originalName, base64Data } = req.body;

            if (!originalName || !base64Data) {
                return res.status(400).send('Faltan datos requeridos (originalName, base64Data)');
            }

            // Convertir base64 a buffer
            let buffer;
            if (base64Data.includes(',')) {
                // Formato: data:image/jpeg;base64,xxxxx
                buffer = Buffer.from(base64Data.split(',')[1], 'base64');
            } else {
                // Solo el base64
                buffer = Buffer.from(base64Data, 'base64');
            }

            const timestamp = Date.now();
            const fileName = `${timestamp}_${originalName}`;
            const filePath = `gallery/${fileName}`;

            // Subir a Firebase Storage
            const file = storage.bucket().file(filePath);
            await file.save(buffer, {
                metadata: {
                    contentType: 'image/jpeg',
                    metadata: {
                        uploadedAt: new Date().toISOString(),
                        originalName: originalName
                    }
                }
            });

            // Obtener URL pública (sin expiración)
            await file.makePublic();
            const publicUrl = `https://storage.googleapis.com/jardin-charitas.firebasestorage.app/${filePath}`;

            console.log(`✓ Foto subida: ${originalName}`);

            // Responder con éxito
            res.status(200).json({
                success: true,
                url: publicUrl,
                fileName: fileName,
                originalName: originalName
            });

        } catch (error) {
            console.error('Error al subir foto:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });
});
