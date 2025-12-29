const bcrypt = require('bcryptjs');

const passwordPlano = "tu_password_aqui"; // Pon la contraseña que quieras

bcrypt.hash(passwordPlano, 10, (err, hash) => {
    if (err) console.log(err);
    console.log("Copia este Hash y pégalo en el campo password de tu DB:");
    console.log(hash);
});