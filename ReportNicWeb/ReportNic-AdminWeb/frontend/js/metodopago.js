// Función para decodificar el token JWT
function parseJwt(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
}

// Obtener el token de sessionStorage o localStorage
const token = sessionStorage.getItem('token') || localStorage.getItem('token');

if (token) {
    const decodedToken = parseJwt(token);

    // Obtener el plan y el precio del token y mostrarlos en la página
    const selectedPlanElement = document.getElementById('selectedPlan');
    const selectedPriceElement = document.getElementById('selectedPrice');

    if (decodedToken.plan && decodedToken.price) {
        selectedPlanElement.textContent = decodedToken.plan;
        selectedPriceElement.textContent = decodedToken.price;
    } else {
        selectedPlanElement.textContent = 'No disponible';
        selectedPriceElement.textContent = 'No disponible';
    }
} else {
    console.error('Token no encontrado');
    document.getElementById('selectedPlan').textContent = 'Error: Token no encontrado';
    document.getElementById('selectedPrice').textContent = 'Error: Token no encontrado';
}

// Detectar tipo de tarjeta (Crédito/Débito)
document.getElementById('cardNumber').addEventListener('input', function () {
    const cardNumber = this.value.replace(/\s+/g, ''); // Elimina espacios
    const cardTypeElement = document.getElementById('cardType');

    const cardType = detectCardType(cardNumber);
    if (cardType) {
        cardTypeElement.textContent = `Tipo de tarjeta: ${cardType}`;
        cardTypeElement.style.display = 'block'; // Mostrar el tipo de tarjeta
    } else {
        cardTypeElement.style.display = 'none'; // Ocultar si no se detecta
    }
});

function detectCardType(number) {
    const cardPatterns = {
        'Visa': /^4[0-9]{12}(?:[0-9]{3})?$/,
        'MasterCard': /^5[1-5][0-9]{14}$/,
        'American Express': /^3[47][0-9]{13}$/,
        'Discover': /^6(?:011|5[0-9]{2})[0-9]{12}$/
    };

    for (const [type, pattern] of Object.entries(cardPatterns)) {
        if (pattern.test(number)) {
            return type;
        }
    }

    return null;
}

document.getElementById('paymentForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    // Obtener valores del formulario
    const cardName = document.getElementById('cardName').value;
    const cardNumber = document.getElementById('cardNumber').value;
    const expiryDate = document.getElementById('expiryDate').value;
    const cvv = document.getElementById('cvv').value;
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');

    // Validar número de tarjeta
    if (!validateCardNumber(cardNumber)) {
        alert('Número de tarjeta inválido.');
        return;
    }

    // Validar fecha de expiración
    if (!validateExpiryDate(expiryDate)) {
        alert('Fecha de expiración inválida o en el pasado.');
        return;
    }

    // Validar CVV
    if (!validateCVV(cvv)) {
        alert('CVV inválido.');
        return;
    }

    // Si todo es válido, procesar el pago
    if (cardName && token) {
        // Ocultar el formulario y mostrar el círculo de carga
        document.getElementById('paymentForm').classList.add('hidden');
        document.getElementById('loading').classList.remove('hidden');

        const decodedToken = parseJwt(token);
        const selectedPlan = decodedToken.plan;
        const selectedPrice = decodedToken.price;

        try {
            const response = await fetch('http://localhost:3002/api/suscripcion/guardarSuscripcion', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ selectedPlan, metodoPago: 'Tarjeta de credito' })
            });

            if (!response.ok) {
                throw new Error('Error al guardar la suscripción');
            }

            setTimeout(function () {
                document.getElementById('loading').classList.add('hidden');
                document.getElementById('confirmationMessage').classList.remove('hidden');
            }, 4000);

            setTimeout(function () {
                window.location.href = "admnistradorpriv.html";
            }, 6000);
        } catch (error) {
            console.error('Error:', error);
            alert('Hubo un problema al procesar el pago.');
        }
    } else {
        alert('Por favor, completa todos los campos correctamente.');
    }
});

// Validar número de tarjeta usando el algoritmo de Luhn
function validateCardNumber(number) {
    const regex = /^[0-9]{16}$/;
    if (!regex.test(number)) return false;

    let sum = 0;
    let shouldDouble = false;

    // Algoritmo de Luhn
    for (let i = number.length - 1; i >= 0; i--) {
        let digit = parseInt(number[i]);

        if (shouldDouble) {
            digit *= 2;
            if (digit > 9) digit -= 9;
        }

        sum += digit;
        shouldDouble = !shouldDouble;
    }

    return sum % 10 === 0;
}

// Validar fecha de expiración en formato MM/YY
function validateExpiryDate(date) {
    const [month, year] = date.split('/').map(Number);
    if (month < 1 || month > 12) return false;

    const currentDate = new Date();
    const expiryDate = new Date(`20${year}`, month - 1);

    return expiryDate >= currentDate;
}

// Validar CVV (3 o 4 dígitos)
function validateCVV(cvv) {
    const regex = /^[0-9]{3,4}$/;
    return regex.test(cvv);
}

function formatExpiryDate(input) {
    let value = input.value.replace(/\D/g, ''); // Eliminar cualquier carácter que no sea un número
    if (value.length >= 2) {
        input.value = value.substring(0, 2) + '/' + value.substring(2, 4); // Agregar la barra después del segundo número
    } else {
        input.value = value; // Dejar los dos primeros dígitos sin el '/'
    }
}
