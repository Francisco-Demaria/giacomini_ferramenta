// =========================================================
// HOME — GIACOMINI FERRAMENTAS
// =========================================================

// =========================================================
// CARROSSEL PRINCIPAL
// =========================================================

const wrapper = document.getElementById('slider-wrapper');

let podeClicar = true;
let timerAutomatico = null;

function iniciarAutomatico() {
    if (!wrapper) return;

    clearInterval(timerAutomatico);

    timerAutomatico = setInterval(() => {
        mudarSlide(1);
    }, 5000);
}

function mudarSlide(direcao) {
    if (!wrapper || !podeClicar) return;

    podeClicar = false;

    clearInterval(timerAutomatico);

    const transicaoSuave =
        'transform 0.6s cubic-bezier(0.25, 0.8, 0.25, 1)';

    if (direcao === 1) {

        wrapper.style.transition = transicaoSuave;
        wrapper.style.transform = 'translateX(-100%)';

        setTimeout(() => {

            wrapper.style.transition = 'none';

            if (wrapper.firstElementChild) {
                wrapper.appendChild(
                    wrapper.firstElementChild
                );
            }

            wrapper.style.transform = 'translateX(0)';

            podeClicar = true;

            iniciarAutomatico();

        }, 600);

    } else {

        wrapper.style.transition = 'none';

        if (wrapper.lastElementChild) {
            wrapper.prepend(
                wrapper.lastElementChild
            );
        }

        wrapper.style.transform =
            'translateX(-100%)';

        setTimeout(() => {

            wrapper.style.transition =
                transicaoSuave;

            wrapper.style.transform =
                'translateX(0)';

        }, 50);

        setTimeout(() => {

            podeClicar = true;

            iniciarAutomatico();

        }, 650);
    }
}


// =========================================================
// CARDS DE PRODUTO
// =========================================================

function criarCartao(produto) {

    const img = obterImagem(
        produto.img,
        'padrao.png'
    );

    const precos = calcularPrecos(produto);

    const precoDe = precos.precoDe;
    const precoVista = precos.precoVista;
    const precoParcelado = precos.precoParcelado;

    const valorParcela =
        precoParcelado / 5;

    return `
        <a
            href="produto/produto.html?nome=${encodeURIComponent(produto.nome)}"
            class="link-produto"
        >

            <div class="cartao-produto">

                <div class="selo-desconto">
                    OFERTA
                </div>

                <img
                    src="${img}"
                    alt="${produto.nome}"
                    loading="lazy"
                    decoding="async"
                    onerror="this.src='padrao.png'"
                >

                <h3>
                    ${produto.nome}
                </h3>

                <div class="precos-container">

                    <div class="preco-tabela">
                        De:
                        R$ ${formatarPreco(precoDe)}
                    </div>

                    <div class="texto-por-apenas">
                        Por apenas
                    </div>

                    <div class="peco-vista">

                        R$
                        ${formatarPreco(precoVista)}

                        <small class="preco-vista-label">
                            à vista
                        </small>

                    </div>

                    <div class="preco-parcelado">
                        ou 5x de
                        R$ ${formatarPreco(valorParcela)}
                    </div>

                    <div class="info-parcelamento">

                        (R$
                        ${formatarPreco(precoParcelado)}
                        no cartão)

                    </div>

                    <button
                        class="btn-comprar"
                        type="button"
                    >
                        Ver Detalhes
                    </button>

                </div>

            </div>

        </a>
    `;
}


// =========================================================
// BUSCA
// =========================================================

function fazerBusca() {

    const input =
        document.getElementById('input-busca');

    if (!input) return;

    const termo =
        input.value.trim();

    if (!termo) return;

    window.location.href =
        'catalogo/catalogo.html?busca=' +
        encodeURIComponent(termo);
}


// =========================================================
// PRODUTOS DA HOME
// =========================================================

async function carregarDados() {

    try {

        const produtos =
            await carregarProdutos();

        const produtosDisponiveis =
            produtos.filter(
                produto => produto.estoque > 0
            );

        const apenasMaquinas =
            produtosDisponiveis.filter(
                produto => !ehPeca(produto)
            );


        // =====================================================
        // DESTAQUES
        // =====================================================

        const destaques =
            [...apenasMaquinas].sort(
                (a, b) => {

                    if (
                        a.estoque === b.estoque
                    ) {
                        return Math.random() - 0.5;
                    }

                    return a.estoque - b.estoque;
                }
            );

        const gridDest =
            document.getElementById(
                'grid-destaques'
            );

        if (gridDest) {

            gridDest.innerHTML =
                destaques
                    .slice(0, 3)
                    .map(criarCartao)
                    .join('');

        }


        // =====================================================
        // LANÇAMENTOS
        // =====================================================

        const lancamentos =
            apenasMaquinas
                .slice(-3)
                .reverse();

        const gridLanc =
            document.getElementById(
                'grid-lancamentos'
            );

        if (gridLanc) {

            gridLanc.innerHTML =
                lancamentos.length > 0
                    ? lancamentos
                        .map(criarCartao)
                        .join('')
                    : '<p>Nenhum lançamento recente.</p>';

        }


        // =====================================================
        // PROMOÇÕES
        // =====================================================

        const promocoes =
            apenasMaquinas.filter(
                produto =>
                    produto.precoDe >
                    produto.precoVista
            );

        const gridProm =
            document.getElementById(
                'grid-promocoes'
            );

        if (gridProm) {

            gridProm.innerHTML =
                promocoes.length > 0
                    ? promocoes
                        .slice(0, 3)
                        .map(criarCartao)
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


// =========================================================
// CARROSSEL DE MARCAS
// =========================================================

function inicializarCarrosselMarcas() {

    const track =
        document.getElementById(
            'track-marcas'
        );

    const btnNext =
        document.getElementById(
            'btn-next'
        );

    const btnPrev =
        document.getElementById(
            'btn-prev'
        );

    if (!track || !btnNext || !btnPrev) {
        return;
    }

    let isAnimating = false;


    // ---------------------------------------------------------
    // PRÓXIMO
    // ---------------------------------------------------------

    btnNext.addEventListener(
        'click',
        () => {

            if (isAnimating) return;

            const firstItem =
                track.firstElementChild;

            if (!firstItem) return;

            isAnimating = true;

            const itemWidth =
                firstItem.offsetWidth + 60;

            track.style.transition =
                'transform 0.4s ease-in-out';

            track.style.transform =
                `translateX(-${itemWidth}px)`;


            setTimeout(() => {

                track.style.transition =
                    'none';

                track.appendChild(
                    firstItem
                );

                track.style.transform =
                    'translateX(0)';

                isAnimating = false;

            }, 400);

        }
    );


    // ---------------------------------------------------------
    // ANTERIOR
    // ---------------------------------------------------------

    btnPrev.addEventListener(
        'click',
        () => {

            if (isAnimating) return;

            const firstItem =
                track.firstElementChild;

            const lastItem =
                track.lastElementChild;

            if (!firstItem || !lastItem) {
                return;
            }

            isAnimating = true;

            const itemWidth =
                firstItem.offsetWidth + 60;

            track.insertBefore(
                lastItem,
                firstItem
            );

            track.style.transition =
                'none';

            track.style.transform =
                `translateX(-${itemWidth}px)`;

            void track.offsetWidth;

            track.style.transition =
                'transform 0.4s ease-in-out';

            track.style.transform =
                'translateX(0)';


            setTimeout(() => {

                isAnimating = false;

            }, 400);

        }
    );
}


// =========================================================
// INICIALIZAÇÃO
// =========================================================

document.addEventListener(
    'DOMContentLoaded',
    () => {

        inicializarCarrosselMarcas();

        iniciarAutomatico();

    }
);

window.addEventListener(
    'load',
    () => {

        carregarDados();

    }
);