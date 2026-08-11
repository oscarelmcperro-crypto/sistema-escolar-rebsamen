const express = require('express');
const router = express.Router();
const path = require('path');
const pool = require('../config/db');
const { generarPantallaExito, verificarAdmin, verificarSesion } = require('../config/helpers');

router.get('/promocion', verificarAdmin, (req, res) => res.sendFile(path.join(__dirname, '../public/promocion.html')));

router.get('/api/grupos-existentes', verificarSesion, async (req, res) => {
    try {
        const result = await pool.query('SELECT DISTINCT TRIM(grupo) as grupo FROM alumnos ORDER BY grupo ASC');
        res.json(result.rows);
    } catch (err) { res.status(500).json([]); }
});

router.post('/procesar-promocion', verificarAdmin, async (req, res) => {
    const { grupo_origen, grupo_destino } = req.body;
    try {
        const queryText = `UPDATE alumnos SET grupo = $1 WHERE grupo = $2 OR REPLACE(TRIM(grupo), '"', '') = REPLACE(TRIM($2), '"', '')`;
        const result = await pool.query(queryText, [grupo_destino, grupo_origen]);
        res.send(generarPantallaExito({ titulo: "Promoción Completada", mensaje: `Actualizados ${result.rowCount} alumnos.`, rutaRedireccion: "/ver-alumnos", textoBotonPrimario: "Ver Lista" }));
    } catch (err) { res.status(500).send('Error.'); }
});

module.exports = router;
