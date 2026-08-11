<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Registro de Alumnos - Upem2</title>
    <style>
        body { font-family: Arial, sans-serif; background-color: #f4f4f9; margin: 0; padding: 20px; }
        .container { max-width: 650px; background: white; padding: 25px; border-radius: 8px; box-shadow: 0px 0px 10px rgba(0,0,0,0.1); margin: auto; }
        h2 { text-align: center; color: #333; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; color: #555; }
        input[type="text"], input[type="number"], select { width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
        button { background-color: #28a745; color: white; padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer; width: 100%; font-size: 16px; }
        button:hover { background-color: #218838; }
    </style>
</head>
<body>

<div class="container">
    <h2>Registro de Alumnos - Upem2</h2>
    <form action="guardar.php" method="POST">
        <div class="form-group">
            <label for="matricula">Matrícula:</label>
            <input type="text" id="matricula" name="matricula" required>
        </div>
        <div class="form-group">
            <label for="nombre">Nombre:</label>
            <input type="text" id="nombre" name="nombre" required>
        </div>
        <div class="form-group">
            <label for="apellido_paterno">Apellido Paterno:</label>
            <input type="text" id="apellido_paterno" name="apellido_paterno" required>
        </div>
        <div class="form-group">
            <label for="apellido_materno">Apellido Materno:</label>
            <input type="text" id="apellido_materno" name="apellido_materno" required>
        </div>
        <div class="form-group">
            <label for="curp">CURP:</label>
            <input type="text" id="curp" name="curp" maxlength="18" required>
        </div>
        <div class="form-group">
            <label for="edad">Edad:</label>
            <input type="number" id="edad" name="edad" required>
        </div>
        <div class="form-group">
            <label for="semestre">Semestre:</label>
            <select id="semestre" name="semestre" required>
                <option value="">Seleccione un semestre</option>
                <option value="1°">1°</option>
                <option value="2°">2°</option>
                <option value="3°">3°</option>
                <option value="4°">4°</option>
                <option value="5°">5°</option>
                <option value="6°">6°</option>
                <option value="7°">7°</option>
                <option value="8°">8°</option>
                <option value="9°">9°</option>
            </select>
        </div>
        <div class="form-group">
            <label for="licenciatura">Licenciatura:</label>
            <select id="licenciatura" name="licenciatura" required>
                <option value="">Seleccione una licenciatura</option>
                <option value="Actuaría">Actuaría</option>
                <option value="Administración">Administración</option>
                <option value="Biología">Biología</option>
                <option value="Contaduría">Contaduría</option>
                <option value="Ciencias de la Educación">Ciencias de la Educación</option>
                <option value="Computación">Computación</option>
                <option value="Informática">Informática</option>
                <option value="Optometría">Optometría</option>
                <option value="Pedagogía">Pedagogía</option>
                <option value="Psicología">Psicología</option>
                <option value="Veterinaria">Veterinaria</option>
                <option value="Educación">Educación</option>
                <option value="Economía">Economía</option>
                <option value="Matemáticas">Matemáticas</option>
                <option value="Física">Física</option>
                <option value="Química">Química</option>
                <option value="Medicina">Medicina</option>
            </select>
        </div>
        <button type="submit">Registrar Alumno</button>
    </form>
</div>

</body>
</html>
