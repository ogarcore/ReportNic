// frontend.js (o como se llame tu archivo JS)

const loginForm = document.querySelector('form');
const userField = document.getElementById('text');
const passwordField = document.getElementById('password');
const checkbox = document.getElementById('checkbox'); // Asegúrate de tener este elemento en tu HTML

// Función para cifrar el usuario (si aún deseas mantener esta funcionalidad)
    function cifrarUsuario(usuario) {
    const clave = 'clave'; // Define una clave para la encriptación
    let cifrado = '';
    for (let i = 0; i < usuario.length; i++) {
        cifrado += String.fromCharCode(usuario.charCodeAt(i) ^ clave.charCodeAt(i % clave.length));
    }
    return cifrado;
    }

    loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();  

    const usuario = userField.value;
    const contraseña = passwordField.value;
    const errorMessageDiv = document.getElementById('error-message');  

    errorMessageDiv.textContent = '';
    errorMessageDiv.style.display = 'none';

    try {
        const response = await fetch('http://localhost:3000/api/login', { // Asegúrate de ajustar la URL según tu despliegue
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ usuario, contraseña })
        });

        const data = await response.json();

        if (response.ok) {
        // Cifrar el nombre de usuario antes de almacenarlo
        const usuarioCifrado = cifrarUsuario(usuario);
        
        // Guardar en localStorage o sessionStorage según el checkbox
        if (checkbox.checked) {
            localStorage.setItem('usuario', usuarioCifrado);
        } else {
            sessionStorage.setItem('usuario', usuarioCifrado);
        }

        window.location.href = 'administrador.html';  
        } else {
        errorMessageDiv.textContent = data.mensaje || 'Error al autenticar.';
        errorMessageDiv.style.display = 'block';  
        }
    } catch (error) {
        console.error("Error al comunicarse con el servidor:", error);
        errorMessageDiv.textContent = 'Error al comunicarse con el servidor.';
        errorMessageDiv.style.display = 'block';  
    }
    });
