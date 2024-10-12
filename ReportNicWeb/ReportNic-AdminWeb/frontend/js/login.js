const loginForm = document.querySelector('form');
const userField = document.getElementById('text');
const passwordField = document.getElementById('password');
const errorMessageDiv = document.getElementById('error-message');
const checkbox = document.getElementById('checkbox');


// Función para enviar credenciales al backend
async function enviarCredenciales(usuario, contraseña) {
    try {
        const response = await fetch('http://localhost:3002/api/autenticacion/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ user: usuario, password: contraseña })
        });

        const data = await response.json();

        if (response.ok) {
            // Si la autenticación fue exitosa
            const token = data.token; // Recibir el JWT del servidor

            if (checkbox.checked) {
                localStorage.setItem('token', token);
            } else {
                sessionStorage.setItem('token', token);
            }
            window.location.href = 'administrador.html';
        } else {
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