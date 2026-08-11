const express = require('express');
const router = express.Router();
const path = require('path');
const bcrypt = require('bcrypt');
const PDFDocument = require('pdfkit-table');
const QRCode = require('qrcode');
const pool = require('../config/db');
const transportador = require('../config/mailer');
const { generarPantallaExito, verificarSesion, verificarAdmin } = require('../config/helpers');
const saltRounds = 10;

// API: Obtener lista de alumnos
router.get('/api/lista-alumnos', verificarSesion, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, nombre, apellido, grupo FROM alumnos ORDER BY grupo ASC, apellido ASC');
        res.json(result.rows);
    } catch (err) { res.status(500).json([]); }
});

// VISTA: Registrar Alumno
router.get('/registrar-alumno', verificarAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/registrar-alumno.html'));
});

// POST: Guardar Alumno
router.post('/guardar-alumno', verificarAdmin, async (req, res) => {
    const { nombre, apellido, email, grupo } = req.body;
    const clienteBD = await pool.connect();
    try {
        await clienteBD.query('BEGIN');
        const resId = await clienteBD.query('SELECT COALESCE(MAX(id), 0) + 1 AS siguiente_id FROM alumnos');
        const nuevoAlumnoId = resId.rows[0].siguiente_id;

        await clienteBD.query(`INSERT INTO alumnos (id, nombre, apellido, email, grupo) VALUES ($1, $2, $3, $4, $5)`, [nuevoAlumnoId, nombre, apellido, email, grupo]);

        const resRol = await clienteBD.query("SELECT id FROM roles WHERE LOWER(nombre_rol) LIKE '%alumno%' LIMIT 1");
        const idRolCorrecto = resRol.rows.length > 0 ? resRol.rows[0].id : 3;

        const usernameAlumno = email.split('@')[0]; 
        const passwordTemporal = 'alumno1234'; 
        const hashPassword = await bcrypt.hash(passwordTemporal, saltRounds);
        
        await clienteBD.query(`INSERT INTO usuarios (id, username, password, id_rol, nombre, apellido, email, cambiar_password) VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)`, [nuevoAlumnoId, usernameAlumno, hashPassword, idRolCorrecto, nombre, apellido, email]);
        await clienteBD.query('COMMIT');

        res.send(generarPantallaExito({
            titulo: "Alumno Creado",
            mensaje: `<p>🆔 ID: ${nuevoAlumnoId} | 👤 Usuario: ${usernameAlumno} | 🔑 Pass: ${passwordTemporal}</p>`,
            rutaRedireccion: "/registrar-alumno",
            textoBotonPrimario: "Registrar otro alumno"
        }));
    } catch (err) {
        await clienteBD.query('ROLLBACK');
        res.status(500).send(`Error: ${err.message}`);
    } finally { clienteBD.release(); }
});

// VISTA: Ver Alumnos con sus acciones
router.get('/ver-alumnos', verificarSesion, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, nombre, apellido, email, grupo FROM alumnos ORDER BY grupo ASC, apellido ASC');
        let html = `<!DOCTYPE html><html lang="es"><head><link rel="stylesheet" href="/style.css"><title>Alumnos</title></head><body>
                    <main class="main-content" style="max-width:980px; margin:30px auto;">
                    <h1 style="color:white;">Lista General de Alumnos</h1>
                    <table style="width:100%; background:white; border-collapse:collapse; border-radius:8px; overflow:hidden;">
                    <thead><tr style="background:#1e3a8a; color:white;"><th style="padding:12px;">Grupo</th><th style="padding:12px; text-align:left;">Alumno</th><th style="padding:12px; text-align:left;">Email</th><th style="padding:12px; text-align:center;">Acciones</th></tr></thead><tbody>`;
        result.rows.forEach(a => {
            html += `<tr style="border-bottom:1px solid #e2e8f0;">
                <td style="padding:10px; text-align:center;"><strong>${a.grupo}</strong></td>
                <td style="padding:10px;">${a.apellido}, ${a.nombre}</td>
                <td style="padding:10px;">${a.email}</td>
                <td style="padding:10px; text-align:center; display:flex; gap:6px; justify-content:center; flex-wrap:wrap;">
                    <a href="/reporte-alumno/${a.id}" style="background:#1e3a8a; color:white; padding:5px 8px; border-radius:4px; text-decoration:none; font-weight:bold;">🔍 Perfil</a>
                    <a href="/descargar-credencial-pdf/${a.id}" target="_blank" style="background:#0284c7; color:white; padding:5px 8px; border-radius:4px; text-decoration:none; font-weight:bold;">📇 Credencial QR</a>
                    <a href="/descargar-constancia-pdf/${a.id}" target="_blank" style="background:#059669; color:white; padding:5px 8px; border-radius:4px; text-decoration:none; font-weight:bold;">📄 Constancia</a>
                    <a href="/editar-alumno/${a.id}" style="background:#eab308; color:white; padding:5px 8px; border-radius:4px; text-decoration:none; font-weight:bold;">✏️ Editar</a>
                    <a href="/eliminar-alumno/${a.id}" onclick="return confirm('¿Eliminar alumno?');" style="background:#ef4444; color:white; padding:5px 8px; border-radius:4px; text-decoration:none; font-weight:bold;">🗑️ Borrar</a>
                </td>
            </tr>`;
        });
        html += `</tbody></table><br><a href="/menu" style="background:#64748b; color:white; padding:10px 20px; border-radius:6px; text-decoration:none; font-weight:bold; display:inline-block;">Volver al Menú</a></main></body></html>`;
        res.send(html);
    } catch (err) { res.status(500).send('Error al cargar lista.'); }
});

// VISTA: Reporte / Perfil Individual del Alumno
router.get('/reporte-alumno/:id', verificarSesion, async (req, res) => {
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
                    <div style="background:#f1f5f9; padding:12px; border-radius:8px; margin-bottom:20px;">
                        <h3 style="margin:0; color:#1e3a8a;">Asistencias: ${porcentaje}%</h3>
                        <p style="margin:5px 0 0 0; color:#475569;">Presencias: ${si} | Faltas: ${faltas.rows[0].count} | Retardos: ${retardos.rows[0].count}</p>
                    </div>

                    <h2 style="color:#1e3a8a;">Boleta de Calificaciones</h2>
                    <table style="width:100%; border-collapse:collapse; margin-bottom:25px;">
                    <thead><tr style="background:#1e3a8a; color:white;"><th style="padding:10px; text-align:left;">Materia</th><th style="padding:10px;">P1</th><th style="padding:10px;">P2</th><th style="padding:10px;">P3</th><th style="padding:10px;">Final</th></tr></thead><tbody>`;
        notas.rows.forEach(n => {
            html += `<tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:10px;">${n.materia}</td><td style="text-align:center;">${n.parcial1}</td><td style="text-align:center;">${n.parcial2}</td><td style="text-align:center;">${n.parcial3}</td><td style="text-align:center;"><strong>${n.calificacion}</strong></td></tr>`;
        });
        html += `</tbody></table><h2 style="color:#1e3a8a;">📝 Historial de Bitácora</h2>`;

        if (resBitacora.rows.length === 0) {
            html += `<p style="color:#94a3b8; font-style:italic;">Sin observaciones registradas.</p>`;
        } else {
            html += `<table style="width:100%; border-collapse:collapse; margin-bottom:20px;"><thead><tr style="background:#475569; color:white;"><th style="padding:8px;">Fecha</th><th style="padding:8px;">Tipo</th><th style="padding:8px; text-align:left;">Descripción</th></tr></thead><tbody>`;
            resBitacora.rows.forEach(b => {
                const f = new Date(b.fecha).toLocaleDateString('es-MX');
                let badge = b.tipo === 'Reporte' ? '🔴' : b.tipo === 'Felicitación' ? '🟢' : '🟡';
                html += `<tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:8px; text-align:center;">${f}</td><td style="padding:8px; text-align:center;"><strong>${badge} ${b.tipo}</strong></td><td style="padding:8px;">${b.descripcion}</td></tr>`;
            });
            html += `</tbody></table>`;
        }

        html += `<div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:20px;">
                     <a href="/descargar-boleta-pdf/${alumno.id}" style="background:#ef4444; color:white; padding:10px 20px; border-radius:6px; text-decoration:none; font-weight:bold;">📄 Descargar PDF</a>
                     <a href="/enviar-boleta-correo/${alumno.id}" style="background:#16a34a; color:white; padding:10px 20px; border-radius:6px; text-decoration:none; font-weight:bold;">📩 Enviar por Email</a>
                     <a href="/descargar-credencial-pdf/${alumno.id}" target="_blank" style="background:#0284c7; color:white; padding:10px 20px; border-radius:6px; text-decoration:none; font-weight:bold;">📇 Credencial QR</a>
                     <a href="/ver-alumnos" style="background:#64748b; color:white; padding:10px 20px; border-radius:6px; text-decoration:none; font-weight:bold;">Volver a la Lista</a>
                 </div></main></body></html>`;
        res.send(html);
    } catch (err) { res.status(500).send('Error al cargar reporte.'); }
});

// PDF: Descargar Boleta de Calificaciones
router.get('/descargar-boleta-pdf/:id', verificarSesion, async (req, res) => {
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
        doc.fontSize(10).text('Boleta Oficial de Calificaciones', { align: 'center' });
        doc.moveDown(1.5);

        doc.fillColor('#000000').fontSize(11).text(`Alumno: ${alumno.apellido}, ${alumno.nombre}`);
        doc.text(`Grupo: ${alumno.grupo}  |  ID Estudiante: ${alumno.id}`);
        doc.moveDown(1);

        const tableData = {
            headers: ["Asignatura / Materia", "Parcial 1", "Parcial 2", "Parcial 3", "Promedio Final"],
            rows: resNotas.rows.map(n => [n.materia, String(n.parcial1 || '-'), String(n.parcial2 || '-'), String(n.parcial3 || '-'), String(n.calificacion || '0.00')])
        };

        await doc.table(tableData, { prepareHeader: () => doc.font("Helvetica-Bold").fontSize(10).fillColor("#1e3a8a"), prepareRow: () => doc.font("Helvetica").fontSize(9) });
        doc.moveDown(3);
        doc.text('____________________________________', { align: 'center' });
        doc.text('Firma y Sello de la Dirección Escolar', { align: 'center' });
        doc.end();
    } catch (err) { res.status(500).send('Error generando el PDF.'); }
});

// EMAIL: Enviar Boleta por Correo
router.get('/enviar-boleta-correo/:id', verificarSesion, async (req, res) => {
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
            await transportador.sendMail({
                from: `"Escuela Enrique C. Rébsamen" <${process.env.EMAIL_USER}>`,
                to: alumno.email,
                subject: `📊 Boleta Oficial - ${alumno.nombre} ${alumno.apellido}`,
                html: `<p>Adjunto encontrará la boleta de calificaciones en formato PDF del alumno <strong>${alumno.nombre} ${alumno.apellido}</strong>.</p>`,
                attachments: [{ filename: `Boleta_${alumno.apellido}_${alumno.nombre}.pdf`, content: pdfData }]
            });
            res.send(generarPantallaExito({ titulo: "Correo Enviado", mensaje: `Boleta enviada a <strong>${alumno.email}</strong>.`, rutaRedireccion: `/reporte-alumno/${alumno.id}`, textoBotonPrimario: "Volver al Perfil" }));
        });

        doc.fillColor('#1e3a8a').fontSize(18).text('Escuela Secundaria Oficial No. 0829', { align: 'center' });
        doc.fillColor('#334155').fontSize(14).text('"Enrique C. Rébsamen"', { align: 'center' });
        doc.moveDown(1.5);
        doc.fillColor('#000000').fontSize(11).text(`Alumno: ${alumno.apellido}, ${alumno.nombre}`);
        doc.text(`Grupo: ${alumno.grupo}  |  ID: ${alumno.id}`);
        doc.moveDown(1);

        const tableData = {
            headers: ["Asignatura", "P1", "P2", "P3", "Promedio Final"],
            rows: resNotas.rows.map(n => [n.materia, String(n.parcial1 || '-'), String(n.parcial2 || '-'), String(n.parcial3 || '-'), String(n.calificacion || '0.00')])
        };
        await doc.table(tableData, { prepareHeader: () => doc.font("Helvetica-Bold").fontSize(10), prepareRow: () => doc.font("Helvetica").fontSize(9) });
        doc.end();
    } catch (err) { res.status(500).send('Error enviando boleta.'); }
});

// PDF: Descargar Credencial QR
router.get('/descargar-credencial-pdf/:id', verificarSesion, async (req, res) => {
    try {
        const idAlumno = req.params.id;
        const resAlumno = await pool.query('SELECT * FROM alumnos WHERE id = $1', [idAlumno]);
        if (resAlumno.rows.length === 0) return res.status(404).send('Alumno no encontrado');
        const alumno = resAlumno.rows[0];

        const qrData = JSON.stringify({ id: alumno.id, nombre: `${alumno.nombre} ${alumno.apellido}`, grupo: alumno.grupo });
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
        doc.fillColor('#334155').fontSize(11).text(`${alumno.apellido}`, 10, 85, { align: 'center' });
        doc.fontSize(10).text(`${alumno.nombre}`, 10, 100, { align: 'center' });
        doc.fillColor('#1e3a8a').fontSize(12).text(`GRUPO: ${alumno.grupo}`, 10, 125, { align: 'center' });
        doc.fillColor('#64748b').fontSize(9).text(`ID: ${alumno.id}`, 10, 142, { align: 'center' });

        const qrBuffer = Buffer.from(qrImageBase64.replace(/^data:image\/png;base64,/, ""), 'base64');
        doc.image(qrBuffer, 60, 165, { width: 120, height: 120 });

        doc.fillColor('#94a3b8').fontSize(7).text('Ciclo Escolar Vigente', 10, 335, { align: 'center' });
        doc.text('Estado de México', 10, 348, { align: 'center' });
        doc.end();
    } catch (err) { res.status(500).send('Error generando credencial.'); }
});

// PDF: Descargar Constancia de Estudios
router.get('/descargar-constancia-pdf/:id', verificarSesion, async (req, res) => {
    try {
        const idAlumno = req.params.id;
        const resAlumno = await pool.query('SELECT * FROM alumnos WHERE id = $1', [idAlumno]);
        if (resAlumno.rows.length === 0) return res.status(404).send('Alumno no encontrado');
        const alumno = resAlumno.rows[0];

        const resProm = await pool.query('SELECT ROUND(AVG(calificacion), 2) as promedio FROM calificaciones WHERE id_alumno = $1', [idAlumno]);
        const promedio = resProm.rows[0].promedio || 'N/A';

        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=Constancia_${alumno.apellido}.pdf`);

        doc.pipe(res);
        doc.fillColor('#1e3a8a').fontSize(16).text('ESCUELA SECUNDARIA OFICIAL NO. 0829', { align: 'center' });
        doc.fillColor('#334155').fontSize(14).text('"ENRIQUE C. RÉBSAMEN"', { align: 'center' });
        doc.fontSize(10).text('CLAVE DE CENTRO DE TRABAJO (CCT): 15EES0345Z', { align: 'center' });
        doc.moveDown(2);

        doc.fillColor('#1e3a8a').fontSize(14).text('CONSTANCIA DE ESTUDIOS', { align: 'center', underline: true });
        doc.moveDown(2);

        const fechaHoy = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
        doc.fillColor('#000000').fontSize(11).text('A QUIEN CORRESPONDA:', { align: 'left' });
        doc.moveDown(1);

        doc.fontSize(11).text(`El que suscribe, Director de la Escuela Secundaria Oficial No. 0829 "Enrique C. Rébsamen", hace CONSTAR que el (la) alumno(a):`, { align: 'justify', lineGap: 4 });
        doc.moveDown(1);

        doc.font('Helvetica-Bold').fontSize(12).text(`${alumno.nombre.toUpperCase()} ${alumno.apellido.toUpperCase()}`, { align: 'center' });
        doc.font('Helvetica').fontSize(10).text(`Matrícula / ID: ${alumno.id} | Grado y Grupo: ${alumno.grupo}`, { align: 'center' });
        doc.text(`Promedio General Registrado: ${promedio}`, { align: 'center' });
        doc.moveDown(1.5);

        doc.fontSize(11).text(`Se encuentra debidamente inscrito(a) y cursando de manera regular sus estudios correspondientes al presente Ciclo Escolar. Se extiende la presente constancia a petición de la parte interesada para los fines legales e institucionales que a la misma convengan, en el Estado de México, a ${fechaHoy}.`, { align: 'justify', lineGap: 4 });

        doc.moveDown(4);
        doc.text('ATENTAMENTE', { align: 'center' });
        doc.moveDown(3);
        doc.text('________________________________________', { align: 'center' });
        doc.font('Helvetica-Bold').text('DIRECCIÓN ESCOLAR', { align: 'center' });
        doc.font('Helvetica').fontSize(9).text('Escuela Secundaria No. 0829 "Enrique C. Rébsamen"', { align: 'center' });

        doc.end();
    } catch (err) { res.status(500).send('Error generando la constancia.'); }
});

// VISTA / API: Portal de Consulta para Padres
router.get('/portal-padres', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/padres.html'));
});

router.get('/api/consultar-alumno/:id', async (req, res) => {
    try {
        const idAlumno = req.params.id;
        const resAlumno = await pool.query('SELECT id, nombre, apellido, grupo, email FROM alumnos WHERE id = $1', [idAlumno]);
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

// VISTA: Editar Alumno
router.get('/editar-alumno/:id', verificarAdmin, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM alumnos WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).send('<h1>Alumno no encontrado</h1>');
        const a = result.rows[0];

        let html = `<!DOCTYPE html><html lang="es"><head><link rel="stylesheet" href="/style.css"><title>Editar Alumno</title></head><body>
                    <main class="main-content" style="max-width:500px; margin:50px auto; background:white; padding:35px; border-radius:12px;">
                    <h2 style="color:#1e3a8a; margin-top:0;">✏️ Editar Alumno #${a.id}</h2>
                    <form action="/actualizar-alumno" method="POST">
                        <input type="hidden" name="id" value="${a.id}">
                        <p><label>Nombre(s):</label><br><input type="text" name="nombre" value="${a.nombre}" required style="width:100%; padding:9px; border-radius:6px; border:1px solid #cbd5e1;"></p>
                        <p><label>Apellido(s):</label><br><input type="text" name="apellido" value="${a.apellido}" required style="width:100%; padding:9px; border-radius:6px; border:1px solid #cbd5e1;"></p>
                        <p><label>Grupo:</label><br><input type="text" name="grupo" value="${a.grupo}" required style="width:100%; padding:9px; border-radius:6px; border:1px solid #cbd5e1;"></p>
                        <p><label>Correo Electrónico:</label><br><input type="email" name="email" value="${a.email}" required style="width:100%; padding:9px; border-radius:6px; border:1px solid #cbd5e1;"></p>
                        <div style="margin-top:25px; display:flex; gap:10px;">
                            <button type="submit" style="background:#16a34a; color:white; padding:10px 20px; border:none; border-radius:6px; font-weight:bold; cursor:pointer; flex:1;">Guardar Cambios 💾</button>
                            <a href="/ver-alumnos" style="background:#64748b; color:white; padding:10px 20px; border-radius:6px; text-decoration:none; font-weight:bold; text-align:center;">Cancelar</a>
                        </div>
                    </form></main></body></html>`;
        res.send(html);
    } catch (err) { res.status(500).send('Error al cargar datos.'); }
});

// POST: Actualizar datos de Alumno
router.post('/actualizar-alumno', verificarAdmin, async (req, res) => {
    const { id, nombre, apellido, grupo, email } = req.body;
    try {
        await pool.query('UPDATE alumnos SET nombre = $1, apellido = $2, grupo = $3, email = $4 WHERE id = $5', [nombre, apellido, grupo, email, id]);
        await pool.query('UPDATE usuarios SET nombre = $1, apellido = $2, email = $3 WHERE id = $4', [nombre, apellido, email, id]);
        res.send(generarPantallaExito({ titulo: "Alumno Actualizado", mensaje: "Datos sincronizados correctamente.", rutaRedireccion: "/ver-alumnos", textoBotonPrimario: "Volver a la Lista" }));
    } catch (err) { res.status(500).send('Error al actualizar.'); }
});

// GET: Eliminar Alumno
router.get('/eliminar-alumno/:id', verificarAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM bitacora WHERE id_alumno = $1', [req.params.id]);
        await pool.query('DELETE FROM calificaciones WHERE id_alumno = $1', [req.params.id]);
        await pool.query('DELETE FROM asistencias WHERE id_alumno = $1', [req.params.id]);
        await pool.query('DELETE FROM alumnos WHERE id = $1', [req.params.id]);
        await pool.query('DELETE FROM usuarios WHERE id = $1', [req.params.id]);
        res.redirect('/ver-alumnos');
    } catch (err) { res.status(500).send('Error al eliminar alumno.'); }
});

module.exports = router;
