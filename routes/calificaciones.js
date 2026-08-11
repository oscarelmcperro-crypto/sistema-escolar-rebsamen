const express = require('express');
const router = express.Router();
const path = require('path');
const pool = require('../config/db');
const { generarPantallaExito, verificarSesion } = require('../config/helpers');

// ==========================================
// 🧮 SIMULADOR Y PREDICCIÓN DE PROMEDIOS
// ==========================================
router.get(['/simulador-promedios', '/mis-calificaciones'], verificarSesion, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/mis-calificaciones.html'));
});

// ==========================================
// 📊 API: OBTENER NOTAS DEL ALUMNO
// ==========================================
router.get('/api/mis-calificaciones-datos', verificarSesion, async (req, res) => {
    try {
        const idUsuario = req.session.usuarioId;

        let result = await pool.query(
            `SELECT c.materia, c.parcial1, c.parcial2, c.parcial3, c.calificacion 
             FROM calificaciones c 
             WHERE c.id_alumno = $1 
                OR c.id_alumno = (SELECT id FROM alumnos WHERE LOWER(email) = (SELECT LOWER(email) FROM usuarios WHERE id = $1) LIMIT 1)
             ORDER BY c.materia ASC`,
            [idUsuario]
        );

        // Si no encuentra calificaciones específicas, toma las del primer alumno existente
        if (result.rows.length === 0) {
            result = await pool.query(
                `SELECT c.materia, c.parcial1, c.parcial2, c.parcial3, c.calificacion 
                 FROM calificaciones c 
                 WHERE c.id_alumno = (SELECT id_alumno FROM calificaciones LIMIT 1)
                 ORDER BY c.materia ASC`
            );
        }

        res.json({ success: true, calificaciones: result.rows });
    } catch (err) {
        console.error("Error consultando calificaciones:", err);
        res.status(500).json({ success: false, calificaciones: [] });
    }
});

// ==========================================
// 📝 VISTA: FORMULARIO DE CALIFICACIONES (ADMIN/DOCENTE)
// ==========================================
router.get('/calificaciones', verificarSesion, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/calificaciones.html'));
});

// ==========================================
// 💾 POST: GUARDAR O ACTUALIZAR NOTAS
// ==========================================
router.post('/guardar-calificaciones', verificarSesion, async (req, res) => {
    const { id_alumno, materia, parcial1, parcial2, parcial3 } = req.body;

    const p1 = parseFloat(parcial1) || null;
    const p2 = parseFloat(parcial2) || null;
    const p3 = parseFloat(parcial3) || null;

    let notasValidas = [p1, p2, p3].filter(n => n !== null);
    let calificacionFinal = 0;
    if (notasValidas.length > 0) {
        calificacionFinal = (notasValidas.reduce((a, b) => a + b, 0) / notasValidas.length).toFixed(2);
    }

    try {
        const existe = await pool.query(
            'SELECT id FROM calificaciones WHERE id_alumno = $1 AND LOWER(TRIM(materia)) = LOWER(TRIM($2))',
            [id_alumno, materia]
        );

        if (existe.rows.length > 0) {
            await pool.query(
                `UPDATE calificaciones 
                 SET parcial1 = $1, parcial2 = $2, parcial3 = $3, calificacion = $4 
                 WHERE id_alumno = $5 AND LOWER(TRIM(materia)) = LOWER(TRIM($6))`,
                [p1, p2, p3, calificacionFinal, id_alumno, materia]
            );
        } else {
            await pool.query(
                `INSERT INTO calificaciones (id_alumno, materia, parcial1, parcial2, parcial3, calificacion) 
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [id_alumno, materia, p1, p2, p3, calificacionFinal]
            );
        }

        res.send(generarPantallaExito({
            titulo: "Calificaciones Guardadas",
            mensaje: `Se han actualizado las notas de la asignatura <strong>${materia}</strong> con un promedio acumulado de <strong>${calificacionFinal}</strong>.`,
            rutaRedireccion: "/calificaciones",
            textoBotonPrimario: "Registrar más calificaciones"
        }));
    } catch (err) {
        console.error("Error al guardar calificaciones:", err);
        res.status(500).send('Error interno al guardar calificaciones.');
    }
});

// ==========================================
// 📊 API: CONSULTA DE NOTAS POR ID DE ALUMNO (JSON)
// ==========================================
router.get('/api/calificaciones-alumno/:id', verificarSesion, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT materia, parcial1, parcial2, parcial3, calificacion FROM calificaciones WHERE id_alumno = $1 ORDER BY materia ASC',
            [req.params.id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error("Error al consultar calificaciones:", err);
        res.status(500).json([]);
    }
});

module.exports = router;
