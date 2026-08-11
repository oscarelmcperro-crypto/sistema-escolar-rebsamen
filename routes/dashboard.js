const express = require('express');
const router = express.Router();
const path = require('path');
const { verificarSesion } = require('../config/helpers');

// VISTA: Menú Principal
router.get('/menu', verificarSesion, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/menu.html'));
});

// VISTA: Dashboard Estadístico
router.get('/dashboard', verificarSesion, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/dashboard.html'));
});

// VISTA: Mis Calificaciones / Boleta
router.get('/mis-calificaciones', verificarSesion, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/mis-calificaciones.html'));
});

// VISTAS DEL MENÚ PRINCIPAL
router.get('/registrar-asistencia', verificarSesion, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/asistencia.html'));
});

router.get('/ver-alumnos', verificarSesion, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/ver-alumnos.html'));
});

router.get('/agregar-alumno', verificarSesion, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/agregar.html'));
});

router.get('/avisos', verificarSesion, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/avisos.html'));
});

router.get('/bitacora', verificarSesion, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/bitacora.html'));
});

router.get('/promocion', verificarSesion, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/promocion.html'));
});

// API: Información del usuario en sesión
router.get('/api/usuario-actual', (req, res) => {
    if (req.session && (req.session.usuarioLogueado || req.session.logueado)) {
        res.json({
            logueado: true,
            id: req.session.usuarioId,
            username: req.session.username,
            nombre: req.session.nombre,
            rol: req.session.rol || 'alumno'
        });
    } else {
        res.json({ logueado: false });
    }
});

module.exports = router;
