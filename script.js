document.addEventListener('DOMContentLoaded', () => {
    // Escuchar cambios en todo el formulario para cálculos en vivo
    document.getElementById('mainCalculator').addEventListener('input', updateLiveCalculations);

    document.getElementById('calculateBtn').addEventListener('click', generateVisualReport);
    document.getElementById('debtFreeMode').addEventListener('change', loadDistributionPresets);

    document.getElementById('addFixedBtn').addEventListener('click', () => addRow('fixedContainer', '', ''));
    document.getElementById('addCategoryBtn').addEventListener('click', () => addRow('categoryContainer', '', ''));

    // NUEVO: Listener para el botón CSV
    document.getElementById('downloadCsvBtn').addEventListener('click', downloadAsCsv);

    // Cargar plantillas por defecto al inicio
    loadFixedPresets();
    loadDistributionPresets();
});

// --- GENERACIÓN DINÁMICA DE FILAS ---
function loadFixedPresets() {
    const container = document.getElementById('fixedContainer');
    container.innerHTML = '';
    addRow('fixedContainer', 'Casa / Alquiler', '');
    addRow('fixedContainer', 'Comida / Supermercado', '');
    addRow('fixedContainer', 'Luz / Servicios', '');
    addRow('fixedContainer', 'Transporte / Gasolina', '');
}

function loadDistributionPresets() {
    const isDebtFree = document.getElementById('debtFreeMode').checked;
    const container = document.getElementById('categoryContainer');
    container.innerHTML = '';

    if (!isDebtFree) {
        addRow('categoryContainer', '🔥 Abono a Deudas', '');
        addRow('categoryContainer', '🛡️ Mini Fondo', '');
        addRow('categoryContainer', '🎮 Ocio / Gustos', '');
    } else {
        addRow('categoryContainer', '🚀 Ahorro Mayor', '');
        addRow('categoryContainer', '📚 Educación', '');
        addRow('categoryContainer', '😎 Calidad de Vida', '');
    }
    updateLiveCalculations();
}

// Función universal para agregar filas a cualquier contenedor
function addRow(containerId, name, amount) {
    const container = document.getElementById(containerId);
    const row = document.createElement('div');
    row.className = 'category-row';

    row.innerHTML = `
        <input type="text" class="cat-name" placeholder="Concepto (Ej. Luz, Internet)" value="${name}">
        <div class="row-controls">
            <span class="currency-label">RD$</span>
            <input type="number" class="cat-amount" placeholder="0.00" value="${amount}" min="0">
            <span class="percent-badge">0%</span>
            <button type="button" class="remove-btn" onclick="this.parentElement.parentElement.remove(); updateLiveCalculations();" title="Eliminar">✖</button>
        </div>
    `;
    container.appendChild(row);
}

function updateLiveCalculations() {
    const income = parseFloat(document.getElementById('income').value) || 0;

    // 1. Calcular Gastos Fijos
    let totalFixed = 0;
    const fixedRows = document.querySelectorAll('#fixedContainer .category-row');

    fixedRows.forEach(row => {
        const amount = parseFloat(row.querySelector('.cat-amount').value) || 0;
        totalFixed += amount;
        const percent = income > 0 ? ((amount / income) * 100).toFixed(1) : 0;
        row.querySelector('.percent-badge').innerText = `${percent}%`;
    });

    // Actualizar UI de Gastos Fijos
    document.getElementById('liveFixedTotal').innerText = formatMoney(totalFixed);
    const totalFixedPercent = income > 0 ? ((totalFixed / income) * 100).toFixed(1) : 0;
    document.getElementById('liveFixedPercent').innerText = `(${totalFixedPercent}% del ingreso)`;

    // 2. Calcular Sobrante
    const remaining = income - totalFixed;
    const remainingBox = document.getElementById('remainingBox');
    document.getElementById('liveRemaining').innerText = formatMoney(remaining);

    // --- MOSTRAR/OCULTAR SECCIÓN DE DISTRIBUCIÓN ---
    const distControls = document.getElementById('distributionControls');
    const noSurplusMsg = document.getElementById('noSurplusMessage');

    if (remaining <= 0) {
        // Ocultar controles y mostrar mensaje
        distControls.style.display = 'none';
        noSurplusMsg.style.display = 'block';

        // Poner la caja de sobrante en color rojo de alerta
        remainingBox.style.backgroundColor = '#fef2f2';
        remainingBox.style.color = '#dc2626';
        remainingBox.style.borderColor = '#fca5a5';

        if (remaining < 0) {
            noSurplusMsg.innerHTML = `⚠️ Tus gastos fijos superan tus ingresos por RD$ ${formatMoney(Math.abs(remaining))}.<br>No tienes nada que distribuir.`;
        }
    } else {
        // Mostrar controles y ocultar mensaje
        distControls.style.display = 'block';
        noSurplusMsg.style.display = 'none';

        // Restaurar la caja de sobrante a su color azul original
        remainingBox.style.backgroundColor = '#dbeafe';
        remainingBox.style.color = '#1e3a8a';
        remainingBox.style.borderColor = '#bfdbfe';
    }

    // 3. Calcular Distribución (Solo si hay dinero)
    let totalDistributed = 0;
    const distRows = document.querySelectorAll('#categoryContainer .category-row');

    distRows.forEach(row => {
        const amount = parseFloat(row.querySelector('.cat-amount').value) || 0;
        totalDistributed += amount;
        const percent = remaining > 0 ? ((amount / remaining) * 100).toFixed(1) : 0;
        row.querySelector('.percent-badge').innerText = `${percent}%`;
    });

    // Validaciones de Distribución Excedida
    const warningText = document.getElementById('amountWarning');
    if (remaining > 0 && totalDistributed > remaining) {
        warningText.innerHTML = `⚠️ Cuidado: Estás distribuyendo RD$ ${formatMoney(totalDistributed - remaining)} más de lo que te sobra.`;
    } else {
        warningText.innerHTML = '';
    }
}

// --- REPORTE VISUAL FINAL ---
function generateVisualReport() {
    updateLiveCalculations(); // Asegurar datos frescos

    const income = parseFloat(document.getElementById('income').value) || 0;
    const container = document.getElementById('breakdown');
    const statusMsg = document.getElementById('statusMessage');
    const resultSection = document.getElementById('results');

    container.innerHTML = '';

    if (income <= 0) {
        alert("Por favor ingresa un ingreso válido para generar el reporte.");
        return;
    }

    // Recopilar Gastos Fijos
    let totalFixed = 0;
    document.querySelectorAll('#fixedContainer .category-row').forEach(row => {
        totalFixed += parseFloat(row.querySelector('.cat-amount').value) || 0;
    });

    const remaining = income - totalFixed;

    // Tarjeta Maestra de Gastos Fijos
    let html = `
        <div class="result-card" style="border-left-color: #64748b;">
            <div>🏠 Gastos Fijos Consolidados</div>
            <span class="amount">RD$ ${formatMoney(totalFixed)}</span>
            <div class="desc">Suma de casa, comida y servicios.</div>
        </div>
    `;

    if (remaining <= 0) {
        statusMsg.innerHTML = `<h3 style="color: red; text-align: center;">⚠️ Alerta de Supervivencia: No hay capital libre.</h3>`;
        container.innerHTML = html;
        resultSection.style.display = 'block';
        return;
    }

    statusMsg.innerHTML = `<h3 style="text-align: center; color: #2563eb;">Plan de Distribución (Sobrante: RD$ ${formatMoney(remaining)})</h3>`;

    // Recopilar Distribución
    document.querySelectorAll('#categoryContainer .category-row').forEach(row => {
        const name = row.querySelector('.cat-name').value || 'Otros';
        const amount = parseFloat(row.querySelector('.cat-amount').value) || 0;
        const percentStr = row.querySelector('.percent-badge').innerText;

        if (amount > 0) {
            let borderColor = "var(--primary)";
            let bgClass = "";
            let nameLower = name.toLowerCase();

            if (nameLower.includes('deuda') || nameLower.includes('préstamo') || nameLower.includes('abono')) {
                borderColor = "var(--danger)"; bgClass = "priority";
            } else if (nameLower.includes('ahorro') || nameLower.includes('fondo') || nameLower.includes('educación')) {
                borderColor = "var(--success)"; bgClass = "savings";
            }

            html += `
                <div class="result-card ${bgClass}" style="border-left-color: ${borderColor};">
                    <div>${name} (${percentStr})</div>
                    <span class="amount">RD$ ${formatMoney(amount)}</span>
                </div>
            `;
        }
    });

    container.innerHTML = html;
    resultSection.style.display = 'block';
}

function formatMoney(amount) {
    return amount.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function downloadAsCsv() {
    let csvLines = [];

    // 1. Crear los encabezados de las columnas
    csvLines.push("Tipo,Concepto,Monto (RD$),Porcentaje");

    // 2. Agregar el Ingreso
    const income = parseFloat(document.getElementById('income').value) || 0;
    csvLines.push(`Ingreso,Quincena Total,${income},100%`);

    // 3. Agregar los Gastos Fijos
    const fixedRows = document.querySelectorAll('#fixedContainer .category-row');
    let totalFixed = 0;
    fixedRows.forEach(row => {
        let name = row.querySelector('.cat-name').value || 'Gasto Fijo';
        name = name.replace(/,/g, ''); // Quitamos comas para que no rompa el CSV

        const amount = parseFloat(row.querySelector('.cat-amount').value) || 0;
        const percent = row.querySelector('.percent-badge').innerText;

        totalFixed += amount;
        csvLines.push(`Gasto Fijo,${name},${amount},${percent}`);
    });

    // 4. Agregar la fila de Resumen (Sobrante)
    const remaining = income - totalFixed;
    csvLines.push(`Resumen,Sobrante Disponible,${remaining},-`);

    // 5. Agregar la Distribución (Ahorros, Deudas, etc.)
    const distRows = document.querySelectorAll('#categoryContainer .category-row');
    distRows.forEach(row => {
        let name = row.querySelector('.cat-name').value || 'Distribucion';
        name = name.replace(/,/g, '');

        const amount = parseFloat(row.querySelector('.cat-amount').value) || 0;
        const percent = row.querySelector('.percent-badge').innerText;

        csvLines.push(`Distribucion,${name},${amount},${percent}`);
    });

    // 6. Generar el archivo y forzar la descarga
    const csvString = csvLines.join("\n");
    // El "\uFEFF" asegura que Excel lea correctamente los acentos (UTF-8 con BOM)
    const blob = new Blob(["\uFEFF" + csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    // Nombre del archivo con la fecha actual
    link.download = `Presupuesto_${new Date().toISOString().slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}