const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../config/db');

// GET /login: Redirigir si se accede directamente por dirección web
router.get('/login', (req, res) => {
    if (req.session && (req.session.usuarioLogueado || req.session.logueado)) {
        return res.redirect('/menu');
    }
    res.redirect('/');
});

// POST /login: Procesar el acceso
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).send(`
            <script>
                alert("Ingresa usuario y contraseña.");
                window.location.href = "/";
            </script>
        `);
    }

    try {
        const result = await pool.query('SELECT * FROM usuarios WHERE LOWER(username) = LOWER($1)', [username.trim()]);

        if (result.rows.length === 0) {
            return res.status(401).send(`
                <script>
                    alert("Usuario no encontrado.");
                    window.location.href = "/";
                </script>
            `);
        }

        const usuario = result.rows[0];
        const hashGuardado = usuario.password_hash || usuario.password;

        if (!hashGuardado) {
            return res.status(400).send(`
                <script>
                    alert("La cuenta no tiene una contraseña válida.");
                    window.location.href = "/";
                </script>
            `);
        }

        const passwordValida = await bcrypt.compare(password, hashGuardado);
        if (!passwordValida) {
            return res.status(401).send(`
                <script>
                    alert("Contraseña incorrecta.");
                    window.location.href = "/";
                </script>
            `);
        }

        // Se asignan las variables para cubrir todos los middlewares
        req.session.usuarioLogueado = true;
        req.session.logueado = true;
        req.session.usuarioId = usuario.id;
        req.session.username = usuario.username;
        req.session.nombre = usuario.nombre || usuario.username;
        req.session.rol = usuario.rol || usuario.role || 'alumno';

        // Redirigir a todos al Menú General
        res.redirect('/menu');

    } catch (err) {
        console.error("Error en login:", err);
        res.status(500).send("Error interno en el servidor.");
    }
});

// GET /logout: Cerrar Sesión
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) console.error("Error al cerrar sesión:", err);
        res.redirect('/');
    });
});

module.exports = router;
