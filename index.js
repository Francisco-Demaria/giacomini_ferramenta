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

    if (img !== '' && !img.startsWith('http') && !img.startsWith('img/')) {
        img = 'img/' + img;
    }

    if (img === '') {
        img = 'padrao.png';
    }

    // =========================================================
    // LÓGICA DE PREÇOS
    // =========================================================

    const precos = calcularPrecos(p);

    const precoTabela = precos.precoDe;
    const precoAVista = precos.precoVista;
    const precoParcelado = precos.precoParcelado;

    const valorParcela =
        (precoParcelado / 5)
            .toFixed(2)
            .replace('.', ',');

    // ---------------------------------------------------------
    // CASO 1:
    // Não existe preço especial na planilha
    // Usa a margem automática
    // ---------------------------------------------------------

    if (precoEspecial <= 0) {

        precoTabela = Math.floor(custo * 1.7) + 0.99;

        precoAVista = Math.floor(custo * 1.3) + 0.99;

        precoParcelado = Math.floor(custo * 1.5) + 0.99;

    }

    // ---------------------------------------------------------
    // CASO 2:
    // Existe um valor especial na planilha
    // ---------------------------------------------------------

    else {

        // O valor informado na planilha será usado
        // como preço especial à vista.
        precoAVista = precoEspecial;

        // Mantém o preço parcelado calculado normalmente
        // por enquanto.
        precoParcelado = Math.floor(custo * 1.5) + 0.99;

        // O "De:" será baseado no preço à vista.
        precoTabela = Math.floor(precoAVista * 1.3) + 0.99;
    }

    // Valor de cada parcela
    let valorParcela = (precoParcelado / 5)
        .toFixed(2)
        .replace('.', ',');


    // =========================================================
    // HTML DO CARD
    // =========================================================

    return `
        <a href="produto/produto.html?nome=${encodeURIComponent(p.nome)}"
           style="text-decoration:none; color:inherit;">

            <div class="cartao-produto">

                <div class="selo-desconto">
                    OFERTA
                </div>

                <img
                    src="${img}"
                    alt="${p.nome}"
                    onerror="this.src='padrao.png'"
                >

                <h3>${p.nome}</h3>

                <div
                    class="precos-container"
                    style="margin-top: auto; text-align: center;"
                >

                    <div
                        style="
                            text-decoration: line-through;
                            color: #999;
                            font-size: 0.85em;
                        "
                    >
                        De:
                        R$
                        ${precoTabela.toFixed(2).replace('.', ',')}
                    </div>

                    <div
                        style="
                            color: #666;
                            font-size: 0.85em;
                        "
                    >
                        Por apenas
                    </div>

                    <div
                        style="
                            color: var(--verde-principal);
                            font-weight: 900;
                            font-size: 1.4em;
                            margin-bottom: 5px;
                        "
                    >
                        R$
                        ${precoAVista.toFixed(2).replace('.', ',')}

                        <small style="font-size:0.5em">
                            à vista
                        </small>
                    </div>

                    <div
                        style="
                            color: #444;
                            font-size: 0.9em;
                            font-weight: bold;
                        "
                    >
                        ou 5x de R$ ${valorParcela}
                    </div>

                    <div
                        style="
                            color: #888;
                            font-size: 0.75em;
                            margin-bottom: 15px;
                        "
                    >
                        (R$
                        ${precoParcelado.toFixed(2).replace('.', ',')}
                        no cartão)
                    </div>

                    <button
                        class="btn-comprar"
                        style="width: 100%;"
                    >
                        Ver Detalhes
                    </button>

                </div>
            </div>

        </a>
    `;
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
        const produtos = await carregarProdutos();

        const produtosDisponiveis =
            produtos.filter(p => p.estoque > 0);

        const apenasMaquinas =
            produtosDisponiveis.filter(p =>
                !p.categoria.toLowerCase().includes('peça') &&
                !p.categoria.toLowerCase().includes('peca')
            );

        // DESTAQUES
        const destaques = [...apenasMaquinas].sort((a, b) => {
            if (a.estoque === b.estoque) {
                return Math.random() - 0.5;
            }

            return a.estoque - b.estoque;
        });

        const gridDest =
            document.getElementById('grid-destaques');

        if (gridDest) {
            gridDest.innerHTML =
                destaques
                    .slice(0, 3)
                    .map(p => criarCartao(p))
                    .join('');
        }

        // LANÇAMENTOS
        const lancamentos =
            apenasMaquinas.slice(-3).reverse();

        const gridLanc =
            document.getElementById('grid-lancamentos');

        if (gridLanc) {
            gridLanc.innerHTML =
                lancamentos.length > 0
                    ? lancamentos.map(p => criarCartao(p)).join('')
                    : '<p>Nenhum lançamento recente.</p>';
        }

        // PROMOÇÕES
        const promocoes =
            apenasMaquinas.filter(p =>
                p.precoAntigo > p.preco
            );

        const gridProm =
            document.getElementById('grid-promocoes');

        if (gridProm) {
            gridProm.innerHTML =
                promocoes.length > 0
                    ? promocoes
                        .slice(0, 3)
                        .map(p => criarCartao(p))
                        .join('')
                    : '<p>Nenhuma oferta ativa no momento.</p>';
        }

    } catch (erro) {
        console.error(
            'Erro ao carregar produtos:',
            erro
        );
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
