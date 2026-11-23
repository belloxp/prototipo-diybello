// ==========================================================
// |  DIYBELLO - GRÁFICOS DOS RELATÓRIOS                    |
// |  Usa o Chart.js quando ele consegue ser baixado do CDN |
// |  e, se estiver sem internet, desenha um gráfico de      |
// |  barras simples em HTML para não deixar a tela vazia.   |
// ==========================================================

// Paleta alinhada com a identidade violeta da loja
const CORES_GRAFICO = [
    '#6D5DF4', '#8B5CF6', '#C084FC', '#10B981',
    '#F5A524', '#3B82F6', '#F43F5E', '#5338E0'
]

// Guarda as instâncias para poder recriar sem duplicar
const graficosAtivos = {}

// desenharGrafico('grafico_categoria', 'doughnut', ['A','B'], [10, 5], 'Vendas')
function desenharGrafico(canvasId, tipo, labels, valores, rotulo) {

    const canvas = document.getElementById(canvasId)

    if (!canvas) return

    // Sem Chart.js (rede sem CDN) cai no desenho manual
    if (typeof Chart === 'undefined') {
        desenharFallback(canvas, labels, valores)
        return
    }

    if (graficosAtivos[canvasId]) {
        graficosAtivos[canvasId].destroy()
    }

    const ehCircular = tipo === 'doughnut' || tipo === 'pie'

    graficosAtivos[canvasId] = new Chart(canvas.getContext('2d'), {
        type: tipo,
        data: {
            labels,
            datasets: [{
                label: rotulo || '',
                data: valores,
                backgroundColor: ehCircular ? CORES_GRAFICO : CORES_GRAFICO[0],
                borderColor: tipo === 'line' ? CORES_GRAFICO[0] : 'transparent',
                borderWidth: tipo === 'line' ? 3 : 0,
                borderRadius: tipo === 'bar' ? 8 : 0,
                tension: 0.35,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: ehCircular, position: 'bottom' }
            },
            scales: ehCircular ? {} : {
                y: { beginAtZero: true }
            }
        }
    })
}

// Gráfico de barras bem simples, só com HTML, para o modo offline
function desenharFallback(canvas, labels, valores) {

    const maior = Math.max(...valores, 1)

    const barras = labels.map((rotulo, i) => {
        const largura = (valores[i] / maior) * 100
        const cor = CORES_GRAFICO[i % CORES_GRAFICO.length]

        return `
            <div style="margin-bottom: 12px;">
                <div style="display:flex; justify-content:space-between; font-size:.82rem; font-weight:600; margin-bottom:4px;">
                    <span>${rotulo}</span><span>${valores[i]}</span>
                </div>
                <div style="background:#EDEBF8; border-radius:999px; height:12px; overflow:hidden;">
                    <div style="width:${largura}%; height:100%; background:${cor}; border-radius:999px;"></div>
                </div>
            </div>
        `
    }).join('')

    const substituto = document.createElement('div')
    substituto.className = 'grafico_svg'
    substituto.style.minWidth = '0'
    substituto.innerHTML = barras

    canvas.replaceWith(substituto)
}
