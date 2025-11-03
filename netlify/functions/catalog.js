// Al principio de tu archivo catalog.js
const path = require('path');
const fs = require('fs');


// Rutas a los archivos CSV dentro de la carpeta segura 'data'
const RUTA_CLIENTES = path.join(__dirname, 'data', 'clientes.csv');
const RUTA_PRODUCTOS = path.join(__dirname, 'data', 'productos.csv');

// --- Función para leer y parsear CSV (Adaptada para Node.js) ---
function parseCSV(text) {
    const lines = text.trim().split('\n');
    if (lines.length < 1) return [];

    // FIX: La expresión regular compleja previamente utilizada para dividir las líneas CSV 
    // es una fuente común de errores internos (500) en el entorno de ejecución de Node.js de Netlify.
    // La reemplazamos por una división simple por coma, asumiendo que el formato de datos es limpio.
    
    // Procesa los encabezados
    const rawHeaders = lines[0].split(','); 
    const headers = rawHeaders.map(h => h.trim().replace(/"/g, '').toUpperCase());
    const expectedLength = headers.length; // Almacena la longitud esperada para robustez

    const data = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line === '') continue; // Salta líneas vacías

        const rawValues = line.split(','); // DIVISIÓN SIMPLIFICADA

        if (rawValues.length === expectedLength) {
            const entry = {};
            for (let j = 0; j < expectedLength; j++) {
                // Recorta y elimina cualquier comilla circundante
                let val = rawValues[j].trim().replace(/^"|"$/g, '');
                entry[headers[j]] = val;
            }
            data.push(entry);
        }
    }
    return data;
}


// Lógica principal de la función
exports.handler = async (event, context) => {
    // 1. Solo aceptamos peticiones POST para enviar datos
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Método no permitido' };
    }

    try {
        const body = JSON.parse(event.body);
        const inputPhoneNumber = (body.phone || '').trim().replace(/[\s\-\+\(\)]/g, '');

        // 2. Cargar y parsear datos del servidor
        const clientsCSV = fs.readFileSync(RUTA_CLIENTES, 'utf8');
        const productsCSV = fs.readFileSync(RUTA_PRODUCTOS, 'utf8');
        
        const allClients = parseCSV(clientsCSV);
        const allProducts = parseCSV(productsCSV);

        // 3. Autenticar el cliente
        const client = allClients.find(c => {
            let clientPhone = (c.TELEFONO || '').trim().replace(/[\s\-\+\(\)]/g, '');
            // Buscamos coincidencia exacta o terminación (como en tu lógica original)
            return clientPhone === inputPhoneNumber || (inputPhoneNumber.length > 5 && clientPhone.endsWith(inputPhoneNumber));
        });

        if (!client) {
            // Cliente no encontrado - Acceso denegado
            return {
                statusCode: 401,
                body: JSON.stringify({ error: 'Número no reconocido. Contacte a su vendedor.' })
            };
        }

        // 4. Si la autenticación es exitosa, devolvemos los datos
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                client: client,
                products: allProducts
            })
        };

    } catch (error) {
        console.error('Error en la función:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Error interno del servidor.' })
        };
    }
};