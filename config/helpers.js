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

function generarPantallaError({ titulo = "⚠️ Acceso Denegado", mensaje = "Tu sesión ha expirado o no has iniciado sesión.", rutaRedireccion = "/", textoBoton = "Ir al Login" }) {
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
        .error-card { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); text-align: center; width: 100%; max-width: 420px; border-top: 5px solid #ef4444; }
        h1 { color: #ef4444; margin-top: 0; font-size: 1.8rem; }
        p { color: #64748b; font-size: 1rem; line-height: 1.5; margin-bottom: 20px; }
        .btn-login { display: inline-block; background-color: #1e3a8a; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; }
        .btn-login:hover { background-color: #1d4ed8; }
    </style>
</head>
<body>
    <div class="error-card">
        <h1>${titulo}</h1>
        <p>${mensaje}</p>
        <a href="${rutaRedireccion}" class="btn-login">${textoBoton}</a>
    </div>
</body>
</html>`;
}

function verificarSesion(req, res, next) {
    const estaLogueado = req.session && (req.session.usuarioLogueado || req.session.logueado || req.session.usuarioId);

    if (estaLogueado) {
        if (req.session.debeCambiarPassword) return res.redirect('/primer-login');
        return next();
    }
    res.status(401).send(generarPantallaError({
        titulo: "⚠️ Acceso Denegado",
        mensaje: "Tu sesión ha expirado o no has iniciado sesión en el sistema.",
        rutaRedireccion: "/",
        textoBoton: "Ir a Iniciar Sesión"
    }));
}

function verificarAdmin(req, res, next) {
    const estaLogueado = req.session && (req.session.usuarioLogueado || req.session.logueado || req.session.usuarioId);
    const esAdmin = req.session && (req.session.rol === 'Administrador' || req.session.rol === 'admin');

    if (estaLogueado && esAdmin) {
        if (req.session.debeCambiarPassword) return res.redirect('/primer-login');
        return next();
    }
    res.status(403).send(generarPantallaError({
        titulo: "🚫 Acceso Restringido",
        mensaje: "Esta función es exclusiva para el perfil de Administrador.",
        rutaRedireccion: "/menu",
        textoBoton: "Volver al Menú"
    }));
}

function verificarAlumno(req, res, next) {
    const estaLogueado = req.session && (req.session.usuarioLogueado || req.session.logueado || req.session.usuarioId);
    const esAlumno = req.session && req.session.rol && req.session.rol.toLowerCase().includes('alumno');

    if (estaLogueado && esAlumno) {
        return next();
    }
    res.status(403).send(generarPantallaError({
        titulo: "🚫 Área Exclusiva",
        mensaje: "Esta sección es de acceso exclusivo para alumnos.",
        rutaRedireccion: "/",
        textoBoton: "Ir al Login"
    }));
}

module.exports = {
    generarPantallaExito,
    generarPantallaError,
    verificarSesion,
    verificarAdmin,
    verificarAlumno
};
