const wrapper = document.getElementById("slider-wrapper");

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

    const transicao = "transform 0.6s cubic-bezier(0.25, 0.8, 0.25, 1)";

    if (direcao === 1) {
        wrapper.style.transition = transicao;
        wrapper.style.transform = "translateX(-100%)";

        setTimeout(() => {
            wrapper.style.transition = "none";

            if (wrapper.firstElementChild) {
                wrapper.appendChild(wrapper.firstElementChild);
            }

            wrapper.style.transform = "translateX(0)";
            podeClicar = true;
            iniciarAutomatico();
        }, 600);
    } else {
        wrapper.style.transition = "none";

        if (wrapper.lastElementChild) {
            wrapper.prepend(wrapper.lastElementChild);
        }

        wrapper.style.transform = "translateX(-100%)";

        setTimeout(() => {
            wrapper.style.transition = transicao;
            wrapper.style.transform = "translateX(0)";
        }, 50);

        setTimeout(() => {
            podeClicar = true;
            iniciarAutomatico();
        }, 650);
    }
}

function fazerBusca2() {
    const input = document.getElementById("input-busca");
    const termo = input?.value.trim();

    if (!termo) return;

    window.location.href =
        "catalogo2.html?busca=" + encodeURIComponent(termo);
}

function criarCartaoHome2(produto) {
    return `
        <a href="produto2.html?id=${encodeURIComponent(produto.id)}" class="link-produto">
            <div class="cartao-produto">
                <img
                    src="${escapeHtml2(produto.img)}"
                    alt="${escapeHtml2(produto.nome)}"
                    loading="lazy"
                    decoding="async"
                    onerror="this.src='../padrao.png'"
                >

                <h3>${escapeHtml2(produto.nome)}</h3>

                <div class="precos-container">
                    <div class="peco-vista">
                        R$ ${formatarPreco2(produto.precoVista)}
                        <small class="preco-vista-label">à vista</small>
                    </div>

                    <div class="preco-parcelado">
                        Cartão: ${formatarPreco2(produto.precoParcelado)}
                    </div>

                    <div class="info-parcelamento">
                        ${produto.sobEncomenda ? "Disponível sob encomenda" : "Disponível"}
                    </div>

                    <button class="btn-comprar" type="button">
                        Ver Detalhes
                    </button>
                </div>
            </div>
        </a>
    `;
}

async function carregarDados2() {
    try {
        // A home nunca pede 45 mil produtos.
        const dados = await carregarProdutos2({
            porPagina: 3
        });

        const produtos = dados.produtos;

        document.getElementById("grid-destaques").innerHTML =
            produtos.slice(0, 3).map(criarCartaoHome2).join("");

        document.getElementById("grid-lancamentos").innerHTML =
            produtos.slice(0, 3).map(criarCartaoHome2).join("");

        document.getElementById("grid-promocoes").innerHTML =
            produtos
                .filter(p => p.precoDe > p.precoVista)
                .slice(0, 3)
                .map(criarCartaoHome2)
                .join("") ||
            "<p>Nenhuma oferta ativa no momento.</p>";
    } catch (erro) {
        console.error(erro);

        const mensagem = `
            <p class="mensagem-produtos">
                Não foi possível carregar os produtos de teste.
            </p>
        `;

        ["grid-destaques", "grid-lancamentos", "grid-promocoes"]
            .forEach(id => {
                const el = document.getElementById(id);
                if (el) el.innerHTML = mensagem;
            });
    }
}

function inicializarCarrosselMarcas() {
    const track = document.getElementById("track-marcas");
    const btnNext = document.getElementById("btn-next");
    const btnPrev = document.getElementById("btn-prev");

    if (!track || !btnNext || !btnPrev) return;

    let animando = false;

    btnNext.addEventListener("click", () => {
        if (animando || !track.firstElementChild) return;

        animando = true;

        const largura =
            track.firstElementChild.offsetWidth + 60;

        track.style.transition = "transform 0.4s ease-in-out";
        track.style.transform = `translateX(-${largura}px)`;

        setTimeout(() => {
            track.style.transition = "none";
            track.appendChild(track.firstElementChild);
            track.style.transform = "translateX(0)";
            animando = false;
        }, 400);
    });

    btnPrev.addEventListener("click", () => {
        if (animando || !track.lastElementChild) return;

        animando = true;

        const largura =
            track.firstElementChild.offsetWidth + 60;

        track.insertBefore(
            track.lastElementChild,
            track.firstElementChild
        );

        track.style.transition = "none";
        track.style.transform = `translateX(-${largura}px)`;

        void track.offsetWidth;

        track.style.transition = "transform 0.4s ease-in-out";
        track.style.transform = "translateX(0)";

        setTimeout(() => {
            animando = false;
        }, 400);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    inicializarCarrosselMarcas();
    iniciarAutomatico();
});

window.addEventListener("load", carregarDados2);
