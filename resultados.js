document.addEventListener("DOMContentLoaded", () => {
    const resultadosTable = document.getElementById("resultados-table").querySelector("tbody");

    // Obtener los resultados almacenados en el localStorage
    const searchResults = JSON.parse(localStorage.getItem("searchResults"));

    if (searchResults && searchResults.length > 0) {
        searchResults.forEach(result => {
            // Crear una fila por cada documento
            const row = document.createElement("tr");

            // Formatear la fecha y la hora
            const dateTime = new Date(result.dateTime.seconds * 1000);
            const formattedDateTime = `${dateTime.toLocaleDateString()} ${dateTime.toLocaleTimeString()}`;

            // Agregar los datos a la fila
            row.innerHTML = `
                <td>${result.firstName}</td>
                <td>${result.lastName}</td>
                <td>${result.age}</td>
                <td>${result.conditions}</td>
                <td>${result.systolic}</td>
                <td>${result.diastolic}</td>
                <td>${formattedDateTime}</td>
            `;

            // Añadir la fila a la tabla
            resultadosTable.appendChild(row);
        });
    } else {
        // Si no hay resultados, mostrar un mensaje
        const row = document.createElement("tr");
        row.innerHTML = `<td colspan="7">No se encontraron resultados.</td>`;
        resultadosTable.appendChild(row);
    }
});
