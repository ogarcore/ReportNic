// Escucha los clics en los botones de compra
document.querySelectorAll('.buy-btn').forEach(button => {
    button.addEventListener('click', async function() {
        // Obtener el plan y el precio del botón clicado
        const plan = this.getAttribute('data-plan');
        const price = this.getAttribute('data-price');

        // Buscar el token existente en sessionStorage o localStorage
        const existingToken = sessionStorage.getItem('token') || localStorage.getItem('token');
        let storageType = 'sessionStorage'; // Valor por defecto

        // Determinar si el token está en localStorage o sessionStorage
        if (localStorage.getItem('token')) {
            storageType = 'localStorage';
        }

        if (existingToken) {
            // Actualizar el token con el nuevo plan y precio
            const updatedToken = await actualizarToken(existingToken, plan, price);

            // Guardar el token actualizado en el mismo almacenamiento donde estaba el original
            if (storageType === 'localStorage') {
                localStorage.setItem('token', updatedToken);
            } else {
                sessionStorage.setItem('token', updatedToken);
            }

            // Redirigir a la página de pago
            window.location.href = 'metodopago.html';
        } else {
            console.error('No se encontró un token existente');
        }
    });
});

// Función para actualizar el token JWT existente
async function actualizarToken(token, plan, price) {
    const response = await fetch('http://localhost:3002/api/suscripcion/actualizarToken', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ plan, price })
    });

        const data = await response.json();
        console.log('Token actualizado:', data.token);  // Verifica si el token está presente
        return data.token;
}

const logoutButton = document.getElementById('logout');

// Función para cerrar sesión
logoutButton.addEventListener('click', (e) => {
    e.preventDefault(); // Prevenir el comportamiento por defecto del enlace

    // Limpiar el localStorage
    localStorage.clear();
    sessionStorage.clear();

    // Redirigir al index.html
    window.location.href = '../html/index.html';
});
