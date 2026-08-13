require('dotenv').config(); 
const express = require('express');
const session = require('express-session');
const { Pool } = require('pg'); 
const path = require('path');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit-table');
const QRCode = require('qrcode');
const multer = require('multer');
const fs = require('fs');

const saltRounds = 10; 
const app = express();

// ==========================================
// ⚠️ MIDDLEWARES CRÍTICOS (AL INICIO)
// ==========================================
app.use(express.urlencoded({ extended: true })); 
app.use(express.json());                         
app.use(express.static(path.join(__dirname, 'public'))); 

// Configuración de Sesiones Estrictas
app.use(session({
    name: 'connect.sid',
    secret: process.env.SESSION_SECRET || 'rebsamen_secreto',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        maxAge: 1000 * 60 * 60 * 2, 
        httpOnly: true,
        secure: false   
    }
}));

// Configuración de Multer para Subida de Archivos / Tareas
const uploadDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Configuración Global de Nodemailer
const transportador = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS       
    }
});

const { Pool } = require('pg');

// Configuración limpia usando DATABASE_URL de Railway
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});
// Configuración limpia usando DATABASE_URL de Railway
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Esto nos imprimirá el error exacto en rojo para saber qué le duele si falla
pool.connect()
    .then(() => console.log('¡Conectado a PostgreSQL con éxito!'))
    .catch(err => console.error('ERROR DETALLADO DE CONEXIÓN:', err.message || err));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});

// Inicialización Segura: Asegurar cuenta Administrador Maestra al arrancar
(async () => {
    try {
        console.log('🔄 Conectando a PostgreSQL...');
        const passwordForzada = await bcrypt.hash(process.env.ADMIN_DEFAULT_PASSWORD || '1234', saltRounds);
        
        const queryActualizar = `
            UPDATE usuarios 
            SET password = $1, id_rol = 1, nombre = 'Administrador', apellido = 'General', email = 'admin@rebsamen.edu.mx', cambiar_password = FALSE
            WHERE username = 'admin'
        `;
        const resultado = await pool.query(queryActualizar, [passwordForzada]);
        
        if (resultado.rowCount === 0) {
            const queryInsertar = `
                INSERT INTO usuarios (username, password, id_rol, nombre, apellido, email, cambiar_password) 
                VALUES ('admin', $1, 1, 'Administrador', 'General', 'admin@rebsamen.edu.mx', FALSE)
            `;
            await pool.query(queryInsertar, [passwordForzada]);
        }
        console.log('🛡️ Contraseña de "admin" asegurada en la base de datos.');
    } catch (err) {
        console.error('⚠️ Error al inicializar el usuario administrador:', err.message);
    }
})();

// ==========================================
//   🎨 PLANTILLA INTERACTIVA DE ÉXITO (GLOBAL)
// ==========================================
function generarPantallaExito({ titulo, mensaje, rutaRedireccion, textoBotonPrimario, segundos = 3 }) {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="/style.css">
    <title>${titulo} - Enrique C. Rébsamen</title>
    <style>
        body { background-color: #f1f5f9; font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
        .success-card { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); text-align: center; width: 100%; max-width: 450px; border-top: 5px solid #16a34a; }
        h1 { color: #16a34a; margin-top: 0; font-size: 1.8rem; }
        p { color: #334155; font-size: 1rem; line-height: 1.6; }
        .btn-group { margin-top: 25px; display: flex; justify-content: center; gap: 15px; }
        .btn-custom { display: inline-block; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold; transition: background-color 0.2s; }
        .btn-primary { background-color: #1e3a8a; color: white; }
        .btn-primary:hover { background-color: #1d4ed8; }
        .btn-secondary { background-color: #64748b; color: white; }
        .btn-secondary:hover { background-color: #475569; }
        .contador { font-weight: bold; color: #16a34a; }
    </style>
</head>
<body>
    <div class="success-card">
        <h1>✨ ${titulo}</h1>
        <div style="margin: 15px 0; text-align: left;">${mensaje}</div>
        <p>Redirigiendo automáticamente en <span id="tiempo" class="contador">${segundos}</span> segundos...</p>
        <div class="btn-group">
            <a href="${rutaRedireccion}" class="btn-custom btn-primary">${textoBotonPrimario}</a>
            <a href="/menu" class="btn-custom btn-secondary">Ir al Menú</a>
        </div>
    </div>
    <script>
        let segundos = ${segundos};
        const contenedorTiempo = document.getElementById('tiempo');
        const cuentaRegresiva = setInterval(() => {
            segundos--;
            contenedorTiempo.textContent = segundos;
            if (segundos <= 0) {
                clearInterval(cuentaRegresiva);
                window.location.href = "${rutaRedireccion}"; 
            }
        }, 1000);
    </script>
</body>
</html>`;
}

// ==========================================
// 🛡️ MIDDLEWARES DE PROTECCIÓN DE RUTAS (RBAC)
// ==========================================

function verificarSesion(req, res, next) {
    if (req.session && req.session.usuarioLogueado) {
        if (req.session.debeCambiarPassword) {
            return res.redirect('/primer-login');
        }
        return next();
    }
    
    res.status(401).send(`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="/style.css">
    <title>Acceso Denegado - Enrique C. Rébsamen</title>
    <style>
        body { background-color: #f1f5f9; font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
        .error-card { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); text-align: center; max-width: 400px; border-top: 5px solid #ef4444; }
        h1 { color: #ef4444; margin-top: 0; font-size: 1.8rem; }
        p { color: #64748b; font-size: 1rem; line-height: 1.5; }
        .btn-login { display: inline-block; background-color: #1e3a8a; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="error-card">
        <h1>⚠️ Acceso Denegado</h1>
        <p>Tu sesión ha expirado o no has iniciado sesión en el sistema.</p>
        <a href="/" class="btn-login">Ir al Login</a>
    </div>
</body>
</html>`);
}

function verificarAdmin(req, res, next) {
    if (req.session && req.session.usuarioLogueado) {
        const rol = (req.session.rol || '').toLowerCase().trim();
        
        // Excluir docentes/profesores/maestros para no permitirles acciones administrativas
        const esDocente = rol.includes('docente') || rol.includes('profesor') || rol.includes('maestro');
        const esAdmin = (rol.includes('admin') || rol.includes('director') || rol === 'administrador') && !esDocente;

        if (esAdmin) {
            if (req.session.debeCambiarPassword) {
                return res.redirect('/primer-login');
            }
            return next();
        }
    }
    res.status(403).send(`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="/style.css">
    <title>Acceso Restringido - Enrique C. Rébsamen</title>
    <style>
        body { background-color: #f1f5f9; font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
        .error-card { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); text-align: center; max-width: 450px; border-top: 5px solid #f59e0b; }
        h1 { color: #d97706; margin-top: 0; font-size: 1.8rem; }
        p { color: #475569; font-size: 1rem; line-height: 1.5; }
        .btn-menu { display: inline-block; background-color: #1e3a8a; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="error-card">
        <h1>🔒 Acceso Restringido</h1>
        <p>Esta función es exclusiva para el <strong>Director / Administrador</strong> de la institución.</p>
        <a href="/menu" class="btn-menu">Volver al Menú Principal</a>
    </div>
</body>
</html>`);
}

function verificarAlumno(req, res, next) {
    if (req.session && req.session.usuarioLogueado && req.session.rol.toLowerCase().includes('alumno')) {
        return next();
    }
    res.status(403).send('<h1>Acceso restringido.</h1><p>Esta área es exclusiva para alumnos.</p><a href="/">Ir al Login</a>');
}

// ==========================================
//          ENDPOINTS AUXILIARES (API)
// ==========================================

// Rutas de Calendario Académico (Ajustado usando id_evento)
app.get('/api/calendario', async (req, res) => {
    const { mes, anio } = req.query;
    try {
        const query = `
            SELECT 
                id_evento AS id,
                id_evento,
                titulo, 
                descripcion, 
                tipo_evento, 
                fecha_inicio, 
                fecha_fin, 
                es_dia_inhabil 
            FROM calendario_academico 
            WHERE EXTRACT(MONTH FROM fecha_inicio) = $1 
              AND EXTRACT(YEAR FROM fecha_inicio) = $2
            ORDER BY fecha_inicio ASC;
        `;
        const result = await pool.query(query, [mes, anio]);
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error("❌ Error al obtener calendario:", err.message);
        res.status(500).json({ success: false, message: "Error al consultar eventos" });
    }
});

app.post('/api/calendario', verificarAdmin, async (req, res) => {
    const { titulo, tipo_evento, fecha_inicio, fecha_fin, descripcion, es_dia_inhabil } = req.body;

    try {
        const query = `
            INSERT INTO calendario_academico (titulo, tipo_evento, fecha_inicio, fecha_fin, descripcion, es_dia_inhabil)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *, id_evento AS id;
        `;

        const values = [
            titulo,
            tipo_evento || 'Académico',
            fecha_inicio,
            fecha_fin || fecha_inicio,
            descripcion || null,
            es_dia_inhabil || false
        ];

        const result = await pool.query(query, values);
        res.json({ success: true, data: result.rows[0], message: "Evento registrado correctamente" });

    } catch (err) {
        console.error("❌ ERROR EN POSTGRESQL AL GUARDAR EVENTO:", err.message);
        res.status(500).json({ success: false, message: `Error al registrar el evento: ${err.message}` });
    }
});

app.put('/api/calendario/:id', verificarAdmin, async (req, res) => {
    const { id } = req.params;
    const { titulo, tipo_evento, fecha_inicio, fecha_fin, descripcion, es_dia_inhabil } = req.body;

    try {
        const query = `
            UPDATE calendario_academico 
            SET titulo = $1, tipo_evento = $2, fecha_inicio = $3, fecha_fin = $4, descripcion = $5, es_dia_inhabil = $6
            WHERE id_evento = $7
            RETURNING *, id_evento AS id;
        `;

        const values = [titulo, tipo_evento || 'Académico', fecha_inicio, fecha_fin, descripcion, es_dia_inhabil, id];
        const result = await pool.query(query, values);

        res.json({ success: true, data: result.rows[0], message: "Evento actualizado correctamente" });
    } catch (err) {
        console.error("❌ ERROR AL ACTUALIZAR EVENTO:", err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

app.delete('/api/calendario/:id', verificarAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM calendario_academico WHERE id_evento = $1', [id]);
        res.json({ success: true, message: "Evento eliminado correctamente" });
    } catch (err) {
        console.error("❌ ERROR AL ELIMINAR EVENTO:", err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('/api/usuario-actual', (req, res) => {
    if (req.session && req.session.usuarioLogueado) {
        return res.json({
            logueado: true,
            id: req.session.usuarioId,
            username: req.session.username,
            rol: req.session.rol 
        });
    }
    res.json({ logueado: false });
});

app.get('/api/lista-alumnos', verificarSesion, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, nombre, apellido, grupo FROM alumnos ORDER BY grupo ASC, apellido ASC');
        res.json(result.rows);
    } catch (err) {
        console.error("Error al obtener lista de alumnos:", err);
        res.status(500).json([]);
    }
});

app.get('/api/grupos-existentes', verificarSesion, async (req, res) => {
    try {
        const result = await pool.query('SELECT DISTINCT TRIM(grupo) as grupo FROM alumnos ORDER BY grupo ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json([]);
    }
});

// ==========================================
// 📚 MÓDULO DE TAREAS Y ENTREGAS
// ==========================================

app.get('/tareas', verificarSesion, (req, res) => {
    res.sendFile(path.join(__dirname, 'public/tareas.html'));
});

app.post('/guardar-tarea', verificarSesion, upload.single('archivo_adjunto'), async (req, res) => {
    const { materia, titulo, descripcion, fecha_entrega } = req.body;
    const archivoName = req.file ? req.file.filename : null;

    try {
        await pool.query(
            `INSERT INTO tareas (materia, titulo, descripcion, fecha_entrega, archivo_adjunto)
             VALUES ($1, $2, $3, $4, $5)`,
            [materia, titulo, descripcion, fecha_entrega, archivoName]
        );

        res.send(generarPantallaExito({
            titulo: "Tarea Publicada",
            mensaje: `La tarea "${titulo}" para ${materia} fue publicada correctamente.`,
            rutaRedireccion: "/tareas",
            textoBotonPrimario: "Volver a Tareas"
        }));
    } catch (err) {
        console.error("Error guardando tarea:", err);
        res.status(500).send("Error interno al publicar tarea.");
    }
});

app.post('/subir-entrega', verificarSesion, upload.single('archivo_alumno'), async (req, res) => {
    const { id_tarea, comentario } = req.body;
    const username = req.session.username;
    const emailSesion = req.session.email;
    const archivoAlumno = req.file ? req.file.filename : null;

    if (!archivoAlumno) {
        return res.status(400).send("Debes adjuntar un archivo para realizar la entrega.");
    }

    try {
        const resAlumno = await pool.query(`
            SELECT id FROM alumnos 
            WHERE LOWER(email) = LOWER($1) OR LOWER(email) LIKE LOWER($2)
            LIMIT 1
        `, [emailSesion || '', `%${username || ''}%`]);

        if (resAlumno.rows.length === 0) {
            return res.status(400).send("No se encontró un expediente de alumno asociado para realizar la entrega.");
        }

        const idAlumnoReal = resAlumno.rows[0].id;

        await pool.query(
            `INSERT INTO entregas (id_tarea, id_alumno, archivo_alumno, comentario)
             VALUES ($1, $2, $3, $4)`,
            [id_tarea, idAlumnoReal, archivoAlumno, comentario]
        );

        res.send(generarPantallaExito({
            titulo: "Tarea Entregada",
            mensaje: "Tu trabajo ha sido subido con éxito.",
            rutaRedireccion: "/tareas",
            textoBotonPrimario: "Volver al Muro de Tareas"
        }));
    } catch (err) {
        console.error("Error al subir entrega:", err);
        res.status(500).send("Error al subir la entrega.");
    }
});

app.get('/api/lista-tareas', verificarSesion, async (req, res) => {
    try {
        const username = req.session.username;
        const emailSesion = req.session.email;
        const rol = req.session.rol || 'alumno';

        const alumnoRes = await pool.query(`
            SELECT id FROM alumnos 
            WHERE LOWER(email) = LOWER($1) OR LOWER(email) LIKE LOWER($2)
            LIMIT 1
        `, [emailSesion || '', `%${username || ''}%`]);

        const idAlumnoReal = alumnoRes.rows.length > 0 ? alumnoRes.rows[0].id : 0;

        const result = await pool.query(`
            SELECT t.*, 
                   TO_CHAR(t.fecha_entrega, 'YYYY-MM-DD') as fecha_formateada,
                   EXISTS(SELECT 1 FROM entregas e WHERE e.id_tarea = t.id AND e.id_alumno = $1) as ya_entrego,
                   (SELECT COUNT(*) FROM entregas e WHERE e.id_tarea = t.id) as total_entregas
            FROM tareas t 
            ORDER BY t.id DESC
        `, [idAlumnoReal]);

        res.json({ success: true, tareas: result.rows, rol: rol });
    } catch (err) {
        console.error("Error obteniendo tareas:", err);
        res.status(500).json({ success: false, tareas: [] });
    }
});

app.get('/api/tareas-pendientes-count', verificarSesion, async (req, res) => {
    try {
        const username = req.session.username;
        const emailSesion = req.session.email;

        const alumnoRes = await pool.query(`
            SELECT id FROM alumnos 
            WHERE LOWER(email) = LOWER($1) OR LOWER(email) LIKE LOWER($2)
            LIMIT 1
        `, [emailSesion || '', `%${username || ''}%`]);

        const idAlumnoReal = alumnoRes.rows.length > 0 ? alumnoRes.rows[0].id : 0;

        const result = await pool.query(`
            SELECT COUNT(*) as pendientes 
            FROM tareas t 
            WHERE NOT EXISTS (
                SELECT 1 FROM entregas e 
                WHERE e.id_tarea = t.id AND e.id_alumno = $1
            )
        `, [idAlumnoReal]);

        res.json({ success: true, pendientes: parseInt(result.rows[0].pendientes) || 0 });
    } catch (err) {
        console.error("Error al contar pendientes:", err);
        res.json({ success: false, pendientes: 0 });
    }
});

app.get(['/api/ver-entregas/:id', '/api/entregas-tarea/:id', '/api/entregas/:id'], verificarSesion, async (req, res) => {
    try {
        const idTarea = req.params.id;
        const query = `
            SELECT e.*, 
                   COALESCE(
                       NULLIF(CONCAT(al.apellido, ', ', al.nombre), ', '), 
                       u.nombre, 
                       u.username
                   ) AS alumno_nombre,
                   COALESCE(al.grupo, 'Sin Grupo') AS grupo,
                   TO_CHAR(e.fecha_entrega, 'YYYY-MM-DD HH24:MI') AS fecha_formateada
            FROM entregas e
            LEFT JOIN usuarios u ON e.id_alumno = u.id
            LEFT JOIN alumnos al ON e.id_alumno = al.id OR LOWER(al.email) = LOWER(u.email)
            WHERE e.id_tarea = $1
            ORDER BY e.id DESC
        `;
        const result = await pool.query(query, [idTarea]);

        res.json({
            success: true,
            entregas: result.rows,
            data: result.rows
        });
    } catch (err) {
        console.error("❌ Error consultando entregas:", err);
        res.status(500).json({ success: false, message: "Error al consultar entregas." });
    }
});

// ==========================================
// 📊 MÓDULO DASHBOARD ESTADÍSTICO (AMPLIADO)
// ==========================================

app.get('/dashboard', verificarSesion, (req, res) => {
    res.sendFile(path.join(__dirname, 'public/dashboard.html'));
});

app.get('/api/dashboard-stats', verificarSesion, async (req, res) => {
    try {
        const totalAlumnosRes = await pool.query('SELECT COUNT(*) FROM alumnos');
        const totalAlumnos = parseInt(totalAlumnosRes.rows[0].count) || 0;

        const asistenciasRes = await pool.query(`
            SELECT estado, COUNT(*) as cantidad 
            FROM asistencias 
            GROUP BY estado
        `);
        const asistenciaStats = { Asistencia: 0, Falta: 0, Retardo: 0 };
        asistenciasRes.rows.forEach(r => {
            asistenciaStats[r.estado] = parseInt(r.cantidad) || 0;
        });

        const promediosRes = await pool.query(`
            SELECT TRIM(materia) as materia, ROUND(AVG(calificacion), 2) as promedio 
            FROM calificaciones 
            GROUP BY TRIM(materia) 
            ORDER BY materia ASC 
            LIMIT 8
        `);

        const bitacoraRes = await pool.query(`
            SELECT tipo, COUNT(*) as cantidad 
            FROM bitacora 
            GROUP BY tipo
        `);
        const conductaStats = { Observación: 0, Reporte: 0, Felicitación: 0 };
        bitacoraRes.rows.forEach(r => {
            conductaStats[r.tipo] = parseInt(r.cantidad) || 0;
        });

        const promGlobalRes = await pool.query('SELECT ROUND(AVG(calificacion), 2) as prom_global FROM calificaciones');
        const promedioGlobal = promGlobalRes.rows[0].prom_global || "0.00";

        res.json({
            totalAlumnos,
            promedioGlobal,
            asistenciaStats,
            promediosMaterias: promediosRes.rows,
            conductaStats
        });

    } catch (err) {
        console.error("❌ Error en datos de dashboard:", err);
        res.status(500).json({ error: "Error al calcular estadísticas." });
    }
});

// Endpoint para alertas con el ID del alumno (para hacerlo clickeable)
app.get('/api/alertas-riesgo', verificarSesion, async (req, res) => {
    try {
        const query = `
            SELECT 
                al.id as id_alumno,
                al.grupo,
                CONCAT(al.apellido, ', ', al.nombre) as nombre_completo,
                COALESCE(ROUND(AVG(c.calificacion), 2), 0) as promedio,
                (SELECT COUNT(*) FROM asistencias a WHERE a.id_alumno = al.id AND a.estado = 'Falta') as faltas
            FROM alumnos al
            LEFT JOIN calificaciones c ON al.id = c.id_alumno
            GROUP BY al.id, al.grupo, al.apellido, al.nombre
            HAVING AVG(c.calificacion) < 6.0 OR (SELECT COUNT(*) FROM asistencias a WHERE a.id_alumno = al.id AND a.estado = 'Falta') >= 3
            ORDER BY promedio ASC;
        `;
        const result = await pool.query(query);
        
        const alertas = result.rows.map(a => ({
            ...a,
            accion: a.promedio < 6.0 ? 'Citatorio a Tutor / Tutoría' : 'Alerta de Inasistencia'
        }));

        res.json(alertas);
    } catch (err) {
        console.error("❌ Error consultando alertas de riesgo:", err);
        res.json([]);
    }
});

// Endpoint para Exportar Resumen del Dashboard a PDF
app.get('/api/dashboard-exportar-pdf', verificarSesion, async (req, res) => {
    try {
        const totalAlumnosRes = await pool.query('SELECT COUNT(*) FROM alumnos');
        const promGlobalRes = await pool.query('SELECT ROUND(AVG(calificacion), 2) as prom_global FROM calificaciones');
        const alertasRes = await pool.query(`
            SELECT al.grupo, CONCAT(al.apellido, ', ', al.nombre) as nombre_completo,
            COALESCE(ROUND(AVG(c.calificacion), 2), 0) as promedio
            FROM alumnos al LEFT JOIN calificaciones c ON al.id = c.id_alumno
            GROUP BY al.id, al.grupo, al.apellido, al.nombre
            HAVING AVG(c.calificacion) < 6.0 ORDER BY promedio ASC
        `);

        const doc = new PDFDocument({ margin: 30, size: 'A4' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename=Reporte_Analitico_Dashboard.pdf');
        doc.pipe(res);

        doc.fillColor('#1e3a8a').fontSize(18).text('Escuela Secundaria Oficial No. 0829', { align: 'center' });
        doc.fillColor('#334155').fontSize(14).text('"Enrique C. Rébsamen"', { align: 'center' });
        doc.fontSize(10).text('Reporte Ejecutivo de Analítica y Estudiantes en Riesgo', { align: 'center' });
        doc.moveDown(1.5);

        doc.fontSize(11).fillColor('#000000').text(`Total de Alumnos Matriculados: ${totalAlumnosRes.rows[0].count}`);
        doc.text(`Promedio Global Institucional: ${promGlobalRes.rows[0].prom_global || '0.00'}`);
        doc.moveDown(1);

        doc.fontSize(12).fillColor('#1e3a8a').text('Alumnos Detectados con Promedio Inferior a 6.0:');
        doc.moveDown(0.5);

        const tableData = {
            headers: ["Grupo", "Alumno", "Promedio Actual"],
            rows: alertasRes.rows.map(r => [r.grupo, r.nombre_completo, String(r.promedio)])
        };

        await doc.table(tableData, {
            prepareHeader: () => doc.font("Helvetica-Bold").fontSize(10).fillColor("#1e3a8a"),
            prepareRow: () => doc.font("Helvetica").fontSize(9).fillColor("#000000")
        });

        doc.end();
    } catch (err) {
        console.error("Error generando PDF analítico:", err);
        res.status(500).send('Error al generar PDF del dashboard.');
    }
});

// ==========================================
// 👨‍👩‍👧 PORTAL DE CONSULTA PARA PADRES
// ==========================================

app.get('/portal-padres', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/padres.html'));
});

app.get('/api/consultar-alumno/:id', async (req, res) => {
    try {
        const idAlumno = req.params.id;
        const resAlumno = await pool.query('SELECT id, nombre, apellido, grupo, email, tutor, telefono1, telefono2 FROM alumnos WHERE id = $1', [idAlumno]);
        if (resAlumno.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Alumno no encontrado.' });
        }
        const alumno = resAlumno.rows[0];

        const resNotas = await pool.query('SELECT materia, parcial1, parcial2, parcial3, calificacion FROM calificaciones WHERE id_alumno = $1 ORDER BY materia ASC', [idAlumno]);
        const resAsist = await pool.query(`SELECT estado, COUNT(*) as cantidad FROM asistencias WHERE id_alumno = $1 GROUP BY estado`, [idAlumno]);

        const asistencia = { Asistencia: 0, Falta: 0, Retardo: 0 };
        resAsist.rows.forEach(r => asistencia[r.estado] = parseInt(r.cantidad));

        const resBitacora = await pool.query('SELECT tipo, descripcion, fecha FROM bitacora WHERE id_alumno = $1 ORDER BY fecha DESC LIMIT 5', [idAlumno]);

        res.json({
            success: true,
            alumno,
            calificaciones: resNotas.rows,
            asistencia,
            bitacora: resBitacora.rows
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error en el servidor.' });
    }
});

// ==========================================
// 🏥 MÓDULO DE JUSTIFICANTES MÉDICOS (PADRES)
// ==========================================

// Endpoint para que los padres suban el justificante
app.post('/subir-justificante', upload.single('archivo_justificante'), async (req, res) => {
    const { id_alumno, fecha_falta, motivo } = req.body;
    const archivo = req.file ? req.file.filename : null;

    if (!archivo) {
        return res.status(400).send('<h1>Error</h1><p>Debes adjuntar un archivo (PDF o Imagen).</p><a href="/portal-padres">Volver</a>');
    }

    try {
        await pool.query(
            `INSERT INTO justificantes (id_alumno, fecha_falta, motivo, archivo_adjunto) VALUES ($1, $2, $3, $4)`,
            [id_alumno, fecha_falta, motivo, archivo]
        );
        res.send(generarPantallaExito({
            titulo: "Justificante Enviado",
            mensaje: "El documento ha sido enviado exitosamente a la dirección escolar para su revisión.",
            rutaRedireccion: "/portal-padres",
            textoBotonPrimario: "Volver al Portal"
        }));
    } catch (err) {
        console.error("Error al subir justificante:", err);
        res.status(500).send('Error interno al subir el justificante.');
    }
});

// Endpoint exclusivo para que el Director/Admin vea los justificantes pendientes
app.get('/revisar-justificantes', verificarAdmin, async (req, res) => {
    try {
        const queryText = `
            SELECT j.*, a.nombre, a.apellido, a.grupo 
            FROM justificantes j 
            INNER JOIN alumnos a ON j.id_alumno = a.id 
            ORDER BY j.fecha_solicitud DESC
        `;
        const result = await pool.query(queryText);

        let html = `<!DOCTYPE html><html lang="es"><head><link rel="stylesheet" href="/style.css"><title>Revisión de Justificantes</title>
        <style>
            body { background: #f8fafc; font-family: sans-serif; padding: 25px; }
            .container { max-width: 900px; margin: auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
            th { background: #1e3a8a; color: white; }
            .btn-status { padding: 6px 12px; border-radius: 6px; text-decoration: none; color: white; font-size: 0.85rem; font-weight: bold; }
        </style></head><body>
        <div class="container">
            <h1 style="color:#1e3a8a; margin-top:0;">🏥 Revisión de Justificantes Médicos</h1>
            <a href="/menu" style="display:inline-block; margin-bottom:15px; text-decoration:none; color:#64748b; font-weight:bold;">← Volver al Menú</a>
            <table>
                <thead><tr><th>Fecha de Falta</th><th>Alumno</th><th>Motivo</th><th>Archivo</th><th>Estado</th><th>Acción</th></tr></thead>
                <tbody>`;

        if(result.rows.length === 0) {
            html += `<tr><td colspan="6" style="text-align:center; padding:20px; color:#64748b;">No hay justificantes registrados.</td></tr>`;
        } else {
            result.rows.forEach(j => {
                const fechaFmt = new Date(j.fecha_falta).toLocaleDateString('es-MX');
                let colorBadge = j.estado === 'Pendiente' ? '#eab308' : (j.estado === 'Aprobado' ? '#16a34a' : '#ef4444');
                
                html += `<tr>
                    <td>${fechaFmt}</td>
                    <td><strong>${j.apellido}</strong>, ${j.nombre} <br><small>${j.grupo}</small></td>
                    <td>${j.motivo}</td>
                    <td><a href="/uploads/${j.archivo_adjunto}" target="_blank" style="color:#2563eb; font-weight:bold;">Ver Documento</a></td>
                    <td><span style="background:${colorBadge}; color:white; padding:4px 10px; border-radius:12px; font-size:0.8rem;">${j.estado}</span></td>
                    <td>
                        ${j.estado === 'Pendiente' ? `
                            <a href="/aprobar-justificante/${j.id}" class="btn-status" style="background:#16a34a;">Aprobar</a>
                        ` : '-'}
                    </td>
                </tr>`;
            });
        }

        html += `</tbody></table></div></body></html>`;
        res.send(html);

    } catch (err) {
        console.error("Error cargando justificantes:", err);
        res.status(500).send("Error al cargar la página.");
    }
});

// Endpoint para que el director apruebe el justificante y borre la falta
app.get('/aprobar-justificante/:id', verificarAdmin, async (req, res) => {
    try {
        const idJustificante = req.params.id;
        
        // Obtenemos los datos del justificante
        const justRes = await pool.query('SELECT * FROM justificantes WHERE id = $1', [idJustificante]);
        if(justRes.rows.length === 0) return res.send('No existe.');
        const just = justRes.rows[0];

        // Actualizamos estado a Aprobado
        await pool.query("UPDATE justificantes SET estado = 'Aprobado' WHERE id = $1", [idJustificante]);

        // Buscamos si hay una falta registrada en esa fecha y la pasamos a "Falta Justificada"
        await pool.query(
            "UPDATE asistencias SET estado = 'Falta Justificada' WHERE id_alumno = $1 AND fecha = $2 AND estado = 'Falta'",
            [just.id_alumno, just.fecha_falta]
        );

        res.redirect('/revisar-justificantes');
    } catch (err) {
        console.error("Error al aprobar:", err);
        res.status(500).send("Error interno.");
    }
});

// ==========================================
// 🪪 MÓDULO 2: CREDENCIAL DIGITAL INTERACTIVA (ALUMNOS)
// ==========================================

app.get('/mi-credencial', verificarSesion, (req, res) => {
    if (!req.session.rol || !req.session.rol.toLowerCase().includes('alumno')) {
        return res.redirect('/menu');
    }
    res.sendFile(path.join(__dirname, 'public/credencial-digital.html'));
});

app.get('/api/datos-credencial', verificarSesion, async (req, res) => {
    try {
        const username = req.session.username;
        const emailSesion = req.session.email;

        // Búsqueda robusta basada estrictamente en el correo electrónico y nombre de usuario
        let queryText = `
            SELECT id, nombre, apellido, grupo, tutor, telefono1, telefono2 
            FROM alumnos 
            WHERE LOWER(email) = LOWER($1) OR LOWER(email) LIKE LOWER($2)
            LIMIT 1
        `;
        let result = await pool.query(queryText, [emailSesion || '', `%${username || ''}%`]);

        if (result.rows.length === 0) {
            // Respaldo secundario si el correo no coincide exactamente
            let queryFallback = `
                SELECT a.id, a.nombre, a.apellido, a.grupo, a.tutor, a.telefono1, a.telefono2 
                FROM alumnos a 
                INNER JOIN usuarios u ON LOWER(u.email) = LOWER(a.email)
                WHERE u.username = $1
                LIMIT 1
            `;
            result = await pool.query(queryFallback, [username || '']);
        }

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Alumno no encontrado para esta sesión.' });
        }

        const alumno = result.rows[0];
        const qrData = JSON.stringify({ id: alumno.id, nombre: `${alumno.nombre} ${alumno.apellido}`, grupo: alumno.grupo, tutor: alumno.tutor, tel1: alumno.telefono1 });
        const qrImageBase64 = await QRCode.toDataURL(qrData);

        res.json({
            success: true,
            alumno: alumno,
            qrImage: qrImageBase64
        });
    } catch (err) {
        console.error("Error generando datos de credencial:", err);
        res.status(500).json({ success: false, message: 'Error interno.' });
    }
});

// ==========================================
// 📈 MÓDULO 4: REPORTES Y EXPORTACIÓN AVANZADA
// ==========================================

app.get('/reportes-avanzados', verificarAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public/reportes-avanzados.html'));
});

app.get('/api/reporte-avanzado-datos', verificarAdmin, async (req, res) => {
    const { fecha_inicio, fecha_fin, grupo } = req.query;
    try {
        let queryText = `
            SELECT 
                al.id, al.grupo, al.apellido, al.nombre, al.email, al.tutor, al.telefono1, al.telefono2,
                COALESCE(ROUND(AVG(c.calificacion), 2), 0) as promedio_general,
                (SELECT COUNT(*) FROM asistencias ast WHERE ast.id_alumno = al.id AND ast.estado = 'Asistencia') as total_asistencias,
                (SELECT COUNT(*) FROM asistencias ast WHERE ast.id_alumno = al.id AND ast.estado = 'Falta') as total_faltas,
                (SELECT COUNT(*) FROM asistencias ast WHERE ast.id_alumno = al.id AND ast.estado = 'Retardo') as total_retardos
            FROM alumnos al
            LEFT JOIN calificaciones c ON al.id = c.id_alumno
        `;
        let params = [];
        let condiciones = [];

        if (grupo) {
            condiciones.push(`REPLACE(TRIM(al.grupo), '"', '') ILIKE $${params.length + 1}`);
            params.push(grupo.replace(/"/g, '').trim());
        }

        if (condiciones.length > 0) {
            queryText += ` WHERE ` + condiciones.join(' AND ');
        }

        queryText += ` GROUP BY al.id, al.grupo, al.apellido, al.nombre, al.email, al.tutor, al.telefono1, al.telefono2 ORDER BY al.grupo ASC, al.apellido ASC`;

        const result = await pool.query(queryText, params);
        res.json({ success: true, alumnos: result.rows });
    } catch (err) {
        console.error("Error al generar datos de reporte avanzado:", err);
        res.status(500).json({ success: false, message: "Error al consultar la base de datos." });
    }
});

// 📥 EXPORTAR REPORTE AVANZADO A EXCEL
app.get('/api/reportes-avanzados-excel', verificarAdmin, async (req, res) => {
    const { grupo } = req.query;
    try {
        let queryText = `
            SELECT 
                al.grupo, al.apellido, al.nombre, al.email, al.tutor, al.telefono1, al.telefono2,
                COALESCE(ROUND(AVG(c.calificacion), 2), 0) as promedio_general,
                (SELECT COUNT(*) FROM asistencias ast WHERE ast.id_alumno = al.id AND ast.estado = 'Asistencia') as total_asistencias,
                (SELECT COUNT(*) FROM asistencias ast WHERE ast.id_alumno = al.id AND ast.estado = 'Falta') as total_faltas,
                (SELECT COUNT(*) FROM asistencias ast WHERE ast.id_alumno = al.id AND ast.estado = 'Retardo') as total_retardos
            FROM alumnos al
            LEFT JOIN calificaciones c ON al.id = c.id_alumno
        `;
        let params = [];
        if (grupo) {
            queryText += ` WHERE REPLACE(TRIM(al.grupo), '"', '') ILIKE $1`;
            params.push(grupo.replace(/"/g, '').trim());
        }
        queryText += ` GROUP BY al.id, al.grupo, al.apellido, al.nombre, al.email, al.tutor, al.telefono1, al.telefono2 ORDER BY al.grupo ASC, al.apellido ASC`;

        const result = await pool.query(queryText, params);

        const libro = new ExcelJS.Workbook();
        const hoja = libro.addWorksheet('Reporte Institucional');

        hoja.columns = [
            { header: 'Grupo', key: 'grupo', width: 12 },
            { header: 'Alumno', key: 'alumno', width: 30 },
            { header: 'Correo', key: 'email', width: 25 },
            { header: 'Tutor', key: 'tutor', width: 25 },
            { header: 'Teléfono 1', key: 'telefono1', width: 15 },
            { header: 'Teléfono 2', key: 'telefono2', width: 15 },
            { header: 'Promedio General', key: 'promedio_general', width: 15 },
            { header: 'Asistencias', key: 'total_asistencias', width: 15 },
            { header: 'Faltas', key: 'total_faltas', width: 12 },
            { header: 'Retardos', key: 'total_retardos', width: 12 }
        ];

        result.rows.forEach(r => {
            hoja.addRow({
                grupo: r.grupo,
                alumno: `${r.apellido}, ${r.nombre}`,
                email: r.email,
                tutor: r.tutor || '-',
                telefono1: r.telefono1 || '-',
                telefono2: r.telefono2 || '-',
                promedio_general: r.promedio_general,
                total_asistencias: r.total_asistencias,
                total_faltas: r.total_faltas,
                total_retardos: r.total_retardos
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=Reporte_Institucional_Avanzado.xlsx');
        await libro.xlsx.write(res);
        res.end();
    } catch (err) {
        console.error("Error exportando reporte avanzado a Excel:", err);
        res.status(500).send("Error al generar Excel.");
    }
});

// 📄 EXPORTAR REPORTE AVANZADO A PDF
app.get('/api/reportes-avanzados-pdf', verificarAdmin, async (req, res) => {
    const { grupo } = req.query;
    try {
        let queryText = `
            SELECT 
                al.grupo, al.apellido, al.nombre, al.tutor, al.telefono1,
                COALESCE(ROUND(AVG(c.calificacion), 2), 0) as promedio_general,
                (SELECT COUNT(*) FROM asistencias ast WHERE ast.id_alumno = al.id AND ast.estado = 'Asistencia') as total_asistencias,
                (SELECT COUNT(*) FROM asistencias ast WHERE ast.id_alumno = al.id AND ast.estado = 'Falta') as total_faltas,
                (SELECT COUNT(*) FROM asistencias ast WHERE ast.id_alumno = al.id AND ast.estado = 'Retardo') as total_retardos
            FROM alumnos al
            LEFT JOIN calificaciones c ON al.id = c.id_alumno
        `;
        let params = [];
        if (grupo) {
            queryText += ` WHERE REPLACE(TRIM(al.grupo), '"', '') ILIKE $1`;
            params.push(grupo.replace(/"/g, '').trim());
        }
        queryText += ` GROUP BY al.id, al.grupo, al.apellido, al.nombre, al.tutor, al.telefono1 ORDER BY al.grupo ASC, al.apellido ASC`;

        const result = await pool.query(queryText, params);

        const doc = new PDFDocument({ margin: 30, size: 'A4' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename=Reporte_Institucional_Avanzado.pdf');
        doc.pipe(res);

        doc.fillColor('#1e3a8a').fontSize(16).text('Escuela Secundaria Oficial No. 0829', { align: 'center' });
        doc.fontSize(12).text('"Enrique C. Rébsamen"', { align: 'center' });
        doc.fontSize(10).fillColor('#64748b').text('Reporte Ejecutivo Institucional por Alumno', { align: 'center' });
        doc.moveDown(1.5);

        const tableData = {
            headers: ["Grupo", "Alumno", "Tutor / Tel.", "Prom.", "Asist.", "Faltas", "Ret."],
            rows: result.rows.map(r => [
                r.grupo,
                `${r.apellido}, ${r.nombre}`,
                `${r.tutor || 'N/D'} (${r.telefono1 || 'S/N'})`,
                String(r.promedio_general),
                String(r.total_asistencias),
                String(r.total_faltas),
                String(r.total_retardos)
            ])
        };

        await doc.table(tableData, {
            prepareHeader: () => doc.font("Helvetica-Bold").fontSize(8).fillColor("#1e3a8a"),
            prepareRow: () => doc.font("Helvetica").fontSize(7).fillColor("#000000")
        });

        doc.end();
    } catch (err) {
        console.error("Error exportando reporte avanzado a PDF:", err);
        res.status(500).send("Error al generar PDF.");
    }
});

// ==========================================
// 🤖 MÓDULO DE ASISTENTE DE IA / CHATBOT ESCOLAR
// ==========================================

app.post('/api/chatbot-escolar', verificarSesion, async (req, res) => {
    const { mensaje } = req.body;
    const username = req.session.username;
    const emailSesion = req.session.email;
    
    if (!mensaje) {
        return res.json({ success: true, respuesta: "¡Hola! Escribe una pregunta sobre tus calificaciones, asistencias o tareas para poder ayudarte." });
    }

    const texto = mensaje.toLowerCase();

    try {
        let queryText = `
            SELECT id, nombre, apellido, grupo 
            FROM alumnos 
            WHERE LOWER(email) = LOWER($1) OR LOWER(email) LIKE LOWER($2)
            LIMIT 1
        `;
        let result = await pool.query(queryText, [emailSesion || '', `%${username || ''}%`]);

        if (result.rows.length === 0) {
            return res.json({ success: true, respuesta: "No encontré un expediente de alumno asociado a tu sesión." });
        }

        const alumno = result.rows[0];
        let respuestaBot = "";

        if (texto.includes('calificacion') || texto.includes('nota') || texto.includes('materia') || texto.includes('boleta') || texto.includes('promedio')) {
            const resNotas = await pool.query('SELECT materia, calificacion FROM calificaciones WHERE id_alumno = $1 ORDER BY materia ASC', [alumno.id]);
            if (resNotas.rows.length === 0) {
                respuestaBot = `Hola ${alumno.nombre}, aún no tienes calificaciones registradas en el sistema.`;
            } else {
                respuestaBot = `📋 **Boleta de ${alumno.nombre} ${alumno.apellido} (${alumno.grupo}):**<br>`;
                let suma = 0;
                resNotas.rows.forEach(n => {
                    respuestaBot += `• ${n.materia}: <strong>${n.calificacion || '0.00'}</strong><br>`;
                    suma += parseFloat(n.calificacion || 0);
                });
                const promedioGlobal = (suma / resNotas.rows.length).toFixed(2);
                respuestaBot += `<br>📈 **Promedio General:** <strong>${promedioGlobal}</strong>`;
            }
        } 
        else if (texto.includes('asistencia') || texto.includes('falta') || texto.includes('retardo')) {
            const resAsist = await pool.query('SELECT estado, COUNT(*) as total FROM asistencias WHERE id_alumno = $1 GROUP BY estado', [alumno.id]);
            let asistencias = 0, faltas = 0, retardos = 0;
            resAsist.rows.forEach(r => {
                if (r.estado === 'Asistencia') asistencias = r.total;
                if (r.estado === 'Falta') faltas = r.total;
                if (r.estado === 'Retardo') retardos = r.total;
            });
            respuestaBot = `📊 **Resumen de Asistencia para ${alumno.nombre}:**<br>✔️ Asistencias: ${asistencias}<br>❌ Faltas: ${faltas}<br>⏳ Retardos: ${retardos}`;
        } 
        else if (texto.includes('tarea') || texto.includes('deber') || texto.includes('entrega')) {
            const resTareas = await pool.query('SELECT COUNT(*) as total FROM tareas');
            const totalTareas = resTareas.rows[0].total || 0;
            const resEntregas = await pool.query('SELECT COUNT(*) as total FROM entregas WHERE id_alumno = $1', [alumno.id]);
            const totalEntregas = resEntregas.rows[0].total || 0;
            const pendientes = Math.max(0, totalTareas - totalEntregas);

            respuestaBot = `📚 **Estado de Tareas:**<br>Tienes un total de ${totalTareas} tareas publicadas en el muro, de las cuales has entregado ${totalEntregas}. Te quedan **${pendientes}** tareas pendientes por entregar. ¡Revisa el muro de tareas!`;
        } 
        else {
            respuestaBot = `🤖 Hola **${alumno.nombre}**, soy tu asistente virtual escolar de la Escuela Secundaria *Enrique C. Rébsamen*.<br><br>Puedo ayudarte a consultar:<br>1️⃣ *"¿Cuáles son mis calificaciones?"*<br>2️⃣ *"¿Cómo va mi asistencia?"*<br>3️⃣ *"¿Tengo tareas pendientes?"*`;
        }

        res.json({ success: true, respuesta: respuestaBot });

    } catch (err) {
        console.error("Error en chatbot escolar:", err);
        res.json({ success: true, respuesta: "Lo siento, ocurrió un error al consultar tus datos en este momento." });
    }
});

// ==========================================
//               RUTAS DE LOGIN
// ==========================================

app.get('/', (req, res) => {
    if (req.session && req.session.usuarioLogueado) {
        if (req.session.rol && req.session.rol.toLowerCase().includes('alumno')) {
            return res.redirect('/mis-calificaciones');
        }
        return res.redirect('/menu');
    }
    res.sendFile(path.join(__dirname, 'public/login.html'));
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        if (username === 'alumno123' && password === '12345') {
            req.session.usuarioLogueado = true;
            req.session.username = 'alumno123';
            req.session.rol = 'Alumnos'; 
            req.session.debeCambiarPassword = false;
            return res.redirect('/mis-calificaciones');
        }

        const queryUsuario = `SELECT * FROM usuarios WHERE username = $1`;
        const resultUsuario = await pool.query(queryUsuario, [username]);
        
        if (resultUsuario.rows.length > 0) {
            const usuario = resultUsuario.rows[0];
            const coinciden = await bcrypt.compare(password, usuario.password);
            
            if (coinciden) {
                const queryRol = `SELECT nombre_rol FROM roles WHERE id = $1`;
                const resultRol = await pool.query(queryRol, [usuario.id_rol]);
                const nombreRol = resultRol.rows.length > 0 ? resultRol.rows[0].nombre_rol : '';

                req.session.usuarioLogueado = true;
                req.session.usuarioId = usuario.id;
                req.session.username = usuario.username;
                req.session.nombre = usuario.nombre;
                req.session.email = usuario.email;
                req.session.rol = nombreRol; 
                
                if (usuario.cambiar_password) {
                    req.session.debeCambiarPassword = true;
                    return res.redirect('/primer-login');
                } else {
                    req.session.debeCambiarPassword = false;
                    if (nombreRol.toLowerCase().includes('alumno')) {
                        return res.redirect('/mis-calificaciones');
                    }
                    return res.redirect('/menu'); 
                }
            }
        }
        res.status(401).send('<h1>Usuario o contraseña incorrectos.</h1><a href="/">Volver a intentar</a>');
    } catch (err) {
        console.error("❌ Error en login:", err.message);
        res.status(500).send('Error interno en el servidor.');
    }
});

app.get('/primer-login', (req, res) => {
    if (req.session && req.session.usuarioLogueado && req.session.debeCambiarPassword) {
        return res.sendFile(path.join(__dirname, 'public/primer-login.html'));
    }
    res.redirect('/');
});

app.post('/cambio-obligatorio', async (req, res) => {
    if (!req.session || !req.session.usuarioLogueado || !req.session.username) {
        return res.redirect('/');
    }
    const { nuevaPassword } = req.body;
    const username = req.session.username;
    try {
        const passwordEncriptada = await bcrypt.hash(nuevaPassword, saltRounds);
        await pool.query('UPDATE usuarios SET password = $1, cambiar_password = FALSE WHERE username = $2', [passwordEncriptada, username]);
        req.session.debeCambiarPassword = false;

        res.send(generarPantallaExito({
            titulo: "Contraseña Configurada",
            mensaje: "Tu cuenta ha sido configurada de manera segura.",
            rutaRedireccion: "/menu",
            textoBotonPrimario: "Entrar al Menú"
        }));
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al procesar el cambio.');
    }
});

app.get('/menu', verificarSesion, (req, res) => {
    if (req.session.rol && req.session.rol.toLowerCase().includes('alumno')) {
        return res.redirect('/mis-calificaciones');
    }
    res.sendFile(path.join(__dirname, 'public/menu.html'));
});

// Ruta para la vista visual del Calendario Académico
app.get('/calendario', verificarSesion, (req, res) => {
    res.sendFile(path.join(__dirname, 'public/calendario.html'));
});

// ==========================================
// 🛡️ GESTIÓN DE DOCENTES (EXCLUSIVO DIRECTOR/ADMIN)
// ==========================================

app.get('/registrar-docente', verificarAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public/registrar-docente.html'));
});

app.post('/guardar-docente', verificarAdmin, async (req, res) => {
    const { username, password, rol, font_nombre, apellido, email } = req.body; 
    try {
        const existe = await pool.query('SELECT 1 FROM usuarios WHERE username = $1', [username]);
        if (existe.rows.length > 0) {
            return res.status(400).send('<h1>Error: El usuario ya existe.</h1><a href="/registrar-docente">Volver</a>');
        }

        const passwordEncriptada = await bcrypt.hash(password, saltRounds);
        const insertQuery = `
            INSERT INTO usuarios (username, password, id_rol, nombre, apellido, email, cambiar_password) 
            VALUES ($1, $2, $3, $4, $5, $6, TRUE)
        `;
        await pool.query(insertQuery, [username, passwordEncriptada, parseInt(rol), font_nombre, apellido, email]);

        res.send(generarPantallaExito({
            titulo: "Docente Registrado",
            mensaje: "El docente ha sido añadido al sistema escolar correctamente.",
            rutaRedireccion: "/registrar-docente",
            textoBotonPrimario: "Registrar otro docente"
        }));
    } catch (err) {
        res.status(500).send('Error al registrar docente.');
    }
});

// ==========================================
// 📢 FASE 4: MURO DE AVISOS Y CIRCULARES
// ==========================================

app.get('/avisos', verificarSesion, (req, res) => {
    res.sendFile(path.join(__dirname, 'public/avisos.html'));
});

app.get('/api/avisos', verificarSesion, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM avisos ORDER BY fecha DESC');
        res.json(result.rows);
    } catch (err) {
        console.error("Error obteniendo avisos:", err);
        res.status(500).json([]);
    }
});

app.post('/guardar-aviso', verificarSesion, async (req, res) => {
    const { titulo, contenido } = req.body;
    const autor = req.session.username || 'Dirección Escolar';
    try {
        await pool.query('INSERT INTO avisos (titulo, contenido, autor) VALUES ($1, $2, $3)', [titulo, contenido, autor]);
        res.send(generarPantallaExito({
            titulo: "Aviso Publicado",
            mensaje: "El comunicado ha sido publicado en el Muro Informativo.",
            rutaRedireccion: "/avisos",
            textoBotonPrimario: "Ver Muro de Avisos"
        }));
    } catch (err) {
        console.error("Error al guardar aviso:", err);
        res.status(500).send('Error interno al publicar aviso.');
    }
});

// ==========================================
// 🎓 FASE 5: PROMOCIÓN DE GRADO (EXCLUSIVO DIRECTOR/ADMIN)
// ==========================================

app.get('/promocion', verificarAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public/promocion.html'));
});

app.post('/procesar-promocion', verificarAdmin, async (req, res) => {
    const { grupo_origen, grupo_destino } = req.body;
    try {
        const queryText = `
            UPDATE alumnos 
            SET grupo = $1 
            WHERE grupo = $2 
               OR REPLACE(TRIM(grupo), '"', '') = REPLACE(TRIM($2), '"', '')
        `;
        const result = await pool.query(queryText, [grupo_destino, grupo_origen]);

        res.send(generarPantallaExito({
            titulo: "Promoción Completada 🚀",
            mensaje: `Se han actualizado ${result.rowCount} alumnos del grupo <strong>${grupo_origen}</strong> al nuevo grupo <strong>${grupo_destino}</strong>.`,
            rutaRedireccion: "/ver-alumnos",
            textoBotonPrimario: "Ver Lista de Alumnos"
        }));
    } catch (err) {
        console.error("Error en promoción:", err);
        res.status(500).send('Error interno al procesar la promoción de grado.');
    }
});

// ==========================================
// 📦 MÓDULO DE ALUMNOS (RUTAS REDISEÑADAS Y FILTRABLES)
// ==========================================

app.get('/registrar-alumno', verificarAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public/registrar-alumno.html'));
});

const guardarAlumnoHandler = async (req, res) => {
    const nombre = req.body.nombre || req.body['nombre(s)'];
    const apellido = req.body.apellido || req.body.apellidos || req.body['apellido(s)'];
    const email = req.body.email || req.body.correo || req.body['correo electrónico'];
    const grupo = req.body.grupo;
    const tutor = req.body.tutor;
    const telefono1 = req.body.telefono1;
    const telefono2 = req.body.telefono2 || null;

    const clienteBD = await pool.connect();
    
    try {
        await clienteBD.query('BEGIN');

        // 1. Insertar el alumno dejando que la secuencia automática asigne el ID
        const queryAlumno = `
            INSERT INTO alumnos (nombre, apellido, email, grupo, tutor, telefono1, telefono2) 
            VALUES ($1, $2, $3, $4, $5, $6, $7) 
            RETURNING id
        `;
        const resInsAlumno = await clienteBD.query(queryAlumno, [nombre, apellido, email, grupo, tutor, telefono1, telefono2]);
        const nuevoAlumnoId = resInsAlumno.rows[0].id;

        const resRol = await clienteBD.query("SELECT id FROM roles WHERE LOWER(nombre_rol) LIKE '%alumno%' LIMIT 1");
        const idRolCorrecto = resRol.rows.length > 0 ? resRol.rows[0].id : 3;

        const usernameAlumno = email.split('@')[0]; 
        const passwordTemporal = 'alumno1234'; 
        const hashPassword = await bcrypt.hash(passwordTemporal, saltRounds);
        
        // 2. Insertar el usuario con su propia secuencia automática sin chocar con el ID de alumnos
        const queryUsuario = `
            INSERT INTO usuarios (username, password, id_rol, nombre, apellido, email, cambiar_password) 
            VALUES ($1, $2, $3, $4, $5, $6, TRUE)
            RETURNING id
        `;
        const resInsUsuario = await clienteBD.query(queryUsuario, [usernameAlumno, hashPassword, idRolCorrecto, nombre, apellido, email]);
        const nuevoUsuarioId = resInsUsuario.rows[0].id;

        await clienteBD.query('COMMIT');

        res.send(generarPantallaExito({
            titulo: "Alumno y Cuenta Creados",
            mensaje: `<div style="background: #f8fafc; padding: 15px; border: 1px solid #e2e8f0; border-radius:8px;">
                        <p>🆔 <strong>ID del Alumno:</strong> <span style="color:#16a34a; font-weight:bold;">${nuevoAlumnoId}</span></p>
                        <p>👤 <strong>Usuario:</strong> ${usernameAlumno}</p>
                        <p>🔑 <strong>Contraseña:</strong> ${passwordTemporal}</p>
                        <p>👨‍👩‍👧 <strong>Tutor:</strong> ${tutor}</p>
                      </div>`,
            rutaRedireccion: "/registrar-alumno",
            textoBotonPrimario: "Registrar otro alumno",
            segundos: 10
        }));

    } catch (err) {
        await clienteBD.query('ROLLBACK');
        console.error("Error al registrar alumno:", err);
        res.status(500).send(`Error al registrar: ${err.message}`);
    } finally {
        clienteBD.release();
    }
};

app.post('/guardar-alumno', verificarAdmin, guardarAlumnoHandler);
app.post('/registrar-alumno', verificarAdmin, guardarAlumnoHandler);

app.get('/ver-alumnos', verificarSesion, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, nombre, apellido, email, grupo, tutor, telefono1, telefono2 FROM alumnos ORDER BY grupo ASC, apellido ASC');
        const rolUsuario = (req.session.rol || '').toLowerCase();
        const esAdmin = rolUsuario.includes('admin') || rolUsuario.includes('director') || rolUsuario === 'administrador';

        let html = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="/style.css">
    <title>Lista General de Alumnos - Enrique C. Rébsamen</title>
    <style>
        body { background-color: #f8fafc; font-family: 'Segoe UI', system-ui, sans-serif; margin: 0; padding: 25px; }
        .container { max-width: 1100px; margin: 0 auto; }
        .header-panel { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; flex-wrap: wrap; gap: 15px; }
        .header-panel h1 { color: #1e3a8a; margin: 0; font-size: 1.8rem; display: flex; align-items: center; gap: 10px; }
        .badge-total { background: #3b82f6; color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.9rem; font-weight: bold; }
        .toolbar { background: white; padding: 18px 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.04); border: 1px solid #e2e8f0; display: flex; gap: 15px; margin-bottom: 20px; flex-wrap: wrap; align-items: center; justify-content: space-between; }
        .search-input, .select-filter { padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem; outline: none; transition: border-color 0.2s; }
        .search-input { flex: 1; min-width: 220px; }
        .search-input:focus, .select-filter:focus { border-color: #3b82f6; }
        .table-card { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #1a2332; color: white; padding: 14px 16px; text-align: left; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px; }
        td { padding: 12px 16px; border-bottom: 1px solid #f1f5f9; font-size: 0.92rem; color: #334155; vertical-align: middle; text-transform: capitalize; }
        tr:hover { background-color: #f8fafc; }
        .actions-cell { display: flex; gap: 8px; justify-content: center; flex-wrap: nowrap; align-items: center; }
        .btn-action { display: inline-flex; align-items: center; gap: 5px; padding: 7px 12px; border-radius: 6px; text-decoration: none; font-size: 0.82rem; font-weight: bold; color: white; transition: transform 0.1s, opacity 0.2s; white-space: nowrap; }
        .btn-action:hover { opacity: 0.9; transform: translateY(-1px); }
        .btn-perfil { background-color: #1e3a8a; }
        .btn-qr { background-color: #0284c7; }
        .btn-editar { background-color: #eab308; }
        .btn-borrar { background-color: #ef4444; }
        .btn-menu { background-color: #64748b; padding: 10px 20px; border-radius: 8px; text-decoration: none; color: white; font-weight: bold; display: inline-block; margin-top: 20px; }
    </style>
</head><body>
    <div class="container">
        <div class="header-panel">
            <h1>📋 Lista General de Alumnos <span class="badge-total" id="total-count">${result.rows.length} Alumnos</span></h1>
            <a href="/menu" class="btn-menu" style="margin:0;">Volver al Menú</a>
        </div>
        <div class="toolbar">
            <div style="display:flex; gap:15px; flex:1; flex-wrap:wrap; align-items:center;">
                <input type="text" id="input-buscar" class="search-input" placeholder="🔍 Buscar alumno por nombre o correo..." onkeyup="filtrarTabla()">
                <select id="select-grupo" class="select-filter" onchange="filtrarTabla()">
                    <option value="">-- Todos los Grupos --</option>`;

        const gruposUnicos = [...new Set(result.rows.map(a => a.grupo.replace(/"/g, '').trim()))].sort();
        gruposUnicos.forEach(g => {
            html += `<option value="${g}">${g}</option>`;
        });

        html += `   </select>
            </div>
            <div>
                <button type="button" onclick="descargarCredencialesGrupo()" class="btn-action" style="background-color: #16a34a; padding: 10px 16px; font-size: 0.9rem;">
                    📇 Descargar Credenciales QR del Grupo (PDF)
                </button>
            </div>
        </div>
        <div class="table-card">
            <table>
                <thead>
                    <tr>
                        <th style="width: 10%; text-align: center;">Grupo</th>
                        <th style="width: 25%;">Alumno</th>
                        <th style="width: 25%;">Tutor / Emergencia</th>
                        <th style="width: 20%;">Correo Electrónico</th>
                        <th style="width: 20%; text-align: center;">Acciones</th>
                    </tr>
                </thead>
                <tbody id="tabla-body">`;

        result.rows.forEach(a => {
            const grupoLimpio = a.grupo.replace(/"/g, '').trim();
            html += `
                <tr class="fila-alumno" data-grupo="${grupoLimpio}">
                    <td style="text-align: center;"><strong>${a.grupo}</strong></td>
                    <td><strong>${a.apellido}</strong>, ${a.nombre}</td>
                    <td>${a.tutor || 'N/D'}<br><small style="color:#64748b;">📞 ${a.telefono1 || 'S/N'}</small></td>
                    <td style="text-transform: none;">${a.email}</td>
                    <td>
                        <div class="actions-cell">
                            <a href="/reporte-alumno/${a.id}" class="btn-action btn-perfil">🔍 Perfil</a>
                            <a href="/descargar-credencial-pdf/${a.id}" target="_blank" class="btn-action btn-qr">📇 QR</a>
                            ${esAdmin ? `
                                <a href="/editar-alumno/${a.id}" class="btn-action btn-editar">✏️ Editar</a>
                                <a href="/eliminar-alumno/${a.id}" onclick="return confirm('¿Estás seguro de que deseas eliminar permanentemente a este alumno?');" class="btn-action btn-borrar">🗑️ Borrar</a>
                            ` : ''}
                        </div>
                    </td>
                </tr>`;
        });

        html += `
                </tbody>
            </table>
        </div>
        <a href="/menu" class="btn-menu">Volver al Menú</a>
    </div>
    <script>
        function filtrarTabla() {
            const busqueda = document.getElementById('input-buscar').value.toLowerCase();
            const grupoFiltro = document.getElementById('select-grupo').value.toLowerCase();
            const filas = document.querySelectorAll('.fila-alumno');
            let visibles = 0;

            filas.forEach(fila => {
                const texto = fila.textContent.toLowerCase();
                const grupo = fila.getAttribute('data-grupo').toLowerCase();
                const coincideBusqueda = texto.includes(busqueda);
                const coincideGrupo = grupoFiltro === '' || grupo === grupoFiltro;

                if (coincideBusqueda && coincideGrupo) {
                    fila.style.display = '';
                    visibles++;
                } else {
                    fila.style.display = 'none';
                }
            });

            document.getElementById('total-count').textContent = visibles + ' Alumnos';
        }

        function descargarCredencialesGrupo() {
            const grupoFiltro = document.getElementById('select-grupo').value;
            if (!grupoFiltro) {
                alert('⚠️ Por favor, selecciona un grupo específico en el menú desplegable para descargar sus credenciales.');
                return;
            }
            window.open('/descargar-credenciales-grupo-pdf/' + encodeURIComponent(grupoFiltro), '_blank');
        }
    </script>
</body>
</html>`;
        res.send(html);
    } catch (err) { 
        console.error("Error al cargar lista de alumnos:", err);
        res.status(500).send('Error al cargar la lista de alumnos.'); 
    }
});

app.get('/editar-alumno/:id', verificarAdmin, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM alumnos WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).send('<h1>Alumno no encontrado</h1>');
        const a = result.rows[0];

        let html = `<!DOCTYPE html><html lang="es"><head><link rel="stylesheet" href="/style.css"><title>Editar Alumno</title></head><body>
                    <main class="main-content" style="max-width:500px; margin:50px auto; background:white; padding:35px; border-radius:12px; box-shadow:0 4px 15px rgba(0,0,0,0.1);">
                    <h2 style="color:#1e3a8a; margin-top:0;">✏️ Editar Alumno #${a.id}</h2>
                    <form action="/actualizar-alumno" method="POST">
                        <input type="hidden" name="id" value="${a.id}">
                        <p><label style="font-weight:bold; color:#334155;">Nombre(s):</label><br><input type="text" name="nombre" value="${a.nombre}" required style="width:100%; padding:9px; border-radius:6px; border:1px solid #cbd5e1; box-sizing:border-box; margin-top:4px;"></p>
                        <p><label style="font-weight:bold; color:#334155;">Apellido(s):</label><br><input type="text" name="apellido" value="${a.apellido}" required style="width:100%; padding:9px; border-radius:6px; border:1px solid #cbd5e1; box-sizing:border-box; margin-top:4px;"></p>
                        <p><label style="font-weight:bold; color:#334155;">Grupo:</label><br><input type="text" name="grupo" value="${a.grupo}" required style="width:100%; padding:9px; border-radius:6px; border:1px solid #cbd5e1; box-sizing:border-box; margin-top:4px;"></p>
                        <p><label style="font-weight:bold; color:#334155;">Correo Electrónico:</label><br><input type="email" name="email" value="${a.email}" required style="width:100%; padding:9px; border-radius:6px; border:1px solid #cbd5e1; box-sizing:border-box; margin-top:4px;"></p>
                        <p><label style="font-weight:bold; color:#334155;">Tutor Responsable:</label><br><input type="text" name="tutor" value="${a.tutor || ''}" style="width:100%; padding:9px; border-radius:6px; border:1px solid #cbd5e1; box-sizing:border-box; margin-top:4px;"></p>
                        <p><label style="font-weight:bold; color:#334155;">Teléfono Emergencia 1:</label><br><input type="tel" name="telefono1" value="${a.telefono1 || ''}" style="width:100%; padding:9px; border-radius:6px; border:1px solid #cbd5e1; box-sizing:border-box; margin-top:4px;"></p>
                        <p><label style="font-weight:bold; color:#334155;">Teléfono Emergencia 2:</label><br><input type="tel" name="telefono2" value="${a.telefono2 || ''}" style="width:100%; padding:9px; border-radius:6px; border:1px solid #cbd5e1; box-sizing:border-box; margin-top:4px;"></p>
                        <div style="margin-top:25px; display:flex; gap:10px;">
                            <button type="submit" style="background:#16a34a; color:white; padding:10px 20px; border:none; border-radius:6px; font-weight:bold; cursor:pointer; flex:1;">Guardar Cambios 💾</button>
                            <a href="/ver-alumnos" style="background:#64748b; color:white; padding:10px 20px; border-radius:6px; text-decoration:none; font-weight:bold; text-align:center;">Cancelar</a>
                        </div>
                    </form></main></body></html>`;
        res.send(html);
    } catch (err) { res.status(500).send('Error al cargar datos del alumno.'); }
});

app.post('/actualizar-alumno', verificarAdmin, async (req, res) => {
    const { id, nombre, apellido, grupo, email, tutor, telefono1, telefono2 } = req.body;
    try {
        await pool.query('UPDATE alumnos SET nombre = $1, apellido = $2, grupo = $3, email = $4, tutor = $5, telefono1 = $6, telefono2 = $7 WHERE id = $8', [nombre, apellido, grupo, email, tutor, telefono1, telefono2, id]);
        await pool.query('UPDATE usuarios SET nombre = $1, apellido = $2, email = $3 WHERE id = $4', [nombre, apellido, email, id]);
        res.send(generarPantallaExito({ titulo: "Alumno Actualizado", mensaje: "Los datos han sido sincronizados en el sistema.", rutaRedireccion: "/ver-alumnos", textoBotonPrimario: "Volver al Menú" }));
    } catch (err) { res.status(500).send('Error al actualizar el registro.'); }
});

app.get('/eliminar-alumno/:id', verificarAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM entregas WHERE id_alumno = $1', [req.params.id]);
        await pool.query('DELETE FROM justificantes WHERE id_alumno = $1', [req.params.id]);
        await pool.query('DELETE FROM bitacora WHERE id_alumno = $1', [req.params.id]);
        await pool.query('DELETE FROM calificaciones WHERE id_alumno = $1', [req.params.id]);
        await pool.query('DELETE FROM asistencias WHERE id_alumno = $1', [req.params.id]);
        await pool.query('DELETE FROM reportes_disciplinarios WHERE id_alumno = $1', [req.params.id]);
        await pool.query('DELETE FROM alumnos WHERE id = $1', [req.params.id]);
        await pool.query('DELETE FROM usuarios WHERE id = $1', [req.params.id]);
        res.redirect('/ver-alumnos');
    } catch (err) { 
        console.error("Error al eliminar alumno:", err);
        res.status(500).send('Error al eliminar el alumno y sus registros asociados.'); 
    }
});

// ==========================================
// 📝 FASE 2: MÓDULO DE BITÁCORA DISCIPLINARIA
// ==========================================

app.get('/registrar-bitacora', verificarSesion, (req, res) => {
    res.sendFile(path.join(__dirname, 'public/bitacora.html'));
});

app.post('/guardar-bitacora', verificarSesion, async (req, res) => {
    const { id_alumno, tipo, descripcion } = req.body;
    try {
        await pool.query('INSERT INTO bitacora (id_alumno, tipo, descripcion) VALUES ($1, $2, $3)', [id_alumno, tipo, descripcion]);
        res.send(generarPantallaExito({
            titulo: "Incidencia Registrada",
            mensaje: "La anotación disciplinaria o reconocimiento ha sido guardado en la bitácora escolar.",
            rutaRedireccion: "/registrar-bitacora",
            textoBotonPrimario: "Registrar otra anotación"
        }));
    } catch (err) {
        console.error("❌ Error guardando bitácora:", err);
        res.status(500).send('Error al guardar la nota en la bitácora.');
    }
});

// ==========================================
// 🚨 MÓDULO DE REPORTES DE CONDUCTA Y CITATORIOS
// ==========================================

app.get('/reportes-conducta', verificarSesion, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, nombre, apellido, grupo FROM alumnos ORDER BY grupo ASC, apellido ASC');
        let html = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="/style.css">
    <title>Reportes de Conducta - Enrique C. Rébsamen</title>
    <style>
        body { background-color: #f8fafc; font-family: 'Segoe UI', system-ui, sans-serif; margin: 0; padding: 25px; }
        .container { max-width: 650px; margin: 0 auto; background: white; padding: 35px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
        h1 { color: #1e3a8a; margin-top: 0; font-size: 1.6rem; display: flex; align-items: center; gap: 10px; }
        .form-group { margin-bottom: 20px; }
        label { display: block; font-weight: bold; color: #334155; margin-bottom: 6px; font-size: 0.9rem; }
        select, textarea, input { width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.95rem; outline: none; box-sizing: border-box; color: #1e293b; background: #ffffff; }
        select option { color: #1e293b; background: #ffffff; padding: 5px; }
        select:focus, textarea:focus, input:focus { border-color: #3b82f6; }
        .checkbox-group { display: flex; align-items: center; gap: 10px; margin-top: 10px; }
        .checkbox-group input { width: 18px; height: 18px; cursor: pointer; }
        .btn-submit { background: #1e3a8a; color: white; border: none; padding: 12px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; width: 100%; font-size: 1rem; margin-top: 10px; transition: background 0.2s; }
        .btn-submit:hover { background: #1d4ed8; }
        .btn-menu { display: inline-block; background: #64748b; color: white; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; margin-top: 15px; text-align: center; width: 100%; box-sizing: border-box; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚨 Registro de Incidencia y Citatorio</h1>
        <p style="color: #64748b; font-size: 0.9rem; margin-bottom: 25px;">Documenta reportes de disciplina y genera citatorios oficiales para tutores.</p>
        
        <form action="/guardar-reporte-conducta" method="POST">
            <div class="form-group">
                <label>Seleccionar Alumno:</label>
                <select name="id_alumno" required>
                    <option value="">-- Seleccione un alumno --</option>`;
        result.rows.forEach(a => {
            html += `<option value="${a.id}">[${a.grupo.replace(/"/g, '').trim()}] ${a.apellido}, ${a.nombre}</option>`;
        });
        html += `   </select>
            </div>

            <div class="form-group">
                <label>Gravedad de la Incidencia:</label>
                <select name="tipo_falta" required>
                    <option value="Leve">🟡 Leve (Advertencia verbal / Anotación)</option>
                    <option value="Moderada">🟠 Moderada (Acumulación de faltas / Desatención)</option>
                    <option value="Grave">🔴 Grave (Falta al reglamento escolar)</option>
                </select>
            </div>

            <div class="form-group">
                <label>Motivo o Descripción de los Hechos:</label>
                <textarea name="motivo" rows="4" placeholder="Describa detalladamente lo ocurrido..." required></textarea>
            </div>

            <div class="checkbox-group">
                <input type="checkbox" id="citatorioCheck" name="requere_citatorio" value="true" onchange="toggleCitatorioFields()">
                <label for="citatorioCheck" style="margin: 0; cursor: pointer;">📅 ¿Generar Citatorio Oficial para Tutor?</label>
            </div>

            <div id="camposCitatorio" style="display: none; margin-top: 15px; background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
                <div class="form-group">
                    <label>Fecha de la Junta / Cita:</label>
                    <input type="date" name="fecha_citatorio">
                </div>
                <div class="form-group" style="margin-bottom:0;">
                    <label>Hora Programada:</label>
                    <input type="time" name="hora_citatorio">
                </div>
            </div>

            <button type="submit" class="btn-submit">Registrar Incidencia 💾</button>
        </form>
        <a href="/menu" class="btn-menu">Volver al Menú Principal</a>
    </div>

    <script>
        function toggleCitatorioFields() {
            const isChecked = document.getElementById('citatorioCheck').checked;
            document.getElementById('camposCitatorio').style.display = isChecked ? 'block' : 'none';
        }
    </script>
</body>
</html>`;
        res.send(html);
    } catch (err) {
        res.status(500).send('Error al cargar formulario de conducta.');
    }
});

app.post('/guardar-reporte-conducta', verificarSesion, async (req, res) => {
    const { id_alumno, tipo_falta, motivo, requere_citatorio, fecha_citatorio, hora_citatorio } = req.body;
    const requiereBool = requere_citatorio === 'true';

    try {
        await pool.query(
            `INSERT INTO reportes_disciplinarios (id_alumno, tipo_falta, motivo, requiere_citatorio, fecha_citatorio, hora_citatorio)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [id_alumno, tipo_falta, motivo, requiereBool, fecha_citatorio || null, hora_citatorio || null]
        );

        if (requiereBool) {
            return res.redirect(`/descargar-citatorio-pdf/${id_alumno}?motivo=${encodeURIComponent(motivo)}&fecha=${fecha_citatorio}&hora=${hora_citatorio}`);
        }

        res.send(generarPantallaExito({
            titulo: "Incidencia Registrada",
            mensaje: "El reporte disciplinario se ha guardado correctamente.",
            rutaRedireccion: "/reportes-conducta",
            textoBotonPrimario: "Registrar otro reporte"
        }));
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al guardar reporte de conducta.');
    }
});

app.get('/descargar-citatorio-pdf/:id', verificarSesion, async (req, res) => {
    try {
        const idAlumno = req.params.id;
        const { motivo, fecha, hora } = req.query;
        const resAlumno = await pool.query('SELECT * FROM alumnos WHERE id = $1', [idAlumno]);
        if (resAlumno.rows.length === 0) return res.status(404).send('Alumno no encontrado');
        const alumno = resAlumno.rows[0];

        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=Citatorio_${alumno.apellido}.pdf`);
        doc.pipe(res);

        doc.fillColor('#1e3a8a').fontSize(16).text('Escuela Secundaria Oficial No. 0829', { align: 'center' });
        doc.fontSize(12).text('"Enrique C. Rébsamen"', { align: 'center' });
        doc.fontSize(10).fillColor('#64748b').text('Dirección Escolar - Citatorio Oficial a Padre de Familia o Tutor', { align: 'center' });
        doc.moveDown(2);

        doc.fillColor('#000000').fontSize(11).text(`Fecha de emisión: ${new Date().toLocaleDateString('es-MX')}`);
        doc.moveDown(1);
        doc.text(`Estimado(a) Padre de Familia o Tutor del alumno(a):`);
        doc.fontSize(12).font('Helvetica-Bold').text(`${alumno.apellido}, ${alumno.nombre} (Grupo: ${alumno.grupo}) - Tutor: ${alumno.tutor || 'No registrado'}`);
        doc.moveDown(1);
        doc.font('Helvetica').fontSize(11).text('Por medio de la presente, se le convoca de manera urgente a una cita presencial en las instalaciones de la institución escolar, debido al siguiente motivo relacionado con el desempeño y disciplina escolar:');
        
        doc.moveDown(1);
        doc.rect(doc.x, doc.y, 515, 70).fillAndStroke('#f8fafc', '#cbd5e1');
        doc.fillColor('#334155').fontSize(10).text(`"${motivo || 'Incidencia reglamentaria reportada por la dirección.'}"`, doc.x + 15, doc.y + 15, { width: 485 });
        doc.moveDown(3);

        doc.fillColor('#000000').fontSize(11).text(`La cita ha sido programada para el día: ${fecha || 'Proxima fecha habil'} a las ${hora || '08:00'} hrs.`);
        doc.moveDown(1.5);
        doc.text(`Teléfonos de contacto registrados: ${alumno.telefono1 || 'S/N'} / ${alumno.telefono2 || 'S/N'}`);
        doc.moveDown(2);
        doc.text('Su asistencia es de suma importancia para el seguimiento y bienestar académico del estudiante.');
        doc.moveDown(3);

        doc.text('________________________________________', { align: 'center' });
        doc.text('Dirección Escolar y Orientación Educativa', { align: 'center' });

        doc.end();
    } catch (err) {
        res.status(500).send('Error al generar PDF del citatorio.');
    }
});

// ==========================================
// 💬 MÓDULO DE MENSAJERÍA INTERNA / BUZÓN
// ==========================================

app.get('/buzon', verificarSesion, (req, res) => {
    res.sendFile(path.join(__dirname, 'public/buzon.html'));
});

app.get('/api/mensajes', verificarSesion, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM mensajes_internos ORDER BY fecha DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json([]);
    }
});

app.post('/enviar-mensaje', verificarSesion, async (req, res) => {
    const { asunto, contenido, destinatario } = req.body;
    const remitente = req.session.nombre || req.session.username || 'Personal Escolar';

    try {
        await pool.query(
            `INSERT INTO mensajes_internos (remitente, destinatario, asunto, contenido) VALUES ($1, $2, $3, $4)`,
            [remitente, destinatario || 'General', asunto, contenido]
        );

        res.send(generarPantallaExito({
            titulo: "Mensaje Enviado",
            mensaje: "El comunicado interno ha sido publicado en el buzón.",
            rutaRedireccion: "/buzon",
            textoBotonPrimario: "Ver Buzón"
        }));
    } catch (err) {
        res.status(500).send('Error al enviar mensaje.');
    }
});

// ==========================================
// 📩 FASE 3: ENVÍO DE BOLETA ADJUNTA POR CORREO
// ==========================================

app.get('/enviar-boleta-correo/:id', verificarSesion, async (req, res) => {
    try {
        const idAlumno = req.params.id;
        const resAlumno = await pool.query('SELECT * FROM alumnos WHERE id = $1', [idAlumno]);
        if (resAlumno.rows.length === 0) return res.status(404).send('Alumno no encontrado');
        const alumno = resAlumno.rows[0];

        const resNotas = await pool.query('SELECT materia, parcial1, parcial2, parcial3, calificacion FROM calificaciones WHERE id_alumno = $1 ORDER BY materia ASC', [idAlumno]);

        const doc = new PDFDocument({ margin: 30, size: 'A4' });
        let buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', async () => {
            const pdfData = Buffer.concat(buffers);

            const mailOptions = {
                from: `"Escuela Enrique C. Rébsamen" <${process.env.EMAIL_USER}>`,
                to: alumno.email,
                subject: `📊 Boleta Oficial de Calificaciones - ${alumno.nombre} ${alumno.apellido}`,
                html: `
                    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #cbd5e1; border-radius: 8px;">
                        <h2 style="color: #1e3a8a;">Escuela Secundaria Oficial No. 0829</h2>
                        <h3 style="color: #334155;">Boleta Oficial de Calificaciones</h3>
                        <p>Estimado Padre de Familia / Tutor (${alumno.tutor || 'N/D'}),</p>
                        <p>Adjunto a este correo encontrará la boleta de calificaciones en formato PDF del alumno <strong>${alumno.nombre} ${alumno.apellido}</strong> correspondiente al grupo <strong>${alumno.grupo}</strong>.</p>
                        <br>
                        <p style="color: #64748b; font-size: 0.85rem;">Atentamente,<br><strong>Dirección Escolar "Enrique C. Rébsamen"</strong></p>
                    </div>
                `,
                attachments: [
                    {
                        filename: `Boleta_${alumno.apellido}_${alumno.nombre}.pdf`,
                        content: pdfData
                    }
                ]
            };

            await transportador.sendMail(mailOptions);
            res.send(generarPantallaExito({
                titulo: "Correo Enviado",
                mensaje: `La boleta oficial fue enviada con éxito al correo <strong>${alumno.email}</strong>.`,
                rutaRedireccion: `/reporte-alumno/${alumno.id}`,
                textoBotonPrimario: "Volver al Perfil"
            }));
        });

        doc.fillColor('#1e3a8a').fontSize(18).text('Escuela Secundaria Oficial No. 0829', { align: 'center' });
        doc.fillColor('#334155').fontSize(14).text('"Enrique C. Rébsamen"', { align: 'center' });
        doc.fontSize(10).text('Boleta Oficial de Calificaciones - Ciclo Escolar', { align: 'center' });
        doc.moveDown(1.5);
        doc.fillColor('#000000').fontSize(11).text(`Alumno: ${alumno.apellido}, ${alumno.nombre} | Tutor: ${alumno.tutor || 'N/D'}`);
        doc.text(`Grupo: ${alumno.grupo}  |  ID Estudiante: ${alumno.id}`);
        doc.moveDown(1);

        const tableData = {
            headers: ["Asignatura / Materia", "Parcial 1", "Parcial 2", "Parcial 3", "Promedio Final"],
            rows: resNotas.rows.map(n => [
                n.materia,
                String(n.parcial1 || '-'),
                String(n.parcial2 || '-'),
                String(n.parcial3 || '-'),
                String(n.calificacion || '0.00')
            ])
        };

        await doc.table(tableData, {
            prepareHeader: () => doc.font("Helvetica-Bold").fontSize(10).fillColor("#1e3a8a"),
            prepareRow: () => doc.font("Helvetica").fontSize(9).fillColor("#000000")
        });

        doc.end();
    } catch (err) {
        console.error("Error al enviar boleta por correo:", err);
        res.status(500).send('Error interno al enviar la boleta por correo.');
    }
});

// ==========================================
// 📊 PERFIL DEL ALUMNO
// ==========================================

app.get('/reporte-alumno/:id', verificarSesion, async (req, res) => {
    const idAlumno = req.params.id;
    try {
        const info = await pool.query('SELECT * FROM alumnos WHERE id = $1', [idAlumno]);
        if (info.rows.length === 0) return res.status(404).send('<h1>Alumno no encontrado</h1>');
        const alumno = info.rows[0];

        const totalAsistencias = await pool.query("SELECT COUNT(*) FROM asistencias WHERE id_alumno = $1", [idAlumno]);
        const presencias = await pool.query("SELECT COUNT(*) FROM asistencias WHERE id_alumno = $1 AND estado = 'Asistencia'", [idAlumno]);
        const faltas = await pool.query("SELECT COUNT(*) FROM asistencias WHERE id_alumno = $1 AND estado = 'Falta'", [idAlumno]);
        const retardos = await pool.query("SELECT COUNT(*) FROM asistencias WHERE id_alumno = $1 AND estado = 'Retardo'", [idAlumno]);
        
        const total = parseInt(totalAsistencias.rows[0].count) || 0;
        const si = parseInt(presencias.rows[0].count) || 0;
        const porcentaje = total > 0 ? ((si / total) * 100).toFixed(1) : "100";

        const notas = await pool.query('SELECT materia, parcial1, parcial2, parcial3, calificacion FROM calificaciones WHERE id_alumno = $1 ORDER BY materia ASC', [idAlumno]);
        const resBitacora = await pool.query('SELECT tipo, descripcion, fecha FROM bitacora WHERE id_alumno = $1 ORDER BY fecha DESC', [idAlumno]);

        let html = `<!DOCTYPE html><html lang="es"><head><link rel="stylesheet" href="/style.css"><title>Perfil - ${alumno.nombre}</title></head><body>
                    <main class="main-content" style="max-width:850px; margin:30px auto; background:white; padding:30px; border-radius:12px; box-shadow:0 4px 15px rgba(0,0,0,0.1);">
                    <h1 style="color:#1e3a8a; margin-top:0;">Reporte del Alumno</h1>
                    <p style="font-size:1.1rem; color:#334155;"><strong>Nombre:</strong> ${alumno.apellido}, ${alumno.nombre} | <strong>Grupo:</strong> ${alumno.grupo}</p>
                    <p style="font-size:0.95rem; color:#64748b; margin-top:5px;"><strong>Tutor Responsable:</strong> ${alumno.tutor || 'No registrado'} | <strong>Teléfonos:</strong> ${alumno.telefono1 || 'S/N'} / ${alumno.telefono2 || 'S/N'}</p>
                    
                    <div style="background:#f1f5f9; padding:12px; border-radius:8px; margin:20px 0;">
                        <h3 style="margin:0; color:#1e3a8a;">Asistencias: ${porcentaje}%</h3>
                        <p style="margin:5px 0 0 0; color:#475569;">Presencias: ${si} | Faltas: ${faltas.rows[0].count} | Retardos: ${retardos.rows[0].count}</p>
                    </div>

                    <h2 style="color:#1e3a8a;">Boleta de Calificaciones</h2>
                    <table style="width:100%; border-collapse:collapse; margin-bottom:25px;">
                    <thead><tr style="background:#1e3a8a; color:white;"><th style="padding:10px; text-align:left;">Materia</th><th style="padding:10px;">P1</th><th style="padding:10px;">P2</th><th style="padding:10px;">P3</th><th style="padding:10px;">Final</th></tr></thead><tbody>`;
        notas.rows.forEach(n => {
            html += `<tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:10px;">${n.materia}</td><td style="text-align:center;">${n.parcial1}</td><td style="text-align:center;">${n.parcial2}</td><td style="text-align:center;">${n.parcial3}</td><td style="text-align:center;"><strong>${n.calificacion}</strong></td></tr>`;
        });
        html += `</tbody></table>`;

        html += `<h2 style="color:#1e3a8a;">📝 Historial de Bitácora / Incidencias</h2>`;
        if (resBitacora.rows.length === 0) {
            html += `<p style="color:#94a3b8; font-style:italic;">El alumno no cuenta con observaciones o reportes registrados en la bitácora.</p>`;
        } else {
            html += `<table style="width:100%; border-collapse:collapse; margin-bottom:20px;"><thead><tr style="background:#475569; color:white;"><th style="padding:8px;">Fecha</th><th style="padding:8px;">Tipo</th><th style="padding:8px; text-align:left;">Descripción</th></tr></thead><tbody>`;
            resBitacora.rows.forEach(b => {
                const f = new Date(b.fecha).toLocaleDateString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' });
                let badge = b.tipo === 'Reporte' ? '🔴' : b.tipo === 'Felicitación' ? '🟢' : '🟡';
                html += `<tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:8px; text-align:center;">${f}</td><td style="padding:8px; text-align:center;"><strong>${badge} ${b.tipo}</strong></td><td style="padding:8px;">${b.descripcion}</td></tr>`;
            });
            html += `</tbody></table>`;
        }

        html += `<div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:20px;">
                     <a href="/descargar-boleta-pdf/${alumno.id}" style="background:#ef4444; color:white; padding:10px 20px; border-radius:6px; text-decoration:none; font-weight:bold;">📄 Descargar PDF Oficial</a>
                     <a href="/enviar-boleta-correo/${alumno.id}" style="background:#16a34a; color:white; padding:10px 20px; border-radius:6px; text-decoration:none; font-weight:bold;">📩 Enviar Boleta por Email</a>
                     <a href="/descargar-credencial-pdf/${alumno.id}" target="_blank" style="background:#0284c7; color:white; padding:10px 20px; border-radius:6px; text-decoration:none; font-weight:bold;">📇 Credencial QR</a>
                     <a href="/ver-alumnos" style="background:#64748b; color:white; padding:10px 20px; border-radius:6px; text-decoration:none; font-weight:bold;">Volver al Menú</a>
                 </div>
                 </main></body></html>`;
        res.send(html);
    } catch (err) { res.status(500).send('Error al cargar reporte.'); }
});

// GENERACIÓN PDF BOLETA EN SERVIDOR
app.get('/descargar-boleta-pdf/:id', verificarSesion, async (req, res) => {
    try {
        const idAlumno = req.params.id;
        const resAlumno = await pool.query('SELECT * FROM alumnos WHERE id = $1', [idAlumno]);
        if (resAlumno.rows.length === 0) return res.status(404).send('Alumno no encontrado');
        const alumno = resAlumno.rows[0];

        const resNotas = await pool.query('SELECT materia, parcial1, parcial2, parcial3, calificacion FROM calificaciones WHERE id_alumno = $1 ORDER BY materia ASC', [idAlumno]);

        const doc = new PDFDocument({ margin: 30, size: 'A4' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Boleta_${alumno.apellido}_${alumno.nombre}.pdf`);

        doc.pipe(res);

        doc.fillColor('#1e3a8a').fontSize(18).text('Escuela Secundaria Oficial No. 0829', { align: 'center' });
        doc.fillColor('#334155').fontSize(14).text('"Enrique C. Rébsamen"', { align: 'center' });
        doc.fontSize(10).text('Boleta Oficial de Calificaciones - Ciclo Escolar', { align: 'center' });
        doc.moveDown(1.5);

        doc.fillColor('#000000').fontSize(11).text(`Alumno: ${alumno.apellido}, ${alumno.nombre} | Tutor: ${alumno.tutor || 'N/D'}`);
        doc.text(`Grupo: ${alumno.grupo}  |  ID Estudiante: ${alumno.id}`);
        doc.moveDown(1);

        const tableData = {
            headers: ["Asignatura / Materia", "Parcial 1", "Parcial 2", "Parcial 3", "Promedio Final"],
            rows: resNotas.rows.map(n => [
                n.materia,
                String(n.parcial1 || '-'),
                String(n.parcial2 || '-'),
                String(n.parcial3 || '-'),
                String(n.calificacion || '0.00')
            ])
        };

        await doc.table(tableData, {
            prepareHeader: () => doc.font("Helvetica-Bold").fontSize(10).fillColor("#1e3a8a"),
            prepareRow: (row, i) => doc.font("Helvetica").fontSize(9).fillColor("#000000")
        });

        doc.moveDown(3);
        doc.text('____________________________________', { align: 'center' });
        doc.text('Firma y Sello de la Dirección Escolar', { align: 'center' });

        doc.end();
    } catch (err) {
        console.error("Error al generar PDF:", err);
        res.status(500).send('Error interno al generar el PDF.');
    }
});

// ==========================================
// 📇 FASE 1: GENERADOR DE CREDENCIAL CON QR (PDF) Y ESCÁNER
// ==========================================

app.get('/descargar-credencial-pdf/:id', verificarSesion, async (req, res) => {
    try {
        const idAlumno = req.params.id;
        const resAlumno = await pool.query('SELECT * FROM alumnos WHERE id = $1', [idAlumno]);
        
        if (resAlumno.rows.length === 0) return res.status(404).send('Alumno no encontrado');
        const alumno = resAlumno.rows[0];

        const qrData = JSON.stringify({ id: alumno.id, nombre: `${alumno.nombre} ${alumno.apellido}`, grupo: alumno.grupo, tutor: alumno.tutor, tel1: alumno.telefono1 });
        const qrImageBase64 = await QRCode.toDataURL(qrData);

        const doc = new PDFDocument({ size: [240, 380], margin: 15 });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=Credencial_${alumno.apellido}.pdf`);

        doc.pipe(res);

        doc.rect(5, 5, 230, 370).lineWidth(2).strokeColor('#1e3a8a').stroke();
        doc.rect(5, 5, 230, 60).fill('#1e3a8a');

        doc.fillColor('#ffffff').fontSize(10).text('ESCUELA SECUNDARIA NO. 0829', 10, 15, { align: 'center' });
        doc.fontSize(9).text('"ENRIQUE C. RÉBSAMEN"', 10, 30, { align: 'center' });
        doc.fontSize(7).text('CREDENCIAL ESTUDIANTIL', 10, 45, { align: 'center' });

        doc.moveDown(2);
        doc.fillColor('#334155').fontSize(11).text(`${alumno.apellido}`, 10, 80, { align: 'center' });
        doc.fontSize(10).text(`${alumno.nombre}`, 10, 95, { align: 'center' });

        doc.fillColor('#1e3a8a').fontSize(11).text(`GRUPO: ${alumno.grupo}`, 10, 115, { align: 'center' });
        doc.fillColor('#64748b').fontSize(8).text(`Tutor: ${alumno.tutor || 'N/D'}`, 10, 132, { align: 'center' });
        doc.text(`Emergencia: ${alumno.telefono1 || 'S/N'}`, 10, 144, { align: 'center' });

        const qrBuffer = Buffer.from(qrImageBase64.replace(/^data:image\/png;base64,/, ""), 'base64');
        doc.image(qrBuffer, 55, 160, { width: 130, height: 130 });

        doc.fillColor('#94a3b8').fontSize(7).text('Ciclo Escolar Vigente | Estado de México', 10, 345, { align: 'center' });

        doc.end();
    } catch (err) {
        console.error("Error al generar credencial:", err);
        res.status(500).send('Error interno generando la credencial.');
    }
});

// ==========================================
// 📇 GENERADOR MASIVO DE CREDENCIALES QR POR GRUPO (PDF)
// ==========================================

app.get('/descargar-credenciales-grupo-pdf/:grupo', verificarSesion, async (req, res) => {
    try {
        const grupoSeleccionado = req.params.grupo;
        const resAlumnos = await pool.query(
            'SELECT * FROM alumnos WHERE REPLACE(TRIM(grupo), \'"\', \'\') ILIKE $1 ORDER BY apellido ASC', 
            [grupoSeleccionado.replace(/"/g, '').trim()]
        );

        if (resAlumnos.rows.length === 0) {
            return res.status(404).send('<h1>No se encontraron alumnos en este grupo.</h1>');
        }

        const doc = new PDFDocument({ size: 'A4', margin: 30 });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=Credenciales_Grupo_${grupoSeleccionado}.pdf`);
        doc.pipe(res);

        doc.fillColor('#1e3a8a').fontSize(16).text(`Credenciales Estudiantiles - Grupo: ${grupoSeleccionado}`, { align: 'center' });
        doc.fontSize(10).fillColor('#64748b').text('Escuela Secundaria Oficial No. 0829 "Enrique C. Rébsamen"', { align: 'center' });
        doc.moveDown(1.5);

        let x = 40;
        let y = 100;
        const anchoCred = 240;
        const altoCred = 360;
        const margenX = 50;
        const margenY = 30;

        for (let i = 0; i < resAlumnos.rows.length; i++) {
            const alumno = resAlumnos.rows[i];

            if (y + altoCred > 800) {
                doc.addPage();
                y = 50;
                x = 40;
            }

            const qrData = JSON.stringify({ id: alumno.id, nombre: `${alumno.nombre} ${alumno.apellido}`, grupo: alumno.grupo, tutor: alumno.tutor, tel1: alumno.telefono1 });
            const qrImageBase64 = await QRCode.toDataURL(qrData);
            const qrBuffer = Buffer.from(qrImageBase64.replace(/^data:image\/png;base64,/, ""), 'base64');

            doc.rect(x, y, anchoCred, altoCred).lineWidth(1.5).strokeColor('#1e3a8a').stroke();
            doc.rect(x, y, anchoCred, 55).fill('#1e3a8a');

            doc.fillColor('#ffffff').fontSize(9).text('ESCUELA SECUNDARIA NO. 0829', x, y + 10, { width: anchoCred, align: 'center' });
            doc.fontSize(8).text('"ENRIQUE C. RÉBSAMEN"', x, y + 23, { width: anchoCred, align: 'center' });
            doc.fontSize(6).text('CREDENCIAL ESTUDIANTIL', x, y + 38, { width: anchoCred, align: 'center' });

            doc.fillColor('#334155').fontSize(10).text(`${alumno.apellido}`, x, y + 70, { width: anchoCred, align: 'center' });
            doc.fontSize(9).text(`${alumno.nombre}`, x, y + 83, { width: anchoCred, align: 'center' });

            doc.fillColor('#1e3a8a').fontSize(10).text(`GRUPO: ${alumno.grupo}`, x, y + 102, { width: anchoCred, align: 'center' });
            doc.fillColor('#64748b').fontSize(7).text(`Tutor: ${alumno.tutor || 'N/D'} | Tel: ${alumno.telefono1 || 'S/N'}`, x, y + 118, { width: anchoCred, align: 'center' });

            doc.image(qrBuffer, x + (anchoCred - 110) / 2, y + 135, { width: 110, height: 110 });

            doc.fillColor('#94a3b8').fontSize(6).text('Ciclo Escolar Vigente | Estado de México', x, y + 330, { width: anchoCred, align: 'center' });

            if (i % 2 === 0) {
                x += anchoCred + margenX;
            } else {
                x = 40;
                y += altoCred + margenY;
            }
        }

        doc.end();
    } catch (err) {
        console.error("Error generando credenciales masivas:", err);
        res.status(500).send('Error interno al generar PDF de credenciales.');
    }
});

app.get('/escaner', verificarSesion, (req, res) => {
    res.sendFile(path.join(__dirname, 'public/escaner.html'));
});

app.post('/guardar-asistencia-qr', verificarSesion, async (req, res) => {
    const { id_alumno } = req.body;
    try {
        const ahora = new Date();
        const horaActual = ahora.getHours() * 60 + ahora.getMinutes(); 
        const limiteMinutos = 8 * 60 + 10; 
        const estadoAsistencia = horaActual > limiteMinutos ? 'Retardo' : 'Asistencia';

        await pool.query(
            'INSERT INTO asistencias (id_alumno, estado, fecha) VALUES ($1, $2, CURRENT_DATE)', 
            [id_alumno, estadoAsistencia]
        );

        if (estadoAsistencia === 'Retardo' || estadoAsistencia === 'Falta') {
            const resAlumno = await pool.query('SELECT nombre, apellido, email, tutor FROM alumnos WHERE id = $1', [id_alumno]);
            if (resAlumno.rows.length > 0 && resAlumno.rows[0].email) {
                const alumno = resAlumno.rows[0];
                const horaStr = ahora.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
                
                const mailOptions = {
                    from: `"Escuela Enrique C. Rébsamen" <${process.env.EMAIL_USER}>`,
                    to: alumno.email,
                    subject: `⚠️ Alerta Escolar: Registro de ${estadoAsistencia}`,
                    html: `
                        <div style="font-family: 'Segoe UI', sans-serif; padding: 25px; border: 1px solid #cbd5e1; border-radius: 12px; max-width: 500px; background-color: #f8fafc;">
                            <h2 style="color: #1e3a8a; margin-top: 0;">Escuela Secundaria Oficial No. 0829</h2>
                            <h3 style="color: #ef4444;">Notificación de ${estadoAsistencia}</h3>
                            <p>Estimado Padre de Familia / Tutor (<strong>${alumno.tutor || 'N/D'}</strong>),</p>
                            <p>Le informamos que el alumno(a) <strong>${alumno.nombre} ${alumno.apellido}</strong> ha registrado una <strong>${estadoAsistencia}</strong> el día de hoy a las <strong>${horaStr} hrs</strong>.</p>
                            <p style="color: #64748b; font-size: 0.82rem;">Si considera que esto es un error, por favor comuníquese con la dirección escolar.</p>
                        </div>`
                };
                transportador.sendMail(mailOptions).catch(e => console.error("Error enviando correo de asistencia:", e));
            }
        }

        res.json({ 
            success: true, 
            message: `Asistencia guardada correctamente como: ${estadoAsistencia}` 
        });

    } catch (err) {
        console.error("Error asistencia QR con prórroga:", err);
        res.status(500).json({ success: false, message: 'Error en el servidor al guardar asistencia.' });
    }
});

// ==========================================
// 📅 MÓDULO DE ASISTENCIAS
// ==========================================

app.get('/registrar-asistencia', verificarSesion, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, nombre, apellido, grupo FROM alumnos ORDER BY grupo ASC, apellido ASC');
        
        let html = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="/style.css">
    <title>Pase de Lista - Enrique C. Rébsamen</title>
    <style>
        body { background-color: #f8fafc; font-family: 'Segoe UI', system-ui, sans-serif; margin: 0; padding: 25px; }
        .container { max-width: 950px; margin: 0 auto; }
        .header-panel { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 15px; }
        .header-panel h1 { color: #1e3a8a; margin: 0; font-size: 1.8rem; display: flex; align-items: center; gap: 10px; }
        .btn-header { padding: 9px 16px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 0.88rem; color: white; display: inline-flex; align-items: center; gap: 6px; }
        .btn-qr { background-color: #0284c7; }
        .btn-menu { background-color: #64748b; }
        .toolbar { background: white; padding: 18px 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.04); border: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; gap: 15px; margin-bottom: 20px; flex-wrap: wrap; }
        .toolbar-group { display: flex; align-items: center; gap: 10px; }
        .select-grupo { padding: 9px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-weight: bold; font-size: 0.95rem; color: #1e3a8a; outline: none; }
        .btn-fast { background: #dcfce7; color: #15803d; border: 1px solid #86efac; padding: 9px 15px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 0.88rem; transition: background 0.2s; }
        .btn-fast:hover { background: #bbf7d0; }
        .list-card { background: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; overflow: hidden; }
        .alumno-row { display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; border-bottom: 1px solid #f1f5f9; transition: background 0.15s; }
        .alumno-row:hover { background-color: #f8fafc; }
        .alumno-info { display: flex; align-items: center; gap: 12px; font-size: 0.95rem; color: #334155; }
        .badge-grupo { background: #1e3a8a; color: white; padding: 3px 8px; border-radius: 6px; font-size: 0.8rem; font-weight: bold; }
        .status-options { display: flex; gap: 8px; }
        .status-btn { position: relative; }
        .status-btn input[type="radio"] { position: absolute; opacity: 0; cursor: pointer; height: 0; width: 0; }
        .status-label { display: inline-block; padding: 7px 14px; border-radius: 20px; font-size: 0.82rem; font-weight: bold; cursor: pointer; border: 1px solid #cbd5e1; color: #64748b; background: #ffffff; user-select: none; transition: all 0.2s; }
        .status-btn input[value="Asistencia"]:checked + .status-label { background-color: #16a34a; color: white; border-color: #16a34a; box-shadow: 0 2px 6px rgba(22, 163, 74, 0.3); }
        .status-btn input[value="Falta"]:checked + .status-label { background-color: #ef4444; color: white; border-color: #ef4444; box-shadow: 0 2px 6px rgba(239, 68, 68, 0.3); }
        .status-btn input[value="Retardo"]:checked + .status-label { background-color: #eab308; color: white; border-color: #eab308; box-shadow: 0 2px 6px rgba(234, 179, 8, 0.3); }
        .btn-save-main { background-color: #16a34a; color: white; border: none; padding: 14px 25px; border-radius: 10px; font-size: 1.05rem; font-weight: bold; cursor: pointer; width: 100%; margin-top: 20px; box-shadow: 0 4px 12px rgba(22, 163, 74, 0.25); transition: background-color 0.2s; }
        .btn-save-main:hover { background-color: #15803d; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header-panel">
            <h1>📝 Pase de Lista Escolar</h1>
            <div style="display:flex; gap:10px;">
                <a href="/escaner" class="btn-header btn-qr">📷 Escáner QR</a>
                <a href="/menu" class="btn-header btn-menu">Volver al Menú</a>
            </div>
        </div>

        <form action="/guardar-asistencia" method="POST">
            <div class="toolbar">
                <div class="toolbar-group">
                    <label for="select-grupo" style="font-weight:bold; color:#1e3a8a;">Seleccionar Grupo:</label>
                    <select id="select-grupo" class="select-grupo" onchange="filtrarPorGrupo()">
                        <option value="">-- Todos los Grupos --</option>`;

        const gruposUnicos = [...new Set(result.rows.map(a => a.grupo.replace(/"/g, '').trim()))].sort();
        gruposUnicos.forEach(g => {
            html += `<option value="${g}">${g}</option>`;
        });

        html += `   </select>
                </div>

                <button type="button" class="btn-fast" onclick="marcarTodosPresentes()">
                    ✨ Marcar visibles como Presentes (✔️)
                </button>
            </div>

            <div class="list-card">`;

        result.rows.forEach((a) => {
            const grupoLimpio = a.grupo.replace(/"/g, '').trim();
            html += `
                <div class="alumno-row" data-grupo="${grupoLimpio}">
                    <div class="alumno-info">
                        <span class="badge-grupo">${a.grupo}</span>
                        <span style="text-transform: capitalize;"><strong>${a.apellido}</strong>, ${a.nombre}</span>
                        <input type="hidden" name="id_alumno" value="${a.id}">
                    </div>

                    <div class="status-options">
                        <label class="status-btn">
                            <input type="radio" name="estado_${a.id}" value="Asistencia" checked>
                            <span class="status-label">✔️ Asistencia</span>
                        </label>
                        <label class="status-btn">
                            <input type="radio" name="estado_${a.id}" value="Falta">
                            <span class="status-label">❌ Falta</span>
                        </label>
                        <label class="status-btn">
                            <input type="radio" name="estado_${a.id}" value="Retardo">
                            <span class="status-label">⏳ Retardo</span>
                        </label>
                    </div>
                </div>`;
        });

        html += `
            </div>
            <button type="submit" class="btn-save-main">Guardar Asistencia de la Sesión 💾</button>
        </form>
    </div>

    <script>
        function filtrarPorGrupo() {
            const grupoSeleccionado = document.getElementById('select-grupo').value.toLowerCase();
            const filas = document.querySelectorAll('.alumno-row');

            filas.forEach(fila => {
                const grupoFila = fila.getAttribute('data-grupo').toLowerCase();
                if (grupoSeleccionado === '' || grupoFila === grupoSeleccionado) {
                    fila.style.display = 'flex';
                } else {
                    fila.style.display = 'none';
                }
            });
        }

        function marcarTodosPresentes() {
            const filas = document.querySelectorAll('.alumno-row');
            filas.forEach(fila => {
                if (fila.style.display !== 'none') {
                    const radioAsistencia = fila.querySelector('input[value="Asistencia"]');
                    if (radioAsistencia) radioAsistencia.checked = true;
                }
            });
        }
    </script>
</body>
</html>`;

        res.send(html);
    } catch (err) { 
        console.error("Error cargando pase de lista:", err);
        res.status(500).send('Error al cargar pase de lista.'); 
    }
});

app.post('/guardar-asistencia', verificarSesion, async (req, res) => {
    const { id_alumno } = req.body;
    try {
        if (Array.isArray(id_alumno)) {
            for (let i = 0; i < id_alumno.length; i++) {
                const id = id_alumno[i];
                const est = req.body[`estado_${id}`] || (Array.isArray(req.body.estado) ? req.body.estado[i] : 'Asistencia');

                await pool.query('INSERT INTO asistencias (id_alumno, estado, fecha) VALUES ($1, $2, CURRENT_DATE)', [id, est]);

                if (est === 'Falta' || est === 'Retardo') {
                    const resAlumno = await pool.query('SELECT nombre, apellido, email, tutor FROM alumnos WHERE id = $1', [id]);
                    if (resAlumno.rows.length > 0 && resAlumno.rows[0].email) {
                        const alumno = resAlumno.rows[0];
                        const mailOptions = {
                            from: `"Escuela Enrique C. Rébsamen" <${process.env.EMAIL_USER}>`,
                            to: alumno.email,
                            subject: `⚠️ Alerta de Asistencia - Esc. Sec. No. 0829`,
                            html: `
                                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #cbd5e1; border-radius: 8px; max-width: 500px;">
                                    <h2 style="color: #1e3a8a;">Escuela Secundaria Oficial No. 0829</h2>
                                    <h3 style="color: #ef4444;">Notificación de ${est}</h3>
                                    <p>Estimado Padre de Familia / Tutor (<strong>${alumno.tutor || 'N/D'}</strong>),</p>
                                    <p>Le informamos que el alumno(a) <strong>${alumno.nombre} ${alumno.apellido}</strong> ha registrado una <strong>${est}</strong> el día de hoy (${new Date().toLocaleDateString('es-MX')}).</p>
                                    <p style="color: #64748b; font-size: 0.85rem;">Si considera que esto es un error, por favor comuníquese con la dirección escolar.</p>
                                </div>`
                        };
                        transportador.sendMail(mailOptions).catch(e => console.error("Error enviando correo de asistencia:", e));
                    }
                }
            }
        } else if (id_alumno) {
            const est = req.body[`estado_${id_alumno}`] || req.body.estado || 'Asistencia';
            await pool.query('INSERT INTO asistencias (id_alumno, estado, fecha) VALUES ($1, $2, CURRENT_DATE)', [id_alumno, est]);
        }

        res.send(generarPantallaExito({ 
            titulo: "Asistencia Guardada", 
            mensaje: "Lista del día sincronizada y alertas enviadas por correo.", 
            rutaRedireccion: "/ver-asistencias", 
            textoBotonPrimario: "Ver Historial" 
        }));
    } catch (err) { 
        console.error(err);
        res.status(500).send('Error al guardar la asistencia.'); 
    }
});

// ==========================================
// 📊 HISTORIAL DE ASISTENCIAS
// ==========================================

app.get('/ver-asistencias', verificarSesion, async (req, res) => {
    const { fecha_inicio, fecha_fin } = req.query;
    
    try {
        let queryText = `
            SELECT a.id, a.fecha, al.grupo, al.apellido, al.nombre, a.estado 
            FROM asistencias a 
            INNER JOIN alumnos al ON a.id_alumno = al.id
        `;
        const params = [];

        if (fecha_inicio && fecha_fin) {
            queryText += ` WHERE a.fecha BETWEEN $1 AND $2`;
            params.push(fecha_inicio, fecha_fin);
        } else if (fecha_inicio) {
            queryText += ` WHERE a.fecha >= $1`;
            params.push(fecha_inicio);
        } else if (fecha_fin) {
            queryText += ` WHERE a.fecha <= $1`;
            params.push(fecha_fin);
        }

        queryText += ` ORDER BY a.fecha DESC, al.grupo ASC, al.apellido ASC`;

        const result = await pool.query(queryText, params);
        
        let totalAsist = 0, totalFaltas = 0, totalRetardos = 0;
        result.rows.forEach(r => {
            if (r.estado === 'Asistencia') totalAsist++;
            else if (r.estado === 'Falta') totalFaltas++;
            else if (r.estado === 'Retardo') totalRetardos++;
        });

        const totalRegistros = result.rows.length;
        const porcAsistencia = totalRegistros > 0 ? ((totalAsist / totalRegistros) * 100).toFixed(1) : "0.0";
        const gruposUnicos = [...new Set(result.rows.map(r => r.grupo.replace(/"/g, '').trim()))].sort();

        let html = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="/style.css">
    <title>Historial de Asistencias - Enrique C. Rébsamen</title>
    <style>
        body { background-color: #f8fafc; font-family: 'Segoe UI', system-ui, sans-serif; margin: 0; padding: 25px; }
        .container { max-width: 1050px; margin: 0 auto; }
        .header-panel { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 15px; }
        .header-panel h1 { color: #1e3a8a; margin: 0; font-size: 1.8rem; display: flex; align-items: center; gap: 10px; }
        .btn-header { padding: 9px 16px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 0.88rem; color: white; transition: opacity 0.2s; }
        .btn-header:hover { opacity: 0.9; }
        .btn-qr { background-color: #0284c7; }
        .btn-excel { background-color: #16a34a; }
        .btn-pdf { background-color: #dc2626; }
        .btn-menu { background-color: #64748b; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; margin-bottom: 20px; }
        .stat-card { background: white; padding: 15px 20px; border-radius: 10px; border-left: 5px solid #3b82f6; box-shadow: 0 4px 10px rgba(0,0,0,0.04); border-top: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; }
        .stat-card.green { border-left-color: #16a34a; }
        .stat-card.red { border-left-color: #ef4444; }
        .stat-card.yellow { border-left-color: #eab308; }
        .stat-card span { font-size: 0.78rem; color: #64748b; font-weight: bold; text-transform: uppercase; }
        .stat-card p { font-size: 1.5rem; font-weight: bold; color: #0f172a; margin: 4px 0 0 0; }
        .toolbar { background: white; padding: 18px 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.04); border: 1px solid #e2e8f0; margin-bottom: 20px; }
        .form-filters { display: flex; gap: 12px; align-items: flex-end; flex-wrap: wrap; }
        .filter-field { display: flex; flex-direction: column; gap: 5px; }
        .filter-field label { font-size: 0.82rem; font-weight: bold; color: #1e3a8a; }
        .input-custom, .select-custom { padding: 9px 12px; border-radius: 8px; border: 1px solid #cbd5e1; outline: none; font-size: 0.9rem; }
        .input-custom:focus, .select-custom:focus { border-color: #3b82f6; }
        .table-card { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #1a2332; color: white; padding: 14px 16px; text-align: left; font-size: 0.88rem; text-transform: uppercase; letter-spacing: 0.5px; }
        td { padding: 12px 16px; border-bottom: 1px solid #f1f5f9; font-size: 0.92rem; color: #334155; vertical-align: middle; text-transform: capitalize; }
        tr:hover { background-color: #f8fafc; }
        .badge-status { padding: 5px 14px; border-radius: 20px; font-weight: bold; font-size: 0.82rem; display: inline-block; }
        .badge-asist { background-color: #dcfce7; color: #15803d; }
        .badge-falta { background-color: #fee2e2; color: #b91c1c; }
        .badge-retardo { background-color: #fef9c3; color: #a16207; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header-panel">
            <h1>📊 Historial de Asistencias</h1>
            <div style="display:flex; gap:8px; flex-wrap:wrap;">
                <a href="/escaner" class="btn-header btn-qr">📷 Escáner QR</a>
                <a href="/descargar-asistencias-excel" class="btn-header btn-excel">📊 Excel</a>
                <a href="/descargar-asistencias-pdf" target="_blank" class="btn-header btn-pdf">📄 PDF Reporte</a>
                <a href="/menu" class="btn-header btn-menu">Volver al Menú</a>
            </div>
        </div>

        <div class="stats-grid">
            <div class="stat-card green">
                <span>Asistencias</span>
                <p id="stat-asist">${totalAsist}</p>
            </div>
            <div class="stat-card red">
                <span>Faltas</span>
                <p id="stat-faltas">${totalFaltas}</p>
            </div>
            <div class="stat-card yellow">
                <span>Retardos</span>
                <p id="stat-retardos">${totalRetardos}</p>
            </div>
            <div class="stat-card">
                <span>% Cumplimiento</span>
                <p id="stat-porcentaje">${porcAsistencia}%</p>
            </div>
        </div>

        <div class="toolbar">
            <form action="/ver-asistencias" method="GET" class="form-filters">
                <div class="filter-field">
                    <label>Desde:</label>
                    <input type="date" name="fecha_inicio" value="${fecha_inicio || ''}" class="input-custom">
                </div>
                <div class="filter-field">
                    <label>Hasta:</label>
                    <input type="date" name="fecha_fin" value="${fecha_fin || ''}" class="input-custom">
                </div>
                <button type="submit" class="btn-header" style="background:#1e3a8a; border:none; cursor:pointer; height:38px;">🔍 Filtrar Fecha</button>
                <a href="/ver-asistencias" class="btn-header" style="background:#94a3b8; height:20px; display:inline-flex; align-items:center;">Limpiar Fechas</a>
            </form>

            <div style="display:flex; gap:10px; margin-top:15px; flex-wrap:wrap;">
                <input type="text" id="input-buscar" class="input-custom" style="flex:1; min-width:200px;" placeholder="🔍 Buscar por nombre del alumno..." onkeyup="filtrarTablaLocal()">
                
                <select id="select-grupo" class="select-custom" onchange="filtrarTablaLocal()">
                    <option value="">-- Todos los Grupos --</option>`;
        gruposUnicos.forEach(g => {
            html += `<option value="${g}">${g}</option>`;
        });
        html += `   </select>

                <select id="select-estado" class="select-custom" onchange="filtrarTablaLocal()">
                    <option value="">-- Todos los Estados --</option>
                    <option value="Asistencia">✔️ Asistencia</option>
                    <option value="Falta">❌ Falta</option>
                    <option value="Retardo">⏳ Retardo</option>
                </select>
            </div>
        </div>

        <div class="table-card">
            <table>
                <thead>
                    <tr>
                        <th style="width: 15%;">Fecha</th>
                        <th style="width: 12%; text-align: center;">Grupo</th>
                        <th>Alumno</th>
                        <th style="width: 20%; text-align: center;">Estado</th>
                    </tr>
                </thead>
                <tbody id="tabla-body">`;

        if (result.rows.length === 0) {
            html += `<tr><td colspan="4" style="text-align:center; color:#94a3b8; padding:30px;">No se encontraron registros de asistencia.</td></tr>`;
        } else {
            result.rows.forEach(row => {
                const fechaFmt = new Date(row.fecha).toLocaleDateString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' });
                const grupoLimpio = row.grupo.replace(/"/g, '').trim();

                let badgeClass = 'badge-asist';
                let iconClass = '✔️';
                if (row.estado === 'Falta') { badgeClass = 'badge-falta'; iconClass = '❌'; }
                else if (row.estado === 'Retardo') { badgeClass = 'badge-retardo'; iconClass = '⏳'; }

                html += `<tr class="fila-asistencia" data-grupo="${grupoLimpio}" data-estado="${row.estado}">
                    <td>${fechaFmt}</td>
                    <td style="text-align: center;"><strong>${row.grupo}</strong></td>
                    <td><strong>${row.apellido}</strong>, ${row.nombre}</td>
                    <td style="text-align: center;">
                        <span class="badge-status ${badgeClass}">${iconClass} ${row.estado}</span>
                    </td>
                </tr>`;
            });
        }

        html += `   </tbody>
            </table>
        </div>
    </div>

    <script>
        function filtrarTablaLocal() {
            const busqueda = document.getElementById('input-buscar').value.toLowerCase();
            const grupoFiltro = document.getElementById('select-grupo').value.toLowerCase();
            const estadoFiltro = document.getElementById('select-estado').value.toLowerCase();

            const filas = document.querySelectorAll('.fila-asistencia');
            let cAsist = 0, cFaltas = 0, cRetardos = 0, cTotal = 0;

            filas.forEach(fila => {
                const texto = fila.textContent.toLowerCase();
                const grupo = fila.getAttribute('data-grupo').toLowerCase();
                const estado = fila.getAttribute('data-estado').toLowerCase();

                const coincideBusqueda = texto.includes(busqueda);
                const coincideGrupo = grupoFiltro === '' || grupo === grupoFiltro;
                const coincideEstado = estadoFiltro === '' || estado === estadoFiltro;

                if (coincideBusqueda && coincideGrupo && coincideEstado) {
                    fila.style.display = '';
                    cTotal++;
                    if (estado.includes('asistencia')) cAsist++;
                    else if (estado.includes('falta')) cFaltas++;
                    else if (estado.includes('retardo')) cRetardos++;
                } else {
                    fila.style.display = 'none';
                }
            });

            document.getElementById('stat-asist').textContent = cAsist;
            document.getElementById('stat-faltas').textContent = cFaltas;
            document.getElementById('stat-retardos').textContent = cRetardos;
            document.getElementById('stat-porcentaje').textContent = cTotal > 0 ? ((cAsist / cTotal) * 100).toFixed(1) + '%' : '0.0%';
        }
    </script>
</body>
</html>`;
        res.send(html);
    } catch (err) {
        console.error("❌ Error en historial de asistencias:", err);
        res.status(500).send('Error al cargar asistencias.');
    }
});

app.get('/descargar-asistencias-pdf', verificarSesion, async (req, res) => {
    try {
        const queryText = `
            SELECT a.fecha, al.grupo, al.apellido, al.nombre, a.estado 
            FROM asistencias a 
            INNER JOIN alumnos al ON a.id_alumno = al.id 
            ORDER BY a.fecha DESC, al.grupo ASC, al.apellido ASC 
            LIMIT 100
        `;
        const result = await pool.query(queryText);

        const doc = new PDFDocument({ margin: 30, size: 'A4' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename=Reporte_Asistencias.pdf');

        doc.pipe(res);

        doc.fillColor('#1e3a8a').fontSize(16).text('Escuela Secundaria Oficial No. 0829', { align: 'center' });
        doc.fillColor('#334155').fontSize(12).text('"Enrique C. Rébsamen"', { align: 'center' });
        doc.fontSize(10).text('Reporte Oficial de Asistencias Registradas', { align: 'center' });
        doc.moveDown(1.5);

        const tableData = {
            headers: ["Fecha", "Grupo", "Alumno", "Estatus"],
            rows: result.rows.map(r => [
                new Date(r.fecha).toLocaleDateString('es-MX'),
                r.grupo,
                `${r.apellido}, ${r.nombre}`,
                r.estado
            ])
        };

        await doc.table(tableData, {
            prepareHeader: () => doc.font("Helvetica-Bold").fontSize(9).fillColor("#1e3a8a"),
            prepareRow: () => doc.font("Helvetica").fontSize(8).fillColor("#000000")
        });

        doc.end();
    } catch (err) {
        console.error("Error generando PDF de asistencias:", err);
        res.status(500).send('Error generando PDF.');
    }
});

app.get('/descargar-asistencias-excel', verificarSesion, async (req, res) => {
    try {
        const queryText = `SELECT a.fecha, al.grupo, al.apellido, al.nombre, al.estado FROM asistencias a INNER JOIN alumnos al ON a.id_alumno = al.id ORDER BY a.fecha DESC`;
        const result = await pool.query(queryText);
        const libro = new ExcelJS.Workbook();
        const hoja = libro.addWorksheet('Asistencias');
        hoja.columns = [{ header: 'Fecha', key: 'fecha', width: 15 }, { header: 'Grupo', key: 'grupo', width: 12 }, { header: 'Alumno', key: 'alumno', width: 30 }, { header: 'Estado', key: 'estado', width: 15 }];
        result.rows.forEach(r => { hoja.addRow({ fecha: new Date(r.fecha).toLocaleDateString(), grupo: r.grupo, alumno: `${r.apellido}, ${r.nombre}`, estado: r.estado }); });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=Asistencias.xlsx');
        await libro.xlsx.write(res); res.end();
    } catch (err) { res.status(500).send('Error.'); }
});

// ==========================================
// 📊 MÓDULO DE CALIFICACIONES
// ==========================================

app.get('/calificaciones', verificarSesion, (req, res) => {
    res.sendFile(path.join(__dirname, 'public/calificaciones.html'));
});

app.post('/guardar-calificacion', verificarSesion, async (req, res) => {
    const { id_alumno, materia, parcial1, parcial2, parcial3 } = req.body;
    
    const p1 = (parcial1 !== '' && parcial1 !== undefined && parcial1 !== null) ? parseFloat(parcial1) : null;
    const p2 = (parcial2 !== '' && parcial2 !== undefined && parcial2 !== null) ? parseFloat(parcial2) : null;
    const p3 = (parcial3 !== '' && parcial3 !== undefined && parcial3 !== null) ? parseFloat(parcial3) : null;

    const notasValidas = [p1, p2, p3].filter(n => n !== null && !isNaN(n));
    if (notasValidas.length === 0) {
        return res.status(400).send('<h1>Error: Debes ingresar al menos una calificación en P1, P2 o P3.</h1><a href="/calificaciones">Volver a intentar</a>');
    }

    const promedioFinal = (notasValidas.reduce((a, b) => a + b, 0) / notasValidas.length).toFixed(2);

    try {
        const existeReg = await pool.query(
            'SELECT id FROM calificaciones WHERE id_alumno = $1 AND TRIM(materia) = TRIM($2)',
            [id_alumno, materia]
        );

        if (existeReg.rows.length > 0) {
            const updateQuery = `
                UPDATE calificaciones 
                SET parcial1 = COALESCE($1, parcial1), 
                    parcial2 = COALESCE($2, parcial2), 
                    parcial3 = COALESCE($3, parcial3), 
                    calificacion = $4 
                WHERE id = $5
            `;
            await pool.query(updateQuery, [p1, p2, p3, promedioFinal, existeReg.rows[0].id]);
        } else {
            const insertQuery = `
                INSERT INTO calificaciones (id_alumno, materia, parcial1, parcial2, parcial3, calificacion) 
                VALUES ($1, $2, $3, $4, $5, $6)
            `;
            await pool.query(insertQuery, [id_alumno, materia, p1, p2, p3, promedioFinal]);
        }
        
        // 📧 FASE 2: Enviar notificación automática de calificaciones por correo
        try {
            const resAlumnoEmail = await pool.query('SELECT nombre, apellido, email FROM alumnos WHERE id = $1', [id_alumno]);
            if (resAlumnoEmail.rows.length > 0 && resAlumnoEmail.rows[0].email) {
                const alumnoInfo = resAlumnoEmail.rows[0];
                const mailCalificacionOptions = {
                    from: `"Escuela Enrique C. Rébsamen" <${process.env.EMAIL_USER}>`,
                    to: alumnoInfo.email,
                    subject: `📊 Actualización de Calificación - Asignatura: ${materia}`,
                    html: `
                        <div style="font-family: 'Segoe UI', sans-serif; padding: 25px; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 500px; background-color: #f8fafc;">
                            <h2 style="color: #1e3a8a; margin-top: 0;">Escuela Secundaria Oficial No. 0829</h2>
                            <h3 style="color: #334155;">Aviso de Calificación Parcial</h3>
                            <p>Estimado Alumno / Padre de Familia,</p>
                            <p>Le informamos que se ha registrado una actualización en las calificaciones del alumno(a) <strong>${alumnoInfo.nombre} ${alumnoInfo.apellido}</strong>.</p>
                            
                            <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #cbd5e1; margin: 15px 0;">
                                <p style="margin: 5px 0;">📚 <strong>Materia:</strong> ${materia}</p>
                                <p style="margin: 5px 0;">🔹 <strong>Parcial 1:</strong> ${p1 !== null ? p1 : '-'}</p>
                                <p style="margin: 5px 0;">🔹 <strong>Parcial 2:</strong> ${p2 !== null ? p2 : '-'}</p>
                                <p style="margin: 5px 0;">🔹 <strong>Parcial 3:</strong> ${p3 !== null ? p3 : '-'}</p>
                                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 10px 0;">
                                <p style="margin: 5px 0; color: #1e3a8a; font-weight: bold;">📈 Promedio Parcial: ${promedioFinal}</p>
                            </div>

                            <p style="color: #64748b; font-size: 0.82rem;">Este es un mensaje automático generado por el Sistema de Control Escolar. Por favor, no responda a este correo.</p>
                        </div>`
                };
                transportador.sendMail(mailCalificacionOptions).catch(errMail => {
                    console.error("⚠️ Error al enviar correo de calificación automática:", errMail);
                });
            }
        } catch (errEmail) {
            console.error("Error buscando datos para correo de notas:", errEmail);
        }

        res.send(generarPantallaExito({
            titulo: "Calificación Registrada",
            mensaje: `<div style="background:#f0fdf4; border:1px solid #bbf7d0; padding:15px; border-radius:6px; color:#166534;">
                        <strong>Estatus de la materia:</strong><br>
                        🔹 Parcial 1: ${p1 !== null ? p1 : 'Pendiente'}<br>
                        🔹 Parcial 2: ${p2 !== null ? p2 : 'Pendiente'}<br>
                        🔹 Parcial 3: ${p3 !== null ? p3 : 'Pendiente'}<br>
                        📈 <strong>Promedio Parcial Calculado: ${promedioFinal}</strong>
                      </div>`,
            rutaRedireccion: "/calificaciones",
            textoBotonPrimario: "Registrar otra calificación"
        }));
    } catch (err) {
        console.error("❌ Error guardando calificación:", err);
        res.status(500).send('Error interno al guardar la calificación.');
    }
});

app.post('/api/guardar-calificaciones-masivo', verificarSesion, async (req, res) => {
    const { calificaciones } = req.body;

    if (!Array.isArray(calificaciones) || calificaciones.length === 0) {
        return res.status(400).json({ success: false, message: 'No hay datos para guardar.' });
    }

    const clienteBD = await pool.connect();

    try {
        await clienteBD.query('BEGIN');
        let contadorProcesados = 0;

        for (const item of calificaciones) {
            const { id_alumno, materia, parcial1, parcial2, parcial3 } = item;

            const p1 = parcial1 !== null && !isNaN(parcial1) ? parseFloat(parcial1) : null;
            const p2 = parcial2 !== null && !isNaN(parcial2) ? parseFloat(parcial2) : null;
            const p3 = parcial3 !== null && !isNaN(parcial3) ? parseFloat(parcial3) : null;

            const notasValidas = [p1, p2, p3].filter(n => n !== null);
            if (notasValidas.length === 0) continue;

            const promedioFinal = (notasValidas.reduce((a, b) => a + b, 0) / notasValidas.length).toFixed(2);

            const existeReg = await clienteBD.query(
                'SELECT id FROM calificaciones WHERE id_alumno = $1 AND TRIM(materia) = TRIM($2)',
                [id_alumno, materia]
            );

            if (existeReg.rows.length > 0) {
                await clienteBD.query(`
                    UPDATE calificaciones 
                    SET parcial1 = COALESCE($1, parcial1), 
                        parcial2 = COALESCE($2, parcial2), 
                        parcial3 = COALESCE($3, parcial3), 
                        calificacion = $4 
                    WHERE id = $5
                `, [p1, p2, p3, promedioFinal, existeReg.rows[0].id]);
            } else {
                await clienteBD.query(`
                    INSERT INTO calificaciones (id_alumno, materia, parcial1, parcial2, parcial3, calificacion) 
                    VALUES ($1, $2, $3, $4, $5, $6)
                `, [id_alumno, materia, p1, p2, p3, promedioFinal]);
            }

            // 📧 Notificación automática por correo en el guardado masivo
            try {
                const resAlumnoEmail = await clienteBD.query('SELECT nombre, apellido, email FROM alumnos WHERE id = $1', [id_alumno]);
                if (resAlumnoEmail.rows.length > 0 && resAlumnoEmail.rows[0].email) {
                    const alumnoInfo = resAlumnoEmail.rows[0];
                    const mailCalificacionOptions = {
                        from: `"Escuela Enrique C. Rébsamen" <${process.env.EMAIL_USER}>`,
                        to: alumnoInfo.email,
                        subject: `📊 Actualización de Calificación - Asignatura: ${materia}`,
                        html: `
                            <div style="font-family: 'Segoe UI', sans-serif; padding: 25px; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 500px; background-color: #f8fafc;">
                                <h2 style="color: #1e3a8a; margin-top: 0;">Escuela Secundaria Oficial No. 0829</h2>
                                <h3 style="color: #334155;">Aviso de Calificación Parcial</h3>
                                <p>Estimado Alumno / Padre de Familia,</p>
                                <p>Le informamos que se ha registrado una actualización en las calificaciones del alumno(a) <strong>${alumnoInfo.nombre} ${alumnoInfo.apellido}</strong>.</p>
                                
                                <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #cbd5e1; margin: 15px 0;">
                                    <p style="margin: 5px 0;">📚 <strong>Materia:</strong> ${materia}</p>
                                    <p style="margin: 5px 0;">🔹 <strong>Parcial 1:</strong> ${p1 !== null ? p1 : '-'}</p>
                                    <p style="margin: 5px 0;">🔹 <strong>Parcial 2:</strong> ${p2 !== null ? p2 : '-'}</p>
                                    <p style="margin: 5px 0;">🔹 <strong>Parcial 3:</strong> ${p3 !== null ? p3 : '-'}</p>
                                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 10px 0;">
                                    <p style="margin: 5px 0; color: #1e3a8a; font-weight: bold;">📈 Promedio Parcial: ${promedioFinal}</p>
                                </div>

                                <p style="color: #64748b; font-size: 0.82rem;">Este es un mensaje automático generado por el Sistema de Control Escolar.</p>
                            </div>`
                    };
                    transportador.sendMail(mailCalificacionOptions).catch(errMail => {
                        console.error("⚠️ Error al enviar correo masivo de calificación:", errMail);
                    });
                }
            } catch (errEmail) {
                console.error("Error procesando correo masivo:", errEmail);
            }

            contadorProcesados++;
        }

        await clienteBD.query('COMMIT');
        res.json({ success: true, procesados: contadorProcesados });

    } catch (err) {
        await clienteBD.query('ROLLBACK');
        console.error("❌ Error en captura masiva de calificaciones:", err);
        res.status(500).json({ success: false, message: 'Error en el servidor al guardar datos masivos.' });
    } finally {
        clienteBD.release();
    }
});

// VISTA CONCENTRADO DE CALIFICACIONES (CON BOTONES EXCEL Y PDF)
app.get('/ver-calificaciones', verificarSesion, async (req, res) => {
    try {
        const queryText = `
            SELECT a.grupo, a.apellido, a.nombre, c.materia, c.parcial1, c.parcial2, c.parcial3, c.calificacion 
            FROM calificaciones c INNER JOIN alumnos a ON c.id_alumno = a.id
            ORDER BY a.grupo ASC, a.apellido ASC, c.materia ASC
        `;
        const result = await pool.query(queryText);
        
        const gruposUnicos = [...new Set(result.rows.map(c => c.grupo.replace(/"/g, '').trim()))].sort();

        let html = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="/style.css">
    <title>Concentrado de Evaluaciones - Enrique C. Rébsamen</title>
    <style>
        body { background-color: #f8fafc; font-family: 'Segoe UI', system-ui, sans-serif; margin: 0; padding: 25px; }
        .container { max-width: 1100px; margin: 0 auto; }
        
        .header-panel { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 15px; }
        .header-panel h1 { color: #1e3a8a; margin: 0; font-size: 1.8rem; display: flex; align-items: center; gap: 10px; }
        
        .btn-header { padding: 9px 16px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 0.88rem; color: white; transition: opacity 0.2s; display: inline-flex; align-items: center; gap: 6px; }
        .btn-header:hover { opacity: 0.9; }
        .btn-excel { background-color: #16a34a; }
        .btn-pdf { background-color: #dc2626; }
        .btn-menu { background-color: #64748b; }

        .toolbar { background: white; padding: 18px 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.04); border: 1px solid #e2e8f0; display: flex; gap: 15px; margin-bottom: 20px; flex-wrap: wrap; align-items: center; }
        .search-input, .select-filter { padding: 9px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem; outline: none; transition: border-color 0.2s; }
        .search-input { flex: 1; min-width: 220px; }
        .search-input:focus, .select-filter:focus { border-color: #3b82f6; }

        .table-card { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #1a2332; color: white; padding: 14px 16px; text-align: left; font-size: 0.88rem; text-transform: uppercase; letter-spacing: 0.5px; }
        td { padding: 12px 16px; border-bottom: 1px solid #f1f5f9; font-size: 0.92rem; color: #334155; vertical-align: middle; }
        tr:hover { background-color: #f8fafc; }
        
        .badge-nota { padding: 4px 10px; border-radius: 6px; font-weight: bold; font-size: 0.88rem; display: inline-block; }
        .nota-alta { background-color: #dcfce7; color: #15803d; }
        .nota-media { background-color: #fef9c3; color: #a16207; }
        .nota-baja { background-color: #fee2e2; color: #b91c1c; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header-panel">
            <h1>📊 Concentrado de Evaluaciones por Parcial</h1>
            <div style="display:flex; gap:8px; flex-wrap:wrap;">
                <a href="/descargar-calificaciones-excel" class="btn-header btn-excel">📊 Exportar Excel</a>
                <a href="/descargar-calificaciones-pdf" target="_blank" class="btn-header btn-pdf">📄 Exportar PDF</a>
                <a href="/menu" class="btn-header btn-menu">Volver al Menú</a>
            </div>
        </div>

        <div class="toolbar">
            <input type="text" id="input-buscar" class="search-input" placeholder="🔍 Buscar por alumno o materia..." onkeyup="filtrarTabla()">
            <select id="select-grupo" class="select-filter" onchange="filtrarTabla()">
                <option value="">-- Todos los Grupos --</option>`;
        
        gruposUnicos.forEach(g => {
            html += `<option value="${g}">${g}</option>`;
        });

        html += `   </select>
        </div>

        <div class="table-card">
            <table>
                <thead>
                    <tr>
                        <th style="width: 10%; text-align: center;">Grupo</th>
                        <th style="width: 30%;">Alumno</th>
                        <th style="width: 25%;">Materia</th>
                        <th style="text-align: center;">P1</th>
                        <th style="text-align: center;">P2</th>
                        <th style="text-align: center;">P3</th>
                        <th style="text-align: center; width: 12%;">Final</th>
                    </tr>
                </thead>
                <tbody id="tabla-body">`;

        if (result.rows.length === 0) {
            html += `<tr><td colspan="7" style="text-align:center; color:#94a3b8; padding:30px;">No hay evaluaciones registradas.</td></tr>`;
        } else {
            result.rows.forEach(c => {
                const grupoLimpio = c.grupo.replace(/"/g, '').trim();
                const prom = parseFloat(c.calificacion || 0);

                let claseBadge = 'nota-alta';
                if (prom < 6.0) claseBadge = 'nota-baja';
                else if (prom < 8.0) claseBadge = 'nota-media';

                html += `
                    <tr class="fila-nota" data-grupo="${grupoLimpio}">
                        <td style="text-align: center;"><strong>${c.grupo}</strong></td>
                        <td style="text-transform: capitalize;"><strong>${c.apellido}</strong>, ${c.nombre}</td>
                        <td>${c.materia}</td>
                        <td style="text-align: center;">${c.parcial1 || '-'}</td>
                        <td style="text-align: center;">${c.parcial2 || '-'}</td>
                        <td style="text-align: center;">${c.parcial3 || '-'}</td>
                        <td style="text-align: center;">
                            <span class="badge-nota ${claseBadge}">${c.calificacion || '0.00'}</span>
                        </td>
                    </tr>`;
            });
        }

        html += `
                </tbody>
            </table>
        </div>
    </div>

    <script>
        function filtrarTabla() {
            const busqueda = document.getElementById('input-buscar').value.toLowerCase();
            const grupoFiltro = document.getElementById('select-grupo').value.toLowerCase();
            const filas = document.querySelectorAll('.fila-nota');

            filas.forEach(fila => {
                const texto = fila.textContent.toLowerCase();
                const grupo = fila.getAttribute('data-grupo').toLowerCase();

                const coincideBusqueda = texto.includes(busqueda);
                const coincideGrupo = grupoFiltro === '' || grupo === grupoFiltro;

                if (coincideBusqueda && coincideGrupo) {
                    fila.style.display = '';
                } else {
                    fila.style.display = 'none';
                }
            });
        }
    </script>
</body>
</html>`;
        res.send(html);
    } catch (err) { 
        console.error("❌ Error al cargar calificaciones:", err);
        res.status(500).send('Error al cargar calificaciones.'); 
    }
});

// ENDPOINT EXPORTAR CALIFICACIONES A EXCEL
app.get('/descargar-calificaciones-excel', verificarSesion, async (req, res) => {
    try {
        const queryText = `
            SELECT a.grupo, a.apellido, a.nombre, c.materia, c.parcial1, c.parcial2, c.parcial3, c.calificacion 
            FROM calificaciones c INNER JOIN alumnos a ON c.id_alumno = a.id
            ORDER BY a.grupo ASC, a.apellido ASC, c.materia ASC
        `;
        const result = await pool.query(queryText);

        const libro = new ExcelJS.Workbook();
        const hoja = libro.addWorksheet('Concentrado de Calificaciones');

        hoja.columns = [
            { header: 'Grupo', key: 'grupo', width: 12 },
            { header: 'Apellido', key: 'apellido', width: 20 },
            { header: 'Nombre', key: 'nombre', width: 20 },
            { header: 'Materia', key: 'materia', width: 25 },
            { header: 'Parcial 1', key: 'parcial1', width: 12 },
            { header: 'Parcial 2', key: 'parcial2', width: 12 },
            { header: 'Parcial 3', key: 'parcial3', width: 12 },
            { header: 'Promedio Final', key: 'calificacion', width: 15 }
        ];

        result.rows.forEach(r => {
            hoja.addRow({
                grupo: r.grupo,
                apellido: r.apellido,
                nombre: r.nombre,
                materia: r.materia,
                parcial1: r.parcial1 || '-',
                parcial2: r.parcial2 || '-',
                parcial3: r.parcial3 || '-',
                calificacion: r.calificacion || '0.00'
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=Concentrado_Calificaciones.xlsx');

        await libro.xlsx.write(res);
        res.end();
    } catch (err) {
        console.error("Error al generar Excel de calificaciones:", err);
        res.status(500).send('Error generando archivo Excel.');
    }
});

// ENDPOINT EXPORTAR CALIFICACIONES A PDF
app.get('/descargar-calificaciones-pdf', verificarSesion, async (req, res) => {
    try {
        const queryText = `
            SELECT a.grupo, a.apellido, a.nombre, c.materia, c.parcial1, c.parcial2, c.parcial3, c.calificacion 
            FROM calificaciones c INNER JOIN alumnos a ON c.id_alumno = a.id
            ORDER BY a.grupo ASC, a.apellido ASC, c.materia ASC
        `;
        const result = await pool.query(queryText);

        const doc = new PDFDocument({ margin: 30, size: 'A4' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename=Concentrado_Calificaciones.pdf');

        doc.pipe(res);

        // Membrete
        doc.fillColor('#1e3a8a').fontSize(16).text('Escuela Secundaria Oficial No. 0829', { align: 'center' });
        doc.fillColor('#334155').fontSize(12).text('"Enrique C. Rébsamen"', { align: 'center' });
        doc.fontSize(10).text('Concentrado Oficial de Calificaciones por Parcial', { align: 'center' });
        doc.moveDown(1.5);

        const tableData = {
            headers: ["Grupo", "Alumno", "Materia", "P1", "P2", "P3", "Final"],
            rows: result.rows.map(r => [
                r.grupo,
                `${r.apellido}, ${r.nombre}`,
                r.materia,
                String(r.parcial1 || '-'),
                String(r.parcial2 || '-'),
                String(r.parcial3 || '-'),
                String(r.calificacion || '0.00')
            ])
        };

        await doc.table(tableData, {
            prepareHeader: () => doc.font("Helvetica-Bold").fontSize(9).fillColor("#1e3a8a"),
            prepareRow: () => doc.font("Helvetica").fontSize(8).fillColor("#000000")
        });

        doc.end();
    } catch (err) {
        console.error("Error al generar PDF de calificaciones:", err);
        res.status(500).send('Error generando archivo PDF.');
    }
});

// ==========================================
// 📊 MÓDULO 3: REPORTES DE PROMEDIOS POR GRUPO
// ==========================================

app.get('/reporte-grupo-seleccion', verificarSesion, async (req, res) => {
    try {
        const result = await pool.query('SELECT DISTINCT TRIM(grupo) as grupo FROM alumnos ORDER BY grupo ASC');
        let html = `<!DOCTYPE html><html lang="es"><head><link rel="stylesheet" href="style.css"><title>Reportes</title></head><body>
                    <div style="background:white; padding:40px; border-radius:12px; max-width:400px; margin:100px auto; box-shadow:0 4px 15px rgba(0,0,0,0.1); text-align:center;">
                    <h2>📊 Concentrado por Grupo</h2><form action="/reporte-grupo-resultado" method="GET"><select name="grupo" style="width:100%; padding:10px; margin-bottom:20px;">`;
        result.rows.forEach(row => { html += `<option value="${row.grupo.replace(/"/g, '')}">${row.grupo}</option>`; });
        html += `</select><button type="submit" style="background:#1a2332; color:white; padding:10px 20px; border:none; width:100%; font-weight:bold;">Generar Reporte</button></form></div></body></html>`;
        res.send(html);
    } catch (err) { res.status(500).send('Error'); }
});

app.get('/reporte-grupo-resultado', verificarSesion, async (req, res) => {
    const grupoSeleccionado = req.query.grupo;
    if (!grupoSeleccionado) return res.redirect('/reporte-grupo-seleccion');

    try {
        const queryText = `
            SELECT TRIM(c.materia) as materia, 
                   ROUND(AVG(c.calificacion), 2) as promedio_materia,
                   COUNT(c.calificacion) as evaluaciones_contadas
            FROM calificaciones c
            INNER JOIN alumnos a ON c.id_alumno = a.id
            WHERE REPLACE(TRIM(a.grupo), '"', '') ILIKE $1
            GROUP BY TRIM(c.materia)
            ORDER BY materia ASC
        `;
        
        const terminoBusqueda = `%${grupoSeleccionado.replace(/"/g, '').trim()}%`;
        const result = await pool.query(queryText, [terminoBusqueda]);

        let html = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="/style.css">
    <title>Resultados Grupo ${grupoSeleccionado} - Enrique C. Rébsamen</title>
</head>
<body>
    <main class="main-content" style="max-width: 850px; margin: 30px auto;">
        <h1 style="color: #ffffff; text-shadow: 1px 1px 3px rgba(0,0,0,0.3);">Concentrado: Grupo ${grupoSeleccionado}</h1>
        <p style="color: #f1f5f9; margin-bottom: 20px;">Análisis de desempeño y alertas preventivas por asignatura</p>
        
        <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
            <thead>
                <tr style="background-color: #1e3a8a; color: white;">
                    <th style="padding: 12px; text-align: left;">Asignatura / Materia</th>
                    <th style="padding: 12px; text-align: center;">Alumnos Evaluados</th>
                    <th style="padding: 12px; text-align: center;">Promedio General</th>
                    <th style="padding: 12px; text-align: center;">Estatus del Grupo</th>
                </tr>
            </thead>
            <tbody>`;

        if (result.rows.length === 0) {
            html += `<tr><td colspan="4" style="text-align:center; color:#94a3b8; padding: 25px;">
                        ⚠️ No se encontraron calificaciones para el grupo "${grupoSeleccionado}".
                    </td></tr>`;
        } else {
            result.rows.forEach(row => {
                const prom = parseFloat(row.promedio_materia);
                let colorFondo = '#dcfce7';
                let colorTexto = '#15803d';
                let textoEstatus = '🟢 Óptimo';

                if (prom < 6.0) {
                    colorFondo = '#fee2e2';
                    colorTexto = '#b91c1c';
                    textoEstatus = '🔴 En Riesgo';
                } else if (prom < 8.0) {
                    colorFondo = '#fef9c3';
                    colorTexto = '#a16207';
                    textoEstatus = '🟡 Regular';
                }

                html += `<tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 12px;"><strong>${row.materia}</strong></td>
                    <td style="padding: 12px; text-align: center;">${row.evaluaciones_contadas} alumnos</td>
                    <td style="padding: 12px; text-align: center; font-weight: bold; font-size: 1.05rem;">${row.promedio_materia}</td>
                    <td style="padding: 12px; text-align: center;">
                        <span style="background-color: ${colorFondo}; color: ${colorTexto}; padding: 4px 12px; border-radius: 12px; font-weight: bold; font-size: 0.85rem;">
                            ${textoEstatus}
                        </span>
                    </td>
                </tr>`;
            });
        }

        html += `   </tbody>
        </table>
        <br>
        <div style="display:flex; gap:15px;">
            <a href="/reporte-grupo-seleccion" style="background:#1e3a8a; color:white; text-decoration:none; padding:10px 20px; border-radius:6px; font-weight:bold;">Consultar otro grupo</a>
            <a href="/menu" style="background:#64748b; color:white; text-decoration:none; padding:10px 20px; border-radius:6px; font-weight:bold;">Ir al Menú</a>
        </div>
    </main>
</body>
</html>`;
        res.send(html);
    } catch (err) {
        console.error("❌ Error calculando promedios grupales:", err);
        res.status(500).send('Error interno al procesar el reporte.');
    }
});

// ==========================================
//      MÓDULO DE BOLETA DIGITAL PARA EL ALUMNO (UNIVERSAL)
// ==========================================

app.get('/mis-calificaciones', verificarSesion, (req, res) => {
    res.sendFile(path.join(__dirname, 'public/mis-calificaciones.html'));
});

app.get(['/api/mis-notas', '/api/mis-calificaciones-datos', '/api/mis-calificaciones'], verificarSesion, async (req, res) => {
    try {
        const username = req.session.username;
        const emailSesion = req.session.email;

        let alumnoRes = await pool.query(`
            SELECT id, nombre, apellido, grupo 
            FROM alumnos 
            WHERE LOWER(email) = LOWER($1) OR LOWER(email) LIKE LOWER($2)
            LIMIT 1
        `, [emailSesion || '', `%${username || ''}%`]);

        let calificacionesRows = [];
        let nombreCompletoAlumno = req.session.nombre || username || "Alumno";

        if (alumnoRes.rows.length > 0) {
            const alumno = alumnoRes.rows[0];
            nombreCompletoAlumno = `${alumno.nombre} ${alumno.apellido}`;

            const resNotas = await pool.query(`
                SELECT materia, parcial1, parcial2, parcial3, calificacion, calificacion AS promedio_final
                FROM calificaciones 
                WHERE id_alumno = $1 
                ORDER BY materia ASC
            `, [alumno.id]);

            calificacionesRows = resNotas.rows;
        }

        res.json({
            success: true,
            nombreAlumno: nombreCompletoAlumno,
            calificaciones: calificacionesRows,
            data: calificacionesRows
        });
    } catch (err) {
        console.error("❌ Error consultando calificaciones del alumno:", err);
        res.status(500).json({ success: false, calificaciones: [], message: "Error al consultar boleta." });
    }
});

// ==========================================
//       MÓDULO DE RECUPERACIÓN DE CUENTAS
// ==========================================

app.get('/recuperar-cuenta', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/recuperar.html'));
});

app.post('/enviar-codigo', async (req, res) => {
    const { username, email } = req.body;
    try {
        const result = await pool.query('SELECT * FROM usuarios WHERE username = $1 AND email = $2', [username, email]);
        if (result.rows.length === 0) return res.status(404).send('Usuario no encontrado');
        // ...resto del código de recuperación
    } catch(e) { res.status(500).send('Error'); }
});

// ==========================================
//               CIERRE DE SESIÓN
// ==========================================
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.redirect('/menu');
        res.clearCookie('connect.sid'); 
        res.redirect('/'); 
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});