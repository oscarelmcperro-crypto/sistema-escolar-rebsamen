const { Client } = require('pg');

// Configuración de conexión (ajusta si es necesario)
const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'asistencias_y_concentrado_de_calificaciones',
  password: 'ROROGIOSMO5',
  port: 5432,
});

async function conectar() {
  try {
    await client.connect();
    console.log('¡Conexión exitosa a la base de datos!');
    
    // Prueba rápida: obtener el nombre de los usuarios
    const res = await client.query('SELECT username FROM usuarios');
    console.log('Usuarios encontrados:', res.rows);
    
    await client.end();
  } catch (err) {
    console.error('Error al conectar:', err.message);
  }
}

conectar();