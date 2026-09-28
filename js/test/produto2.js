document.addEventListener("DOMContentLoaded", async () => {
    const container = document.getElementById("produto");

    try {
        const produtos = await carregarProdutos2();
        const params = new URLSearchParams(window.location.search);
        const identificador = params.get("id");

        const produto = obterProduto2PorId(produtos, identificador);

        if (!produto) {
            container.innerHTML = `
                <p>Produto não encontrado.</p>
                <a href="./catalogo2.html" class="btn-voltar">Voltar ao catálogo</a>
            `;
            return;
        }

        document.title = `${produto.nome} | Giacomini`;

        container.innerHTML = `
            <a href="./catalogo2.html" class="btn-voltar">← Voltar ao catálogo</a>

            <article class="produto-detalhe" style="margin-top:25px;">
                <div>
                    <img src="${escapeHtml2(produto.img)}"
                         alt="${escapeHtml2(produto.nome)}"
                         onerror="this.src='../images.jfif'">
                </div>

                <div>
                    <small>${escapeHtml2(produto.categoria)}</small>
                    <h1>${escapeHtml2(produto.nome)}</h1>

                    ${produto.sku ? `<p><strong>SKU:</strong> ${escapeHtml2(produto.sku)}</p>` : ""}
                    ${produto.subcategoria ? `<p><strong>Linha:</strong> ${escapeHtml2(produto.subcategoria)}</p>` : ""}

                    <div style="margin:20px 0;">
                        ${produto.precoDe > produto.precoVista
                            ? `<del>${formatarPreco2(produto.precoDe)}</del>`
                            : ""}
                        <h2>${formatarPreco2(produto.precoVista)}</h2>
                        ${produto.precoParcelado
                            ? `<p>Parcelado: ${formatarPreco2(produto.precoParcelado)}</p>`
                            : ""}
                    </div>

                    <p>${escapeHtml2(produto.descricao || "Produto disponível para encomenda.")}</p>

                    <p>
                        <strong>${produto.sobEncomenda ? "Disponível sob encomenda" : "Disponível"}</strong>
                    </p>

                    <button type="button" id="btn-adicionar" class="btn-adicionar-carrinho">
                        Adicionar ao carrinho
                    </button>
                </div>
            </article>
        `;

        document.getElementById("btn-adicionar").addEventListener("click", () => {
            adicionarProdutoCarrinhoDetalhe2(produto, 1);

            const botao = document.getElementById("btn-adicionar");
            botao.textContent = "Adicionado ✓";
            setTimeout(() => botao.textContent = "Adicionar ao carrinho", 1200);
        });
    } catch (erro) {
        console.error(erro);
        container.innerHTML =
            `<p style="color:#b42318;"><strong>Erro:</strong> ${escapeHtml2(erro.message)}</p>`;
    }
});

function adicionarProdutoCarrinhoDetalhe2(produto, quantidade) {
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
