
    // Obtener el nombre del usuario desde localStorage y actualizar el nombre en el perfil
    const usuario = localStorage.getItem('usuario');
    if (usuario) {
        document.getElementById('nombreUsuario').textContent = usuario;
    }

    // Obtener el hospital desde localStorage y actualizar la institución
    const hospital = localStorage.getItem('hospital');
    let hospitalText = '';
    if (hospital === 'hospitalCarlosRobertoHuembes(Filial El Carmen)') {
        hospitalText = 'Hospital Carlos Roberto Huembes (Filial El Carmen)';
    } else if (hospital === 'hospitalSuMedico') {
        hospitalText = 'Hospital SuMedico';
    }
    
    document.getElementById('institucion').textContent = `Institución: ${hospitalText}`;