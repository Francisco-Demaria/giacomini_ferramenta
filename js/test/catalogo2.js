let estruturaCatalogo2 = null;
let grupoAberto2 = null;
let paginaGrupo2 = 1;
let carregandoGrupo2 = false;

document.addEventListener("DOMContentLoaded", inicializarCatalogo2);

async function inicializarCatalogo2() {
    try {
        estruturaCatalogo2 = await carregarEstrutura2();

        renderizarEstrutura2();
        configurarBusca2();

        const params = new URLSearchParams(window.location.search);
        const busca = (params.get("busca") || "").trim();

        if (busca) {
            document.getElementById("input-busca").value = busca;
            await executarBusca2(busca);
        }
    } catch (erro) {
        console.error(erro);
        mostrarEstado2(`Erro ao carregar o catálogo: ${erro.message}`);
    }
}

function renderizarEstrutura2() {
    const container = document.getElementById("container-grupos-pecas");
    if (!container) return;

    const categorias = estruturaCatalogo2?.categorias || [];
    const subcategorias = estruturaCatalogo2?.subcategorias || [];

    container.innerHTML = categorias.map(categoria => {
        const subs = subcategorias.filter(
            sub => String(sub.categoria_id) === String(categoria.id)
        );

        return `
            <section class="grupo-sanfona">
                <button
                    type="button"
                    class="btn-sanfona"
                    data-categoria="${escapeHtml2(categoria.slug)}"
                    onclick="abrirGrupo2('${escapeJs2(categoria.slug)}')"
                >
                    <span>
                        ${escapeHtml2(categoria.nome)}
                        <small>(${Number(categoria.total_produtos || 0)} itens)</small>
                    </span>
                    <i class="fas fa-chevron-down"></i>
                </button>

                <div
                    id="grupo-${escapeHtml2(categoria.slug)}"
                    class="conteudo-sanfona"
                >
                    <div class="estrutura-subcategorias2">
                        ${
                            subs.length
                                ? subs.map(sub => `
                                    <button
                                        type="button"
                                        class="subgrupo-sanfona2"
                                        onclick="abrirSubgrupo2('${escapeJs2(categoria.slug)}','${escapeJs2(sub.slug)}')"
                                    >
                                        <span>
                                            ${escapeHtml2(sub.nome)}
                                            <small>(${Number(sub.total_produtos || 0)})</small>
                                        </span>
                                        <i class="fas fa-chevron-right"></i>
                                    </button>
                                `).join("")
                                : `<p class="mensagem-vazia">Clique para carregar os produtos desta categoria.</p>`
                        }

                        <div
                            id="produtos-${escapeHtml2(categoria.slug)}"
                            class="lista-produtos-v2"
                        ></div>
                    </div>
                </div>
            </section>
        `;
    }).join("");
}

async function abrirGrupo2(categoria) {
    if (grupoAberto2 === categoria) {
        fecharTodosGrupos2();
        grupoAberto2 = null;
        return;
    }

    fecharTodosGrupos2();

    const elemento = document.getElementById(`grupo-${categoria}`);
    if (!elemento) return;

    elemento.classList.add("ativo");
    grupoAberto2 = categoria;
    paginaGrupo2 = 1;

    await carregarGrupo2({
        categoria,
        subcategoria: ""
    });
}

async function abrirSubgrupo2(categoria, subcategoria) {
    fecharTodosGrupos2();

    const grupo = document.getElementById(`grupo-${categoria}`);
    if (!grupo) return;

    grupo.classList.add("ativo");
    grupoAberto2 = categoria;
    paginaGrupo2 = 1;

    await carregarGrupo2({
        categoria,
        subcategoria
    });
}

function fecharTodosGrupos2() {
    document
        .querySelectorAll(".conteudo-sanfona.ativo")
        .forEach(elemento => {
            elemento.classList.remove("ativo");
        });

    document
        .querySelectorAll(".btn-sanfona.ativo")
        .forEach(botao => {
            botao.classList.remove("ativo");
        });

    document
        .querySelectorAll(".lista-produtos-v2")
        .forEach(lista => {
            lista.innerHTML = "";
        });
}

async function carregarGrupo2({ categoria, subcategoria }) {
    if (carregandoGrupo2) return;

    const lista = subcategoria
        ? document.getElementById(`produtos-${categoria}`)
        : document.getElementById(`produtos-${categoria}`);

    if (!lista) return;

    carregandoGrupo2 = true;

    lista.innerHTML = `
        <div class="estado-carregando2">
            Carregando produtos...
        </div>
    `;

    try {
        const dados = await carregarProdutos2({
            categoria,
            subcategoria,
            pagina: 1
        });

        paginaGrupo2 = 1;

        renderizarProdutos2(lista, dados.produtos, dados.paginacao, {
            categoria,
            subcategoria
        });
    } catch (erro) {
        lista.innerHTML = `
            <p class="mensagem-vazia">
                Não foi possível carregar este grupo.
            </p>
        `;
        console.error(erro);
    } finally {
        carregandoGrupo2 = false;
    }
}

function renderizarProdutos2(lista, produtos, paginacao, contexto) {
    if (!produtos.length) {
        lista.innerHTML = `
            <p class="mensagem-vazia">
                Nenhum produto encontrado neste grupo.
            </p>
        `;
        return;
    }

    lista.innerHTML = `
        ${produtos.map(criarCartaoV2).join("")}

        ${
            paginacao.temProxima
                ? `
                    <button
                        type="button"
                        class="btn-carregar-mais2"
                        onclick="carregarMais2(this, '${escapeJs2(contexto.categoria)}', '${escapeJs2(contexto.subcategoria)}')"
                    >
                        Carregar mais
                    </button>
                `
                : ""
        }
    `;
}

async function carregarMais2(botao, categoria, subcategoria) {
    if (carregandoGrupo2) return;

    carregandoGrupo2 = true;
    botao.disabled = true;
    botao.textContent = "Carregando...";

    try {
        paginaGrupo2++;

        const dados = await carregarProdutos2({
            categoria,
            subcategoria,
            pagina: paginaGrupo2
        });

        const lista = botao.parentElement;

        const antigoBotao = botao;
        antigoBotao.remove();

        lista.insertAdjacentHTML(
            "beforeend",
            dados.produtos.map(criarCartaoV2).join("")
        );

        if (dados.paginacao.temProxima) {
            lista.insertAdjacentHTML(
                "beforeend",
                `
                    <button
                        type="button"
                        class="btn-carregar-mais2"
                        onclick="carregarMais2(this, '${escapeJs2(categoria)}', '${escapeJs2(subcategoria)}')"
                    >
                        Carregar mais
                    </button>
                `
            );
        }
    } catch (erro) {
        paginaGrupo2--;
        botao.disabled = false;
        botao.textContent = "Tentar novamente";
        console.error(erro);
    } finally {
        carregandoGrupo2 = false;
    }
}

function configurarBusca2() {
    const input = document.getElementById("input-busca");
    const botao = document.getElementById("btn-busca");

    if (!input) return;

    const executar = () => {
        const termo = input.value.trim();

        if (!termo) {
            window.history.replaceState({}, "", "catalogo2.html");
            fecharTodosGrupos2();
            return;
        }

        executarBusca2(termo);
    };

    input.addEventListener("keydown", evento => {
        if (evento.key === "Enter") executar();
    });

    botao?.addEventListener("click", executar);
}

async function executarBusca2(termo) {
    fecharTodosGrupos2();

    const container = document.getElementById("lista-maquinas");
    if (!container) return;

    mostrarEstado2(`Buscando por "${escapeHtml2(termo)}"...`);

    try {
        const dados = await carregarProdutos2({
            busca: termo,
            pagina: 1
        });

        container.innerHTML = `
            <div class="resultado-busca-v2">
                <h2>Resultados para "${escapeHtml2(termo)}"</h2>
                <p>${Number(dados.paginacao.total || dados.produtos.length)} produto(s) encontrado(s).</p>
            </div>

            <div class="grid-produtos">
                ${dados.produtos.map(criarCartaoV2).join("")}
            </div>

            ${
                dados.paginacao.temProxima
                    ? `
                        <button
                            type="button"
                            class="btn-carregar-mais2"
                            onclick="carregarMaisBusca2(this, '${escapeJs2(termo)}', 2)"
                        >
                            Carregar mais
                        </button>
                    `
                    : ""
            }
        `;

        window.history.replaceState(
            {},
            "",
            `catalogo2.html?busca=${encodeURIComponent(termo)}`
        );
    } catch (erro) {
        container.innerHTML = `
            <p class="mensagem-vazia">
                Erro na busca: ${escapeHtml2(erro.message)}
            </p>
        `;
    } finally {
        limparEstado2();
    }
}

async function carregarMaisBusca2(botao, termo, pagina) {
    botao.disabled = true;
    botao.textContent = "Carregando...";

    try {
        const dados = await carregarProdutos2({
            busca: termo,
            pagina
        });

        botao.remove();

        const grid = document.querySelector("#lista-maquinas .grid-produtos");
        grid?.insertAdjacentHTML(
            "beforeend",
            dados.produtos.map(criarCartaoV2).join("")
        );

        if (dados.paginacao.temProxima) {
            document
                .getElementById("lista-maquinas")
                .insertAdjacentHTML(
                    "beforeend",
                    `
                        <button
                            type="button"
                            class="btn-carregar-mais2"
                            onclick="carregarMaisBusca2(this, '${escapeJs2(termo)}', ${pagina + 1})"
                        >
                            Carregar mais
                        </button>
                    `
                );
        }
    } catch (erro) {
        botao.disabled = false;
        botao.textContent = "Tentar novamente";
        console.error(erro);
    }
}

function criarCartaoV2(produto) {
    return `
        <a
            href="./produto2.html?id=${encodeURIComponent(produto.id)}"
            class="link-produto"
        >
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
                        ou cartão:
                        ${formatarPreco2(produto.precoParcelado)}
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

function mostrarEstado2(texto) {
    const estado = document.getElementById("estado-catalogo");
    if (estado) estado.innerHTML = `<p>${texto}</p>`;
}

function limparEstado2() {
    const estado = document.getElementById("estado-catalogo");
    if (estado) estado.innerHTML = "";
}

function escapeJs2(valor) {
    return String(valor ?? "")
        .replaceAll("\\", "\\\\")
        .replaceAll("'", "\\'");
}
