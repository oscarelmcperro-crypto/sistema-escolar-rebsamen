const express = require('express');
const router = express.Router();
const pool = require('../config/db'); // Conexión a /config/db.js

/**
 * Normaliza el tipo de evento
 */
function normalizarTipoEvento(tipo) {
    if (!tipo) return 'Académico';
    const clean = tipo.toString().trim();
    const upper = clean.toUpperCase();

    if (upper.includes('EXAMEN') || upper.includes('EVALUA')) return 'Examen';
    if (upper.includes('INHABIL') || upper.includes('FESTIVO')) return 'Inhábil';
    if (upper.includes('ADMIN')) return 'Administrativo';
    
    return 'Académico';
}

/**
 * @route   GET /api/calendario
 * @desc    Obtiene eventos por mes y año
 */
router.get('/', async (req, res) => {
    try {
        const { mes, anio } = req.query;

        const fechaActual = new Date();
        const mesFiltro = mes || (fechaActual.getMonth() + 1);
        const anioFiltro = anio || fechaActual.getFullYear();

        // Renombramos c.id_evento AS id para que el frontend lo reconozca sin problemas
        const query = `
            SELECT 
                c.id_evento AS id,
                c.id_evento,
                c.titulo,
                c.descripcion,
                c.fecha_inicio,
                c.fecha_fin,
                c.tipo_evento,
                c.es_dia_inhabil
            FROM calendario_academico c
            WHERE EXTRACT(MONTH FROM c.fecha_inicio) = $1 
              AND EXTRACT(YEAR FROM c.fecha_inicio) = $2
            ORDER BY c.fecha_inicio ASC;
        `;

        const { rows } = await pool.query(query, [mesFiltro, anioFiltro]);

        res.json({
            success: true,
            total: rows.length,
            data: rows
        });
    } catch (error) {
        console.error('❌ Error al obtener calendario:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
});

/**
 * @route   POST /api/calendario
 * @desc    Crea evento
 */
router.post('/', async (req, res) => {
    try {
        const { 
            titulo, 
            descripcion, 
            fecha_inicio, 
            fecha_fin, 
            tipo_evento, 
            es_dia_inhabil 
        } = req.body;

        if (!titulo || !fecha_inicio || !fecha_fin) {
            return res.status(400).json({ success: false, message: 'Faltan campos obligatorios' });
        }

        const tipoNormalizado = normalizarTipoEvento(tipo_evento);

        const query = `
            INSERT INTO calendario_academico 
            (titulo, descripcion, fecha_inicio, fecha_fin, tipo_evento, es_dia_inhabil)
            VALUES ($1, $2, $3, $4, $5, $6) 
            RETURNING *, id_evento AS id;
        `;

        const values = [
            titulo,
            descripcion || null,
            fecha_inicio,
            fecha_fin,
            tipoNormalizado,
            es_dia_inhabil || false
        ];

        const { rows } = await pool.query(query, values);

        res.status(201).json({
            success: true,
            message: 'Evento creado exitosamente',
            data: rows[0]
        });
    } catch (error) {
        console.error('❌ Error al crear evento:', error);
        res.status(500).json({ success: false, message: error.message || 'Error al registrar evento' });
    }
});

/**
 * @route   PUT /api/calendario/:id
 * @desc    Actualiza evento usando id_evento
 */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            titulo, 
            descripcion, 
            fecha_inicio, 
            fecha_fin, 
            tipo_evento, 
            es_dia_inhabil 
        } = req.body;

        const tipoNormalizado = normalizarTipoEvento(tipo_evento);

        const query = `
            UPDATE calendario_academico 
            SET titulo = $1, descripcion = $2, fecha_inicio = $3, fecha_fin = $4, tipo_evento = $5, es_dia_inhabil = $6
            WHERE id_evento = $7
            RETURNING *, id_evento AS id;
        `;

        const values = [
            titulo, 
            descripcion || null, 
            fecha_inicio, 
            fecha_fin, 
            tipoNormalizado, 
            es_dia_inhabil || false, 
            id
        ];

        const { rows } = await pool.query(query, values);

        res.json({
            success: true,
            message: 'Evento actualizado exitosamente',
            data: rows[0]
        });
    } catch (error) {
        console.error('❌ Error al actualizar evento:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @route   DELETE /api/calendario/:id
 * @desc    Elimina evento usando id_evento
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const query = `
            DELETE FROM calendario_academico 
            WHERE id_evento = $1;
        `;
        
        const result = await pool.query(query, [id]);

        res.json({ 
            success: true, 
            message: 'Evento eliminado correctamente',
            filasBorradas: result.rowCount
        });
    } catch (error) {
        console.error('❌ Error al eliminar evento:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Error en BD al eliminar evento' 
        });
    }
});

module.exports = router;
