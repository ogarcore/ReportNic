document.addEventListener("DOMContentLoaded", () => {
    const resultadosTable = document.getElementById("resultados-table").querySelector("tbody");
    const searchResults = JSON.parse(localStorage.getItem("searchResults"));

    if (searchResults && searchResults.length > 0) {
        searchResults.forEach(result => {
            const row = document.createElement("tr");
            const dateTime = new Date(result.fechaYHora.seconds * 1000);
            const formattedDateTime = `${dateTime.toLocaleDateString()} ${dateTime.toLocaleTimeString()}`;
            row.innerHTML = `
                <td>${result.nombre}</td>
                <td>${result.apellidos}</td>
                <td>${result.edad}</td>
                <td>${result.afectaciones}</td>
                <td>${result.presionSistolica}</td>
                <td>${result.presionDiastolica}</td>
                <td>${formattedDateTime}</td>
            `;
            resultadosTable.appendChild(row);
        });
    } else {
        const row = document.createElement("tr");
        row.innerHTML = `<td colspan="7">No se encontraron resultados.</td>`;
        resultadosTable.appendChild(row);
    }
});

window.exportToExcel = function() {
    const table = document.getElementById("resultados-table");
    const workbook = XLSX.utils.table_to_book(table, { sheet: "Resultados" });
    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'binary' });

    function s2ab(s) {
        const buf = new ArrayBuffer(s.length);
        const view = new Uint8Array(buf);
        for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xFF;
        return buf;
    }

    const blob = new Blob([s2ab(wbout)], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resultados.xlsx';
    a.click();
    URL.revokeObjectURL(url);
}
