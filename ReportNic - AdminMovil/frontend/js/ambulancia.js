const API_BASE_URL = 'http://localhost:3001/api'; // Asegúrate de que esta URL apunte a tu backend

document.addEventListener('DOMContentLoaded', () => {
    const ambulanceList = document.getElementById('ambulanceList');
    const addAmbulanciaBtn = document.getElementById('addAmbulancia');
    const searchBtn = document.getElementById('searchBtn');
    const viewAllBtn = document.getElementById('viewAllBtn');
    const searchInput = document.getElementById('searchInput');

    // Modales
    const addModal = document.getElementById('addModal');
    const closeAddModal = document.getElementById('closeAddModal');
    const addAmbulanciaForm = document.getElementById('addAmbulanciaForm');
    const addError = document.getElementById('addError');

    const messageModal = document.getElementById('messageModal');
    const closeMessageModal = document.getElementById('closeMessageModal');
    const messageText = document.getElementById('messageText');

    const confirmModal = document.getElementById('confirmModal');
    const confirmDeleteBtn = document.getElementById('confirm-delete');
    const cancelDeleteBtn = document.getElementById('cancel-delete');

    let ambulancias = [];
    let ambulanceToDelete = null;

    // Función para obtener todas las ambulancias
    const fetchAmbulancias = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/ambulancias`);
            if (!response.ok) {
                throw new Error(`Error: ${response.status} ${response.statusText}`);
            }
            ambulancias = await response.json();
            renderAmbulancias(ambulancias);
        } catch (error) {
            console.error("Error obteniendo ambulancias:", error);
            // No mostrar modal de error; opcionalmente, podrías mostrar un mensaje en la interfaz
        }
    };

    // Función para renderizar las ambulancias en el DOM
    const renderAmbulancias = (data) => {
        ambulanceList.innerHTML = '';
        data.forEach(ambulancia => {
            const paramedicos = ambulancia.paramedicos || { actual: 0, max: 0 };
    
            const ambulanceRow = document.createElement('div');
            ambulanceRow.classList.add('ambulance-row');
            ambulanceRow.dataset.id = ambulancia.id;
    
            ambulanceRow.innerHTML = `
                <button class="toggle-details-btn">Paramédicos</button>
                <div class="ambulance-info">
                    <div class="ambulance-code-matricula">
                        <span class="ambulance-code">${ambulancia.codigo}</span>
                        <span class="ambulance-matricula">${ambulancia.matricula}</span>
                    </div>
                    <div class="paramedic-status">
                        <span class="status-circle ${ambulancia.capacidad ? 'green' : 'red'}"></span>
                        <span class="paramedics-count">${paramedicos.actual}/${paramedicos.max}</span>
                    </div>
                </div>
                <div class="ambulance-actions">
                    <div class="capacidad">
                        <label class="switch">
                            <input type="checkbox" class="capacidad-switch" ${ambulancia.disponibilidad ? 'checked' : ''}>
                            <span class="slider"></span>
                        </label>
                        <span class="capacidad-label">Disponibilidad</span>
                    </div>
                    <button class="delete-btn">🗑️</button>
                </div>
                <div class="ambulance-details" style="display: none;">
                    <!-- Información de paramédicos se mostrará aquí -->
                    <div class="paramedic-info"></div>
                </div>
            `;
    
            ambulanceList.appendChild(ambulanceRow);
        });
    
        addEventListeners();
    };
    // Función para agregar eventos a los elementos recién creados
    const addEventListeners = () => {
        // Toggle de detalles de paramédicos
        const toggleBtns = document.querySelectorAll('.toggle-details-btn');
        toggleBtns.forEach(btn => {
            btn.addEventListener('click', async () => {
                const details = btn.parentElement.querySelector('.ambulance-details');
                const paramedicInfoDiv = details.querySelector('.paramedic-info');
                const ambulanceCode = btn.closest('.ambulance-row').querySelector('.ambulance-code').textContent;
    
                if (details.style.display === 'none' || details.style.display === '') {
                    // Mostrar detalles
                    details.style.display = 'block';
                    // Llamar a la función para obtener la información del paramédico
                    await fetchParamedicoInfo(ambulanceCode, paramedicInfoDiv);
    
                    // Aquí llamamos a updateParamedicoCount para incrementar el número de paramédicos si hay uno disponible
                    await updateParamedicoCount(ambulanceCode, 1);
                } else {
                    // Ocultar detalles y disminuir el número de paramédicos
                    details.style.display = 'none';
                    // Aquí llamamos a handleTurnoFalse para disminuir el número de paramédicos
                    await handleTurnoFalse(ambulanceCode, paramedicInfoDiv);
                }
            });
        });
    

        // Switch de capacidad
        const capacidadSwitches = document.querySelectorAll('.capacidad-switch');
        capacidadSwitches.forEach(switchElement => {
            switchElement.addEventListener(' change', async (event) => {
                const isChecked = event.target.checked;
                const ambulanceRow = event.target.closest('.ambulance-row');
                const id = ambulanceRow.dataset.id;

                try {
                    const response = await fetch(`${API_BASE_URL}/ambulancias/${id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ disponibilidad: isChecked }),
                    });

                    if (response.ok) {
                        // Actualizar el color del indicador
                        const statusCircle = ambulanceRow.querySelector('.status-circle');
                        statusCircle.classList.toggle('green', isChecked);
                        statusCircle.classList.toggle('red', !isChecked);
                    } else {
                        const errorData = await response.json();
                        throw new Error(errorData.mensaje || 'Error actualizando capacidad');
                    }
                } catch (error) {
                    console.error("Error actualizando capacidad:", error);
                    // No mostrar modal de error
                    // Opcional: Mostrar mensaje de error en un elemento de la interfaz
                }
            });
        });

        // Botones de eliminar
        const deleteBtns = document.querySelectorAll('.delete-btn');
        deleteBtns.forEach(deleteBtn => {
            deleteBtn.addEventListener('click', () => {
                const ambulanceRow = deleteBtn.closest('.ambulance-row');
                const id = ambulanceRow.dataset.id;
                ambulanceToDelete = { id, element: ambulanceRow };
                confirmModal.style.display = 'flex';
            });
        });
    };

    // Agregar una nueva ambulancia mediante el formulario
    addAmbulanciaForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        addError.textContent = ''; // Limpiar mensajes de error

        const codigo = document.getElementById('code').value.trim();
        const matricula = document.getElementById('matricula').value.trim();
        const max = document.getElementById('max').value.trim();

        if (!codigo || !matricula || !max) {
            addError.textContent = 'Todos los campos son obligatorios.';
            return;
        }

        if (isNaN(max) || Number(max) <= 0) {
            addError.textContent = 'La capacidad máxima debe ser un número positivo.';
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/ambulancias`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ codigo, matricula, max }),
            });

            if (response.ok) {
                const nuevaAmbulancia = await response.json();
                ambulancias.push(nuevaAmbulancia);
                renderAmbulancias(ambulancias);
                addAmbulanciaForm.reset();
                addModal.style.display = 'none';
                showMessage('Ambulancia agregada correctamente.', true);
            } else {
                const errorData = await response.json();
                addError.textContent = `Error: ${errorData.mensaje}`;
            }
        } catch (error) {
            console.error("Error agregando ambulancia:", error);
            addError.textContent = `Error al agregar ambulancia: ${error.message}`;
        }
    });

    // Mostrar el modal de agregar ambulancia
    addAmbulanciaBtn.addEventListener('click', () => {
        addModal.style.display = 'flex';
    });

    // Cerrar el modal de agregar ambulancia
    closeAddModal.addEventListener('click', () => {
        addModal.style.display = 'none';
        addAmbulanciaForm.reset();
        addError.textContent = '';
    });

    // Buscar ambulancias por matrícula
    searchBtn.addEventListener('click', () => {
        const query = searchInput.value.trim().toLowerCase();
        const resultados = ambulancias.filter(ambulancia => ambulancia.matricula.toLowerCase().includes(query));
        renderAmbulancias(resultados);
    });

    // Ver todas las ambulancias
    viewAllBtn.addEventListener('click', () => {
        renderAmbulancias(ambulancias);
    });

    // Confirmar eliminación
    confirmDeleteBtn.addEventListener('click', async () => {
        if (!ambulanceToDelete) return;

        const { id, element } = ambulanceToDelete;

        try {
            const response = await fetch(`${API_BASE_URL}/ambulancias/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                ambulancias = ambulancias.filter(ambulancia => ambulancia.id !== id);
                renderAmbulancias(ambulancias);
                showMessage('Ambulancia eliminada correctamente.', true);
            } else {
                const errorData = await response.json();
                throw new Error(errorData.mensaje || 'Error al eliminar ambulancia');
            }
        } catch (error) {
            console.error("Error eliminando ambulancia:", error);
            // No mostrar modal de error
        } finally {
            confirmModal.style.display = 'none';
            ambulanceToDelete = null;
        }
    });

    const fetchParamedicoInfo = async (codigo, paramedicInfoDiv) => {
        try {
            const response = await fetch(`${API_BASE_URL}/turnos?codigo=${codigo}`);
            if (!response.ok) {
                throw new Error(`Error: ${response.status} ${response.statusText}`);
            }
    
            const turnos = await response.json();
            const turnoParamedico = turnos.find(turno => turno.enTurno === true);
    
            if (turnoParamedico) {
                paramedicInfoDiv.innerHTML = `
                    <p>Nombre: ${turnoParamedico.nombre} ${turnoParamedico.apellido}</p>
                    <p>Inicio del Turno: ${turnoParamedico.fechaInicio}</p>
                `;
            } else {
                paramedicInfoDiv.innerHTML = `<p>No hay paramédicos en turno para esta ambulancia.</p>`;
            }
        } catch (error) {
            console.error("Error obteniendo la información del paramédico:", error);
            paramedicInfoDiv.innerHTML = `<p>Error cargando la información del paramédico.</p>`;
        }
    };

    const updateParamedicoCount = async (codigo, incremento) => {
        try {
            const response = await fetch(`${API_BASE_URL}/updateParamedicoCount/${codigo}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ incremento })
            });
    
            if (!response.ok) {
                throw new Error(`Error: ${response.status} ${response.statusText}`);
            }
    
            const result = await response.json();
            console.log("Conteo de paramédicos actualizado:", result.mensaje);
        } catch (error) {
            console.error("Error actualizando el conteo de paramédicos:", error);
        }
    };

    const handleTurnoFalse = async (codigo, paramedicInfoDiv) => {
        try {
            await fetch(`${API_BASE_URL}/updateParamedicoCount/${codigo}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ incremento: -1 }),
            });
    
            // Remover la información del paramédico en la interfaz
            paramedicInfoDiv.innerHTML = '';
        } catch (error) {
            console.error("Error removiendo paramédico:", error);
        }
    };


    // Cancelar eliminación
    cancelDeleteBtn.addEventListener('click', () => {
        confirmModal.style.display = 'none';
        ambulanceToDelete = null;
    });

    // Cerrar el modal de mensajes
    closeMessageModal.addEventListener('click', () => {
        messageModal.style.display = 'none';
    });

    // Mostrar mensajes de éxito o error
    const showMessage = (msg, isSuccess) => {
        messageText.textContent = msg;
        messageModal.classList.remove('success', 'error');
        if (isSuccess) {
            messageModal.classList.add('success');
        } else {
            messageModal.classList.add('error');
        }
        messageModal.style.display = 'flex';
    };

    // Cerrar modales al hacer clic fuera de ellos
    window.addEventListener('click', (event) => {
        if (event.target == addModal) {
            addModal.style.display = 'none';
            addAmbulanciaForm.reset();
            addError.textContent = '';
        }
        if (event.target == messageModal) {
            messageModal.style.display = 'none';
        }
        if (event.target == confirmModal) {
            confirmModal.style.display = 'none';
            ambulanceToDelete = null;
        }
    });

    // Inicializar obteniendo todas las ambulancias
    fetchAmbulancias();
});