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
            const token = data.token;

            // Guardar el token según la selección del checkbox
            if (checkbox.checked) {
                localStorage.setItem('token', token);
            } else {
                sessionStorage.setItem('token', token);
            }

            // Hacer una nueva solicitud para obtener el tipo de hospital y suscripción
            const hospitalDataResponse = await fetch('http://localhost:3002/api/autenticacion/hospitalData', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const hospitalData = await hospitalDataResponse.json();

            if (hospitalDataResponse.ok) {
                // Verificar el tipo de hospital y suscripción
                if (hospitalData.tipoHospital === 'Privado') {
                    if (hospitalData.suscripcion) {
                        window.location.href = 'admnistradorpriv.html';
                    } else {
                        window.location.href = 'membresias.html';
                    }
                } else {
                    window.location.href = 'administrador.html';
                }
            } else {
                errorMessageDiv.textContent = hospitalData.error;
                errorMessageDiv.style.display = 'block';
            }
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

const togglePassword = document.getElementById('toggle-password');

togglePassword.addEventListener('click', () => {
    // Cambiar el tipo del input entre "password" y "text"
    const type = passwordField.type === 'password' ? 'text' : 'password';
    passwordField.type = type;

    // Cambiar la imagen del ícono
    if (type === 'password') {
        togglePassword.src = "../images/esconder.png"; // Imagen para ojo cerrado
    } else {
        togglePassword.src = "../images/ojo.png"; // Imagen para ojo abierto
    }
});


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