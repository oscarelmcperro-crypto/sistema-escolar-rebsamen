const express = require('express');
const router = express.Router();
const path = require('path');
const pool = require('../config/db');
const { generarPantallaExito, verificarSesion } = require('../config/helpers');

// ==========================================
// 📢 MURO DE AVISOS
// ==========================================

router.get('/avisos', verificarSesion, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/avisos.html'));
});

router.get('/api/avisos', verificarSesion, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM avisos ORDER BY fecha DESC');
        res.json(result.rows);
    } catch (err) {
        console.error("Error obteniendo avisos:", err);
        res.status(500).json([]);
    }
});

router.post('/guardar-aviso', verificarSesion, async (req, res) => {
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
// 📝 BITÁCORA DISCIPLINARIA
// ==========================================

router.get('/registrar-bitacora', verificarSesion, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/bitacora.html'));
});

router.post('/guardar-bitacora', verificarSesion, async (req, res) => {
    const { id_alumno, tipo, descripcion } = req.body;
    try {
        await pool.query('INSERT INTO bitacora (id_alumno, tipo, descripcion) VALUES ($1, $2, $3)', [id_alumno, tipo, descripcion]);
        res.send(generarPantallaExito({
            titulo: "Incidencia Registrada",
            mensaje: "La anotación disciplinaria o reconocimiento ha sido guardada en la bitácora escolar con éxito.",
            rutaRedireccion: "/registrar-bitacora",
            textoBotonPrimario: "Registrar otra anotación"
        }));
    } catch (err) {
        console.error("Error guardando bitácora:", err);
        res.status(500).send('Error al guardar la nota en la bitácora.');
    }
});

module.exports = router;
