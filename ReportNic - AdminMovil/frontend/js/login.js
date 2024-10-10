const loginForm = document.querySelector('form');
const userField = document.getElementById('username');
const passwordField = document.getElementById('password');
const errorMessageDiv = document.getElementById('error-message');
const checkbox = document.getElementById('checkbox');

// Función para cifrar el usuario (XOR básico)
function cifrarUsuario(usuario) {
    const clave = 'clave'; // Define una clave simple
    let cifrado = '';
    for (let i = 0; i < usuario.length; i++) {
        cifrado += String.fromCharCode(usuario.charCodeAt(i) ^ clave.charCodeAt(i % clave.length));
    }
    return cifrado;
}

// Función para enviar credenciales al backend
async function enviarCredenciales(usuario, contraseña) {
    try {
        const response = await fetch('http://localhost:3001/api/autenticacion/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ user: usuario, password: contraseña })
        });

        const data = await response.json();

        if (response.ok) {
            // Si la autenticación fue exitosa
            const usuarioCifrado = cifrarUsuario(usuario);

            if (checkbox.checked) {
                localStorage.setItem('usuario', usuarioCifrado);
            } else {
                sessionStorage.setItem('usuario', usuarioCifrado);
            }
            window.location.href = 'administrador.html';
        } else {
            // Si hubo un error (usuario o contraseña incorrectos)
            errorMessageDiv.textContent = data.error;
            errorMessageDiv.style.display = 'block';
        }
    } catch (error) {
        console.error('Error en la solicitud:', error);
        errorMessageDiv.textContent = 'Error al conectar con el servidor';
        errorMessageDiv.style.display = 'block';
    }
}

loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const usuario = userField.value;
    const contraseña = passwordField.value;

    // Limpiar mensaje de error previo
    errorMessageDiv.textContent = '';
    errorMessageDiv.style.display = 'none';

    // Enviar credenciales al backend para su verificación
    enviarCredenciales(usuario, contraseña);
});
