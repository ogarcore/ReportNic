const loginForm = document.querySelector('form');
const userField = document.getElementById('user');
const passwordField = document.getElementById('password');
const hospitalField = document.getElementById('hospital');
const errorMessageDiv = document.getElementById('error-message');
const checkbox = document.getElementById('checkbox');

const modal = document.getElementById('modal');
const closeModalButton = document.getElementById('closeModal');

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
            const token = data.token;

            if (checkbox.checked) {
                localStorage.setItem('token', token);
            } else {
                sessionStorage.setItem('token', token);
            }

            window.location.href = 'inicio.html';
        } else if (response.status === 403) {
            modal.style.display = 'block'; // Mostrar modal si la suscripción es false
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

closeModalButton.addEventListener('click', () => {
    modal.style.display = 'none';
    window.location.reload(); // Recarga la página después de cerrar el modal
});

loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const usuario = userField.value;
    const contraseña = passwordField.value;
    const hospital = hospitalField.value;

    errorMessageDiv.textContent = '';
    errorMessageDiv.style.display = 'none';

    enviarCredenciales(usuario, contraseña, hospital);
});
