// Estas son las herramientas que necesitamos
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Esta es la función "portero"
exports.handler = async (event, context) => {
  
  // 1. CHEQUEO DE LOGIN: Verificamos si el que llama está logueado.
  const { user } = context.clientContext;

  if (!user) {
    // Si no hay usuario, es un curioso. Lo sacamos.
    return {
      statusCode: 401, // 401 significa "No Autorizado"
      body: JSON.stringify({ error: 'Acceso denegado. Necesitas estar logueado.' }),
    };
  }

  // 2. SI SOS VOS (estás logueado): Te preparamos los datos.
  const results = [];
  const filePath = path.join(__dirname, 'clientes.csv'); // Busca el CSV en su misma carpeta

  try {
    // Creamos una promesa para leer el archivo
    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
          resolve(results); // Terminó bien, devuelve los clientes
        })
        .on('error', (error) => {
          reject(error); // Hubo un error al leer
        });
    });

    // 3. ENTREGA DE DATOS: Te mandamos los clientes en formato JSON
    return {
      statusCode: 200, // 200 significa "OK"
      body: JSON.stringify(results),
    };

  } catch (error) {
    // Si algo falló (ej: no encontró el archivo)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error al procesar el archivo de clientes.' }),
    };
  }
};