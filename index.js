const URL_PLANILHA = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSjwdcNetNoRZzXi20wyCVlMwhQf86ckoI8ZcIDui7wnvQpxUg7NIAio6HEu_CMHqyG1yT4Rcee_q6H/pub?output=csv';

function atualizarContador() {
    let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
    let contador = document.getElementById('contador-carrinho');
    if(contador) contador.innerText = carrinho.length;
}

function fazerBusca() {
    let termo = document.getElementById('input-busca').value;
    // Removido o ../ pois o index já está na raiz
    if(termo.trim() !== '') window.location.href = 'catalogo/catalogo.html?busca=' + encodeURIComponent(termo);
}

function criarCartao(p) {
    let img = p.img;
    if (img !== '' && !img.startsWith('http') && !img.startsWith('../img/')) { img = '../img/' + img; }
    if (img === '') img = '../padrao.png';

    // CÁLCULO DOS PREÇOS (Baseado no custo da planilha)
    // À vista: Custo * 1.35 e arredonda para baixo + 0.99
    let precoAVista = Math.floor(p.preco * 1.35) + 0.99;
    // Parcelado: Custo * 1.45 e arredonda para baixo + 0.99
    let precoParcelado = Math.floor(p.preco * 1.45) + 0.99;
    let valorParcela = (precoParcelado / 5).toFixed(2).replace('.', ',');

    return `
        <a href="../produto/produto.html?nome=${encodeURIComponent(p.nome)}" style="text-decoration:none; color:inherit;">
            <div class="cartao-produto">
                <img src="${img}" alt="${p.nome}" onerror="this.src='../padrao.png'">
                <h3>${p.nome}</h3>
                
                <div class="precos-container" style="margin-top: auto; text-align: center;">
                    <div style="color: #666; font-size: 0.85em;">À vista</div>
                    <div style="color: var(--verde-principal); font-weight: 900; font-size: 1.4em; margin-bottom: 5px;">
                        R$ ${precoAVista.toFixed(2).replace('.', ',')}
                    </div>
                    
                    <div style="color: #444; font-size: 0.9em; font-weight: bold;">
                        5x de R$ ${valorParcela}
                    </div>
                    <div style="color: #888; font-size: 0.75em; margin-bottom: 15px;">
                        (R$ ${precoParcelado.toFixed(2).replace('.', ',')} no cartão)
                    </div>
                    
                    <button class="btn-comprar" style="width: 100%;">Ver Detalhes</button>
                </div>
            </div>
        </a>`;
}

function abrirMenu() { document.getElementById('menu-lateral').classList.add('aberto'); document.getElementById('overlay').style.display = 'block'; }
function fecharMenu() { document.getElementById('menu-lateral').classList.remove('aberto'); document.getElementById('overlay').style.display = 'none'; }

// --- CARROSSEL INFINITO E AUTOMÁTICO ---
const wrapper = document.getElementById('slider-wrapper');
let podeClicar = true; // Trava de segurança para não bugar se clicar muito rápido
let timerAutomatico; // Variável que vai guardar o "motorzinho" do modo automático

// 1. Função que faz o carrossel andar sozinho
function iniciarAutomatico() {
    // Roda a função mudarSlide para a frente (1) a cada 5000 milissegundos (5 segundos)
    timerAutomatico = setInterval(() => {
        mudarSlide(1);
    }, 5000); 
}

// 2. A mágica do Loop Infinito
function mudarSlide(direcao) {
    if (!podeClicar) return; // Se a animação ainda estiver rodando, ignora o clique
    podeClicar = false;

    // Se o usuário clicou, a gente "zera" o relógio automático para não pular dois slides de vez
    clearInterval(timerAutomatico);
    iniciarAutomatico();

    // A transição suave original do seu CSS
    const transicaoSuave = 'transform 0.6s cubic-bezier(0.25, 0.8, 0.25, 1)';

    if (direcao === 1) {
        // --- INDO PARA A FRENTE (SETA DIREITA) ---
        wrapper.style.transition = transicaoSuave;
        wrapper.style.transform = 'translateX(-100%)'; // Empurra para a esquerda
        
        // Quando a animação terminar (600ms), fazemos o truque de mágica:
        setTimeout(() => {
            wrapper.style.transition = 'none'; // Desliga o movimento suave rapidinho
            wrapper.appendChild(wrapper.firstElementChild); // Pega o slide que passou e cola no final da fila
            wrapper.style.transform = 'translateX(0)'; // Volta a caixa para a posição neutra instantaneamente
            podeClicar = true; // Libera para clicar de novo
        }, 600);

    } else {
        // --- INDO PARA TRÁS (SETA ESQUERDA) ---
        wrapper.style.transition = 'none'; // Desliga o movimento suave
        wrapper.prepend(wrapper.lastElementChild); // Pega o último slide da fila e joga para o começo
        wrapper.style.transform = 'translateX(-100%)'; // Esconde ele lá na esquerda instantaneamente
        
        // Um mini-atraso de 50ms só para o navegador perceber a mudança antes de animar
        setTimeout(() => {
            wrapper.style.transition = transicaoSuave; // Religa o movimento suave
            wrapper.style.transform = 'translateX(0)'; // Puxa o slide suavemente para o centro da tela
        }, 50);

        // Libera para clicar de novo quando a animação terminar
        setTimeout(() => {
            podeClicar = true;
        }, 650);
    }
}

// 3. Dá a partida no modo automático assim que a página é carregada
iniciarAutomatico();

async function carregarDados() {
    try {
        const resposta = await fetch(URL_PLANILHA);
        const dadosTexto = await resposta.text();
        const linhas = dadosTexto.split(/\r?\n/).slice(1).filter(l => l.trim() !== "");

        let produtos = linhas.map(linha => {
            const col = linha.split(',');
            if (col.length < 8) return null;

            return {
                nome: col[0] ? col[0].trim() : '',
                categoria: col[1] ? col[1].trim() : '',
                subcategoria: col[2] ? col[2].trim() : '',
                preco: parseFloat(col[3]) || 0,
                precoAntigo: parseFloat(col[4]) || 0,
                img: col[5] ? col[5].trim() : '',
                estoque: parseInt(col[6]) || 0,
                descricao: col[7] ? col[7].trim() : ''
            };
        }).filter(p => p !== null && p.estoque > 0);

        // 1. Tira as peças da página inicial
        let apenasMaquinas = produtos.filter(p => !p.categoria.toLowerCase().includes('peça') && !p.categoria.toLowerCase().includes('peca'));

        // 2. DESTAQUES: Produtos com MENOR estoque (se empatar, mistura aleatoriamente)
        let destaques = [...apenasMaquinas].sort((a, b) => {
            if (a.estoque === b.estoque) return Math.random() - 0.5;
            return a.estoque - b.estoque; 
        });
        let gridDest = document.getElementById('grid-destaques');
        if(gridDest) gridDest.innerHTML = destaques.slice(0, 3).map(p => criarCartao(p)).join('');
        
        // 3. LANÇAMENTOS: Os últimos adicionados na planilha
        let lancamentos = apenasMaquinas.slice(-3).reverse();
        let gridLanc = document.getElementById('grid-lancamentos');
        if(gridLanc) gridLanc.innerHTML = lancamentos.length > 0 ? lancamentos.map(p => criarCartao(p)).join('') : "<p style='width:100%; text-align:center;'>Nenhum lançamento recente.</p>";
        
        // 4. PROMOÇÕES: Maior porcentagem de desconto
        let promocoes = apenasMaquinas.filter(p => p.precoAntigo > p.preco);
        promocoes.sort((a, b) => {
            let descA = (a.precoAntigo - a.preco) / a.precoAntigo;
            let descB = (b.precoAntigo - b.preco) / b.precoAntigo;
            return descB - descA; // Traz o maior desconto primeiro
        });
        let gridProm = document.getElementById('grid-promocoes');
        if(gridProm) gridProm.innerHTML = promocoes.length > 0 ? promocoes.slice(0, 3).map(p => criarCartao(p)).join('') : "<p style='width:100%; text-align:center;'>Nenhuma oferta ativa no momento.</p>";

    } catch (erro) {
        console.error("Erro na planilha", erro);
    }
}

window.onload = () => { carregarDados(); atualizarContador(); };

// ... (O resto do seu código do carrossel continua igualzinho aqui pra baixo) ...
document.addEventListener('DOMContentLoaded', () => {
    const track = document.getElementById('track-marcas');
    const btnNext = document.getElementById('btn-next');
    const btnPrev = document.getElementById('btn-prev');
    let isAnimating = false;
    btnNext.addEventListener('click', () => {
        if (isAnimating) return;
        isAnimating = true;
        const firstItem = track.firstElementChild;
        const itemWidth = firstItem.offsetWidth + 60; 
        track.style.transition = 'transform 0.4s ease-in-out';
        track.style.transform = `translateX(-${itemWidth}px)`;
        setTimeout(() => {
            track.style.transition = 'none'; 
            track.appendChild(firstItem); 
            track.style.transform = 'translateX(0)'; 
            isAnimating = false;
        }, 400); 
    });
    btnPrev.addEventListener('click', () => {
        if (isAnimating) return;
        isAnimating = true;
        const lastItem = track.lastElementChild;
        const firstItem = track.firstElementChild;
        const itemWidth = firstItem.offsetWidth + 60;
        track.insertBefore(lastItem, firstItem);
        track.style.transition = 'none';
        track.style.transform = `translateX(-${itemWidth}px)`;
        void track.offsetWidth;
        track.style.transition = 'transform 0.4s ease-in-out';
        track.style.transform = 'translateX(0)';
        setTimeout(() => { isAnimating = false; }, 400);
    });
});
