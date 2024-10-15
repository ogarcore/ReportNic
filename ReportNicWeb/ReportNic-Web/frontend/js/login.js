const loginForm = document.querySelector('form');
const userField = document.getElementById('user');
const passwordField = document.getElementById('password');
const hospitalField = document.getElementById('hospital');
const errorMessageDiv = document.getElementById('error-message');
const checkbox = document.getElementById('checkbox');

// Función para enviar credenciales al backend
async function enviarCredenciales(usuario, contraseña, hospital) {
    try {
        const response = await fetch('http://localhost:3003/api/autenticacion/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ user: usuario, password: contraseña, hospital: hospital })
        });

        const data = await response.json();

        if (response.ok) {
            const token = data.token;  // Recibes el JWT que incluye toda la información

            if (checkbox.checked) {
                localStorage.setItem('token', token);  // Guardas solo el token en localStorage
            } else {
                sessionStorage.setItem('token', token);  // O en sessionStorage
            }

            window.location.href = 'inicio.html';
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
    const hospital = hospitalField.value;  

    errorMessageDiv.textContent = '';
    errorMessageDiv.style.display = 'none';

    enviarCredenciales(usuario, contraseña, hospital);
});
