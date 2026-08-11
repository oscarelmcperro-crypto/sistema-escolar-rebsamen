const express = require('express');
const router = express.Router();
const path = require('path');
const ExcelJS = require('exceljs');
const pool = require('../config/db');
const transportador = require('../config/mailer');
const { generarPantallaExito, verificarSesion } = require('../config/helpers');

router.get('/escaner', verificarSesion, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/escaner.html'));
});

router.post('/guardar-asistencia-qr', verificarSesion, async (req, res) => {
    const { id_alumno, estado } = req.body;
    try {
        await pool.query('INSERT INTO asistencias (id_alumno, estado, fecha) VALUES ($1, $2, CURRENT_DATE)', [id_alumno, estado || 'Asistencia']);
        res.json({ success: true, message: 'Asistencia registrada correctamente.' });
    } catch (err) { res.status(500).json({ success: false, message: 'Error.' }); }
});

router.get('/registrar-asistencia', verificarSesion, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, nombre, apellido, grupo FROM alumnos ORDER BY grupo ASC, apellido ASC');
        let html = `<!DOCTYPE html><html lang="es"><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><link rel="stylesheet" href="style.css"><title>Asistencia</title></head><body><main class="main-content"><h1>Pase de Lista</h1><form action="/guardar-asistencia" method="POST">`;
        result.rows.forEach(a => {
            html += `<div style="border:1px solid #cbd5e1; padding:10px; margin-bottom:10px; background:#fff;"><strong>${a.grupo}</strong> - ${a.apellido}, ${a.nombre}<input type="hidden" name="id_alumno" value="${a.id}"><select name="estado" style="display:block; margin-top:5px; width:100%; padding:8px;"><option value="Asistencia">✔️ Asistencia</option><option value="Falta">❌ Falta</option><option value="Retardo">⏳ Retardo</option></select></div>`;
        });
        html += `<button type="submit" class="btn" style="background:#16a34a; color:white; width:100%; padding:12px;">Guardar Asistencia 💾</button></form></main></body></html>`;
        res.send(html);
    } catch (err) { res.status(500).send('Error.'); }
});

router.get('/ver-asistencias', verificarSesion, async (req, res) => {
    const { fecha_inicio, fecha_fin } = req.query;
    try {
        let queryText = `SELECT a.fecha, al.grupo, al.apellido, al.nombre, a.estado FROM asistencias a INNER JOIN alumnos al ON a.id_alumno = al.id`;
        const params = [];

        if (fecha_inicio && fecha_fin) { queryText += ` WHERE a.fecha BETWEEN $1 AND $2`; params.push(fecha_inicio, fecha_fin); }
        else if (fecha_inicio) { queryText += ` WHERE a.fecha >= $1`; params.push(fecha_inicio); }
        else if (fecha_fin) { queryText += ` WHERE a.fecha <= $1`; params.push(fecha_fin); }

        queryText += ` ORDER BY a.fecha DESC, al.grupo ASC, al.apellido ASC`;
        const result = await pool.query(queryText, params);

        let html = `<!DOCTYPE html><html lang="es"><head><link rel="stylesheet" href="/style.css"><title>Historial Asistencias</title></head><body><main class="main-content" style="max-width: 900px; margin: 30px auto;">
        <h1 style="color: white;">Historial Asistencias</h1>
        <form action="/ver-asistencias" method="GET" style="background: white; padding: 20px; border-radius: 10px; margin-bottom: 25px; display: flex; gap: 15px; align-items: flex-end; flex-wrap: wrap;">
            <div><label>Desde:</label><br><input type="date" name="fecha_inicio" value="${fecha_inicio || ''}" style="padding: 8px;"></div>
            <div><label>Hasta:</label><br><input type="date" name="fecha_fin" value="${fecha_fin || ''}" style="padding: 8px;"></div>
            <button type="submit" style="background:#1e3a8a; color:white; padding:9px 18px; border:none; border-radius:6px; font-weight:bold; cursor:pointer;">🔍 Filtrar</button>
            <a href="/ver-asistencias" style="background:#64748b; color:white; padding:9px 18px; border-radius:6px; text-decoration:none; font-weight:bold;">Limpiar</a>
            <div style="margin-left:auto; display:flex; gap:10px;">
                <a href="/escaner" style="background:#0284c7; color:white; padding:9px 18px; text-decoration:none; border-radius:6px; font-weight:bold;">📷 Escáner QR</a>
                <a href="/descargar-asistencias-excel" style="background:#16a34a; color:white; padding:9px 18px; text-decoration:none; border-radius:6px; font-weight:bold;">📊 Descargar Excel</a>
            </div>
        </form>
        <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden;">
            <thead><tr style="background:#1e3a8a; color:white;"><th style="padding:12px;">Fecha</th><th style="padding:12px;">Grupo</th><th style="padding:12px; text-align:left;">Alumno</th><th style="padding:12px;">Estado</th></tr></thead><tbody>`;

        if (result.rows.length === 0) {
            html += `<tr><td colspan="4" style="text-align:center; padding:25px;">No se encontraron registros.</td></tr>`;
        } else {
            result.rows.forEach(r => {
                const f = new Date(r.fecha).toLocaleDateString('es-MX');
                html += `<tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:12px;">${f}</td><td style="padding:12px; text-align:center;"><strong>${r.grupo}</strong></td><td style="padding:12px;">${r.apellido}, ${r.nombre}</td><td style="padding:12px; text-align:center;">${r.estado}</td></tr>`;
            });
        }
        html += `</tbody></table><br><a href="/menu" style="background:#64748b; color:white; padding:10px 20px; border-radius:6px; text-decoration:none; font-weight:bold;">Volver al Menú</a></main></body></html>`;
        res.send(html);
    } catch (err) { res.status(500).send('Error.'); }
});

module.exports = router;
