// ==========================================================
// |  DIYBELLO - TELA DO CARRINHO E CHECKOUT                |
// |  Montar o carrinho é público, finalizar exige login.   |
// |  POST /pedidos (privada) converte o LocalStorage       |
// |  em uma venda real e deduz o estoque no backend.       |
// ==========================================================

// Chave onde o "Monte sua Caixa" guarda a mensagem do cartão de presente
const CHAVE_MENSAGEM = 'diybello_mensagem_presente'

document.addEventListener('DOMContentLoaded', () => {

    if (!protegerTela()) return


    desenharCarrinho()

    // Toggle do cartão de presente
    const toggleMensagem = document.getElementById('toggle_mensagem')
    const campoObservacao = document.getElementById('observacao')

    toggleMensagem.addEventListener('change', () => {
        campoObservacao.style.display = toggleMensagem.checked ? 'block' : 'none'
        if (!toggleMensagem.checked) campoObservacao.value = ''
    })

    // Se o cliente veio do "Monte sua Caixa" com mensagem preenchida, já abre o campo
    const mensagemPresente = localStorage.getItem(CHAVE_MENSAGEM)
    if (mensagemPresente) {
        toggleMensagem.checked = true
        campoObservacao.style.display = 'block'
        campoObservacao.value = mensagemPresente
    }

    document.getElementById('cupom').addEventListener('input', desenharResumo)

    document.getElementById('btn_finalizar').addEventListener('click', finalizarPedido)

    document.getElementById('btn_limpar_carrinho').addEventListener('click', () => {
        const totais = calcularTotaisCarrinho()

        if (totais.itens.length === 0) {
            mostrarMensagem('resposta', 'O carrinho já está vazio.', 'aviso')
            return
        }

        confirmarAcao({
            titulo: 'Esvaziar carrinho',
            mensagem: `Remover os ${totais.quantidadeTotal} item(ns) do seu carrinho?`,
            detalhe: totais.itens.map(i => `${i.quantidade}x ${i.nome}`).join('<br>'),
            textoConfirmar: 'Esvaziar carrinho',
            perigo: true,
            aoConfirmar: () => {
                limparCarrinho()
                localStorage.removeItem(CHAVE_MENSAGEM)
                desenharCarrinho()
                mostrarMensagem('resposta', 'Carrinho esvaziado.', 'info')
            }
        })
    })

    // Aviso de login logo abaixo do botão de finalizar
    const aviso = document.getElementById('aviso_login')

    if (!estaLogado()) {
        aviso.innerHTML = 'Você precisa estar logado para finalizar. <a href="../index.html">Entrar agora</a>.'
    } else {
        aviso.textContent = `Comprando como ${pegarUsuario().nome}.`
    }
})

const SVG_LIXEIRA = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>`

// ---------------- LISTA DOS ITENS ----------------
function desenharCarrinho() {

    const itens = lerCarrinho()
    const lista = document.getElementById('lista_itens')

    if (itens.length === 0) {
        lista.innerHTML = `
            <div class="vazio">
                <p>Seu carrinho está vazio.</p>
                <a href="./catalogo.html" class="botao" style="margin-top: 12px;">Ver o catálogo</a>
            </div>
        `
        desenharResumo()
        return
    }

    // Busca imagens frescas da API para evitar URLs desatualizadas no LocalStorage
    fetch(`${API_URL}/produtos`)
        .then(res => res.json())
        .then(produtos => {
            const itensAtualizados = itens.map(item => {
                const atual = Array.isArray(produtos) && produtos.find(p => p.id === item.produto_id)
                return atual ? { ...item, imagem_url: atual.imagem_url } : item
            })
            renderizarItens(lista, itensAtualizados)
        })
        .catch(() => renderizarItens(lista, itens))
}

function renderizarItens(lista, itens) {
    lista.innerHTML = itens.map(item => `
        <div class="item_carrinho">
            <img src="${resolverImagem(item.imagem_url)}" alt="${item.nome}" onerror="this.src='../img/placeholder.svg'">

            <div>
                <strong>${item.nome}</strong>
                <p class="ajuda">${formatarPreco(item.preco)} cada - estoque: ${item.estoque_atual}</p>
                <div class="item_carrinho_qtd">
                    <button class="botao_secundario btn_menos" data-id="${item.produto_id}">-</button>
                    <span><strong>${item.quantidade}</strong></span>
                    <button class="botao_secundario btn_mais" data-id="${item.produto_id}">+</button>
                    <button class="botao_perigo botao_pequeno btn_remover" data-id="${item.produto_id}" title="Remover item">${SVG_LIXEIRA}</button>
                </div>
            </div>

            <div>
                <strong>${formatarPreco(item.preco * item.quantidade)}</strong>
            </div>
        </div>
    `).join('')

    lista.querySelectorAll('.btn_menos').forEach(botao => {
        botao.addEventListener('click', () => {
            const id = Number(botao.dataset.id)
            const item = lerCarrinho().find(i => i.produto_id === id)
            alterarQuantidade(id, item.quantidade - 1)
            desenharCarrinho()
        })
    })

    lista.querySelectorAll('.btn_mais').forEach(botao => {
        botao.addEventListener('click', () => {
            const id = Number(botao.dataset.id)
            const item = lerCarrinho().find(i => i.produto_id === id)
            alterarQuantidade(id, item.quantidade + 1)
            desenharCarrinho()
        })
    })

    lista.querySelectorAll('.btn_remover').forEach(botao => {
        botao.addEventListener('click', () => {
            removerDoCarrinho(Number(botao.dataset.id))
            desenharCarrinho()
        })
    })

    desenharResumo()
}

// ---------------- RESUMO COM AS REGRAS DE DESCONTO ----------------
function desenharResumo() {

    const cupom = document.getElementById('cupom').value
    const totais = calcularTotaisCarrinho(cupom)

    let regras = ''

    if (totais.regras.length > 0) {
        regras = `
            <div class="regras_desconto">
                <strong>Descontos aplicados:</strong>
                <ul>${totais.regras.map(r => `<li>${r}</li>`).join('')}</ul>
            </div>
        `
    }

    let avisoCupom = ''

    if (totais.erroCupom) {
        avisoCupom = `<div class="mensagem erro">${totais.erroCupom}</div>`
    }

    let avisoFrete = ''

    if (totais.frete > 0 && totais.subtotal > 0) {
        const faltam = FRETE_GRATIS_ACIMA_DE - (totais.subtotal - totais.desconto)
        avisoFrete = `<div class="mensagem aviso">Faltam ${formatarPreco(faltam)} para o frete grátis!</div>`
    }

    document.getElementById('resumo_valores').innerHTML = `
        ${avisoCupom}
        <div class="resumo_linha"><span>Itens (${totais.quantidadeTotal})</span><span>${formatarPreco(totais.subtotal)}</span></div>
        <div class="resumo_linha"><span>Descontos</span><span>- ${formatarPreco(totais.desconto)}</span></div>
        <div class="resumo_linha"><span>Frete</span><span>${totais.frete === 0 ? 'Grátis' : formatarPreco(totais.frete)}</span></div>
        <div class="resumo_linha total"><span>Total</span><span>${formatarPreco(totais.total)}</span></div>
        ${avisoFrete}
        ${regras}
    `

    document.getElementById('btn_finalizar').disabled = totais.itens.length === 0
}

// ---------------- CHECKOUT (POST /pedidos - rota privada) ----------------
function finalizarPedido() {

    const totais = calcularTotaisCarrinho(document.getElementById('cupom').value)

    if (totais.itens.length === 0) {
        mostrarMensagem('resposta', 'Adicione produtos ao carrinho antes de finalizar.', 'aviso')
        return
    }

    if (totais.erroCupom) {
        mostrarMensagem('resposta', 'Corrija ou apague o cupom antes de finalizar.', 'erro')
        return
    }

    // A conversão do carrinho em venda só acontece com o usuário logado
    if (!estaLogado()) {
        alert('Você precisa estar logado para finalizar o pedido.')
        window.location.href = '../index.html'
        return
    }

    const valores = {
        itens: totais.itens.map(item => ({
            produto_id: item.produto_id,
            quantidade: item.quantidade
        })),
        cupom: totais.cupom,
        forma_pagamento: document.getElementById('forma_pagamento').value,
        observacao: document.getElementById('observacao').value
    }

    const botao = document.getElementById('btn_finalizar')
    botao.disabled = true
    botao.textContent = 'Processando...'

    fetch(`${API_URL}/pedidos`, {
        method: 'POST',
        headers: cabecalhoAutorizacao(),
        body: JSON.stringify(valores)
    })
        .then(tratarResposta)
        .then(dados => {
            botao.disabled = false
            botao.textContent = 'Finalizar pedido'

            if (dados.error) {
                mostrarMensagem('resposta', dados.error, 'erro')
                return
            }

            limparCarrinho()
            localStorage.removeItem(CHAVE_MENSAGEM)
            desenharCarrinho()

            abrirModal({
                titulo: 'Pedido confirmado!',
                subtitulo: `Pedido #${dados.pedido.id} · ${formatarPreco(dados.resumo.total)}`,
                corpo: `
                    <div style="text-align:center;padding:8px 0 20px;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>
                    </div>
                    <div class="modal_detalhe">
                        <div class="resumo_linha"><span>Pagamento</span><span>${dados.pedido.forma_pagamento}</span></div>
                        <div class="resumo_linha"><span>Descontos</span><span>- ${formatarPreco(dados.resumo.desconto)}</span></div>
                        <div class="resumo_linha"><span>Frete</span><span>${dados.resumo.frete === 0 ? 'Grátis' : formatarPreco(dados.resumo.frete)}</span></div>
                        <div class="resumo_linha total"><span>Total pago</span><span>${formatarPreco(dados.resumo.total)}</span></div>
                    </div>
                    <div style="margin-top:16px;padding:12px 14px;background:var(--creme-2);border-radius:var(--raio);border:var(--borda);">
                        <p class="ajuda" style="margin:0 0 2px;">Código de rastreio</p>
                        <strong style="font-size:1rem;letter-spacing:.04em;">${dados.pedido.entregaPedido.codigo_rastreio}</strong>
                    </div>
                `,
                botoes: `
                    <a href="./loja.html" class="botao botao_secundario">Continuar comprando</a>
                    <a href="./meusPedidos.html" class="botao">Ver meus pedidos</a>
                `
            })
        })
        .catch((err) => {
            botao.disabled = false
            botao.textContent = 'Finalizar pedido'
            console.error('Erro ao finalizar o pedido!', err)
            mostrarMensagem('resposta', 'Não foi possível finalizar o pedido.', 'erro')
        })
}
