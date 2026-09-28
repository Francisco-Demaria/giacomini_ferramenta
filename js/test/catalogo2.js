let produtosCatalogo2 = [];

document.addEventListener("DOMContentLoaded", async () => {
    try {
        produtosCatalogo2 = await carregarProdutos2();
        preencherCategorias2();
        configurarFiltros2();
        renderizarCatalogo2();
    } catch (erro) {
        console.error(erro);
        document.getElementById("estado-catalogo").innerHTML =
            `<p style="color:#b42318;"><strong>Erro ao carregar produtos:</strong> ${erro.message}</p>`;
    }
});

function preencherCategorias2() {
    const select = document.getElementById("filtro-categoria");
    const categorias = [...new Set(
        produtosCatalogo2.map(p => p.categoria).filter(Boolean)
    )].sort((a, b) => a.localeCompare(b, "pt-BR"));

    select.innerHTML = `<option value="">Todas</option>` +
        categorias.map(c => `<option value="${escapeHtml2(c)}">${escapeHtml2(c)}</option>`).join("");
}

function configurarFiltros2() {
    const ids = ["input-busca", "preco-min", "preco-max", "filtro-ordem", "filtro-categoria"];

    ids.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;

        el.addEventListener("input", renderizarCatalogo2);
        el.addEventListener("change", renderizarCatalogo2);
    });

    document.getElementById("btn-busca")?.addEventListener("click", renderizarCatalogo2);
}

function renderizarCatalogo2() {
    const busca = document.getElementById("input-busca").value.trim().toLowerCase();
    const min = Number(document.getElementById("preco-min").value || 0);
    const max = Number(document.getElementById("preco-max").value || Infinity);
    const ordem = document.getElementById("filtro-ordem").value;
    const categoria = document.getElementById("filtro-categoria").value;

    let produtos = produtosCatalogo2.filter(p => {
        const texto = [
            p.nome,
            p.sku,
            p.marca,
            p.categoria,
            p.subcategoria,
            p.descricao
        ].join(" ").toLowerCase();

        return (!busca || texto.includes(busca)) &&
               p.precoVista >= min &&
               p.precoVista <= max &&
               (!categoria || p.categoria === categoria);
    });

    if (ordem === "menor-preco") {
        produtos.sort((a, b) => a.precoVista - b.precoVista);
    } else if (ordem === "maior-preco") {
        produtos.sort((a, b) => b.precoVista - a.precoVista);
    } else if (ordem === "nome") {
        produtos.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    }

    const estado = document.getElementById("estado-catalogo");
    const lista = document.getElementById("lista-produtos");

    estado.innerHTML = `<p>${produtos.length} produto(s) encontrado(s).</p>`;

    if (!produtos.length) {
        lista.innerHTML = `<p>Nenhum produto encontrado.</p>`;
        return;
    }

    lista.innerHTML = produtos.map(cardProduto2).join("");
}

function cardProduto2(p) {
    const identificador = encodeURIComponent(p.sku || p.id || p.nome);
    const imagem = escapeHtml2(p.img);
    const nome = escapeHtml2(p.nome);
    const categoria = escapeHtml2(p.categoria);
    const subcategoria = escapeHtml2(p.subcategoria);

    return `
        <article class="card-produto">
            <a href="./produto2.html?id=${identificador}" style="text-decoration:none;">
                <img src="${imagem}" alt="${nome}" loading="lazy"
                     onerror="this.src='../images.jfif'">
                <div>
                    <small>${categoria}</small>
                    <h3>${nome}</h3>
                    ${subcategoria ? `<p>${subcategoria}</p>` : ""}
                    <strong>${formatarPreco2(p.precoVista)}</strong>
                    ${p.sobEncomenda ? `<p>Disponível sob encomenda</p>` : ""}
                </div>
            </a>

            <button type="button" class="btn-adicionar-carrinho"
                    data-produto-id="${escapeHtml2(String(p.id))}">
                Adicionar ao carrinho
            </button>
        </article>
    `;
}

document.addEventListener("click", event => {
    const botao = event.target.closest(".btn-adicionar-carrinho");
    if (!botao) return;

    const id = botao.dataset.produtoId;
    const produto = produtosCatalogo2.find(p => String(p.id) === String(id));

    if (!produto) return;

    adicionarProdutoCarrinho2(produto, 1);

    botao.textContent = "Adicionado ✓";
    setTimeout(() => botao.textContent = "Adicionar ao carrinho", 1200);
});

function adicionarProdutoCarrinho2(produto, quantidade = 1) {
    const chave = "giacomini_carrinho_test_v2";
    const atual = JSON.parse(localStorage.getItem(chave) || "[]");

    const existente = atual.find(item => String(item.id) === String(produto.id));

    if (existente) {
        existente.quantidade += quantidade;
    } else {
        atual.push({
            id: produto.id,
            sku: produto.sku,
            nome: produto.nome,
            img: produto.img,
            preco: produto.precoVista,
            quantidade
        });
    }

    localStorage.setItem(chave, JSON.stringify(atual));

    if (typeof atualizarContadorCarrinho === "function") {
        atualizarContadorCarrinho();
    }
}

function escapeHtml2(valor) {
    return String(valor ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
