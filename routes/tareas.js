const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const pool = require('../config/db');
const { verificarSesion, generarPantallaExito } = require('../config/helpers');

// Configuración de Multer
const uploadDir = path.join(__dirname, '../public/uploads');
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

// VISTA: Muro de Tareas
router.get('/tareas', verificarSesion, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/tareas.html'));
});

// POST: Publicar Tarea (Docente / Admin)
router.post('/guardar-tarea', verificarSesion, upload.single('archivo_adjunto'), async (req, res) => {
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

// POST: Subir Entrega Alumno
router.post('/subir-entrega', verificarSesion, upload.single('archivo_alumno'), async (req, res) => {
    const { id_tarea, comentario } = req.body;
    const idAlumno = req.session.usuarioId;
    const archivoAlumno = req.file ? req.file.filename : null;

    if (!archivoAlumno) {
        return res.status(400).send("Debes adjuntar un archivo para realizar la entrega.");
    }

    try {
        await pool.query(
            `INSERT INTO entregas (id_tarea, id_alumno, archivo_alumno, comentario)
             VALUES ($1, $2, $3, $4)`,
            [id_tarea, idAlumno, archivoAlumno, comentario]
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

// API: Lista de Tareas
router.get('/api/lista-tareas', verificarSesion, async (req, res) => {
    try {
        const idUsuario = req.session.usuarioId;
        const rol = req.session.rol || 'alumno';

        const result = await pool.query(`
            SELECT t.*, 
                   TO_CHAR(t.fecha_entrega, 'YYYY-MM-DD') as fecha_formateada,
                   EXISTS(SELECT 1 FROM entregas e WHERE e.id_tarea = t.id AND e.id_alumno = $1) as ya_entrego,
                   (SELECT COUNT(*) FROM entregas e WHERE e.id_tarea = t.id) as total_entregas
            FROM tareas t 
            ORDER BY t.id DESC
        `, [idUsuario]);

        res.json({ success: true, tareas: result.rows, rol: rol });
    } catch (err) {
        console.error("Error obteniendo tareas:", err);
        res.status(500).json({ success: false, tareas: [] });
    }
});

// API: Contador de tareas pendientes para la insignia del Menú
router.get('/api/tareas-pendientes-count', verificarSesion, async (req, res) => {
    try {
        const idUsuario = req.session.usuarioId;

        const result = await pool.query(`
            SELECT COUNT(*) as pendientes 
            FROM tareas t 
            WHERE NOT EXISTS (
                SELECT 1 FROM entregas e 
                WHERE e.id_tarea = t.id AND e.id_alumno = $1
            )
        `, [idUsuario]);

        res.json({ success: true, pendientes: parseInt(result.rows[0].pendientes) || 0 });
    } catch (err) {
        console.error("Error al contar pendientes:", err);
        res.json({ success: false, pendientes: 0 });
    }
});

module.exports = router;
