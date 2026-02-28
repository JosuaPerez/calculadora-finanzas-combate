document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('calculateBtn').addEventListener('click', calculateDistribution);
    document.getElementById('debtFreeMode').addEventListener('change', loadPresets);
    document.getElementById('addCategoryBtn').addEventListener('click', () => addCategoryRow('', 0));

    // Listeners para los nuevos botones de exportar
    document.getElementById('downloadPicBtn').addEventListener('click', downloadAsImage);
    document.getElementById('downloadPdfBtn').addEventListener('click', downloadAsPdf);

    // Cargar la plantilla por defecto al inicio
    loadPresets();
});

// --- FUNCIONES DE PERSONALIZACIÓN ---
function loadPresets() {
    const isDebtFree = document.getElementById('debtFreeMode').checked;
    const container = document.getElementById('categoryContainer');
    container.innerHTML = '';

    if (!isDebtFree) {
        addCategoryRow('🔥 Abono a Deudas', 75);
        addCategoryRow('🛡️ Mini Fondo', 15);
        addCategoryRow('🎮 Ocio / Gustos', 10);
    } else {
        addCategoryRow('🚀 Ahorro Mayor', 60);
        addCategoryRow('📚 Educación', 20);
        addCategoryRow('😎 Calidad de Vida', 20);
    }
}

function addCategoryRow(name, percent) {
    const container = document.getElementById('categoryContainer');
    const row = document.createElement('div');
    row.className = 'category-row';

    row.innerHTML = `
        <input type="text" class="cat-name" placeholder="Nombre (ej. Donación)" value="${name}">
        <input type="number" class="cat-percent" placeholder="%" value="${percent}" min="0" max="100">
        <button type="button" class="remove-btn" onclick="this.parentElement.remove()" title="Eliminar">X</button>
    `;
    container.appendChild(row);
}

function calculateDistribution() {
    const income = parseFloat(document.getElementById('income').value) || 0;
    const fixedExpenses = parseFloat(document.getElementById('expenses').value) || 0;
    
    const container = document.getElementById('breakdown');
    const statusMsg = document.getElementById('statusMessage');
    const resultSection = document.getElementById('results');
    const warningText = document.getElementById('percentWarning');

    container.innerHTML = '';
    warningText.innerHTML = '';

    if (income <= 0) {
        alert("Por favor ingresa un ingreso válido.");
        return;
    }

    const remainingCapital = income - fixedExpenses;

    let html = `
        <div class="result-card" style="border-left-color: #64748b;">
            <div>🏠 Gastos Fijos (Intocable)</div>
            <span class="amount">RD$ ${formatMoney(fixedExpenses)}</span>
            <div class="desc">Para la casa y servicios básicos</div>
        </div>
    `;

    if (remainingCapital <= 0) {
        statusMsg.innerHTML = `<h3 style="color: red; text-align: center;">⚠️ Cuidado: Tus gastos superan o igualan tus ingresos.</h3>`;
        container.innerHTML = html;
        resultSection.style.display = 'block';
        return;
    }

    statusMsg.innerHTML = `<h3 style="text-align: center; color: #2563eb;">Tienes RD$ ${formatMoney(remainingCapital)} libres para distribuir:</h3>`;

    const rows = document.querySelectorAll('.category-row');
    let totalPercent = 0;
    let categories = [];

    rows.forEach(row => {
        const name = row.querySelector('.cat-name').value || 'Otros';
        const percent = parseFloat(row.querySelector('.cat-percent').value) || 0;
        totalPercent += percent;
        categories.push({ name, percent });
    });

    if (totalPercent !== 100) {
        warningText.innerHTML = `⚠️ Atención: Tus porcentajes suman ${totalPercent}%. Lo ideal es 100% para distribuir el capital exactamente.`;
    }

    categories.forEach(cat => {
        if (cat.percent > 0) {
            const amount = remainingCapital * (cat.percent / 100);
            let borderColor = "var(--primary)";
            let bgClass = "";
            let nameLower = cat.name.toLowerCase();

            if (nameLower.includes('deuda') || nameLower.includes('préstamo')) {
                borderColor = "var(--danger)"; bgClass = "priority";
            } else if (nameLower.includes('ahorro') || nameLower.includes('fondo') || nameLower.includes('inversión')) {
                borderColor = "var(--success)"; bgClass = "savings";
            }

            html += `
                <div class="result-card ${bgClass}" style="border-left-color: ${borderColor};">
                    <div>${cat.name} (${cat.percent}%)</div>
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

// --- NUEVAS FUNCIONES PARA EXPORTAR ---

// 1. Guardar como Imagen PNG
function downloadAsImage() {
    const areaCaptura = document.getElementById('captureArea');
    const botonPic = document.getElementById('downloadPicBtn');

    botonPic.innerText = "⏳ Generando Imagen...";
    botonPic.disabled = true;

    // Usamos html2canvas para convertir el HTML en un Canvas (imagen)
    html2canvas(areaCaptura, {
        backgroundColor: "#ffffff",
        scale: 2,
        logging: false,
        useCORS: true
    }).then(canvas => {
        // Convertimos el canvas a una URL de imagen base64
        const image = canvas.toDataURL("image/png");
        
        // Creamos un enlace temporal "fantasma" para forzar la descarga
        const link = document.createElement('a');
        link.href = image;
        link.download = `Plan_Financiero_ModoGuerra_${new Date().toLocaleDateString()}.png`;
        link.click(); // Hacemos clic programáticamente

        // Restauramos el botón
        botonPic.innerText = "💾 Guardar como Imagen (PNG)";
        botonPic.disabled = false;
    });
}

// 2. Guardar como Reporte PDF
function downloadAsPdf() {
    // jspdf requiere acceder a uMD
    const { jsPDF } = window.jspdf;
    const areaCaptura = document.getElementById('captureArea');
    const botonPdf = document.getElementById('downloadPdfBtn');

    botonPdf.innerText = "⏳ Generando PDF...";
    botonPdf.disabled = true;

    // Primero tomamos la captura con html2canvas
    html2canvas(areaCaptura, {
        scale: 2, logging: false
    }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        
        // Creamos documento PDF (Orientación vertical 'p', milímetros 'mm', tamaño A4)
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        // Calculamos dimensiones para que la imagen quepa en el PDF manteniendo proporción
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
        
        const finalWidth = imgWidth * ratio - 20;
        const finalHeight = imgHeight * ratio;

        // Añadimos un título de cabecera al PDF
        pdf.setFontSize(18);
        pdf.setTextColor(37, 99, 235);
        pdf.text("Reporte de Distribución Quincenal", 10, 15);
        pdf.setFontSize(10);
        pdf.setTextColor(100, 116, 139); // Gris
        pdf.text(`Generado el: ${new Date().toLocaleString('es-DO')}`, 10, 22);

        // Insertamos la imagen capturada dentro del PDF
        pdf.addImage(imgData, 'PNG', 10, 30, finalWidth, finalHeight);
        
        // Descargamos el archivo
        pdf.save(`Reporte_ModoGuerra_${new Date().toISOString().slice(0,10)}.pdf`);

        // Restauramos el botón
        botonPdf.innerText = "📄 Descargar Reporte (PDF)";
        botonPdf.disabled = false;
    });
}