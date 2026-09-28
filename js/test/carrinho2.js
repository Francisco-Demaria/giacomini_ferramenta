const CHAVE_CARRINHO_TESTE = "giacomini_carrinho_test_v2";

document.addEventListener("DOMContentLoaded", renderizarCarrinho2);

function obterCarrinho2() {
    return JSON.parse(localStorage.getItem(CHAVE_CARRINHO_TESTE) || "[]");
}

function salvarCarrinho2(carrinho) {
    localStorage.setItem(CHAVE_CARRINHO_TESTE, JSON.stringify(carrinho));

    if (typeof atualizarContadorCarrinho === "function") {
        atualizarContadorCarrinho();
    }
}

function renderizarCarrinho2() {
    const container = document.getElementById("carrinho");
    const carrinho = obterCarrinho2();

    if (!carrinho.length) {
        container.innerHTML = `
            <h1>Meu Carrinho</h1>
            <p>Seu carrinho está vazio.</p>
            <a href="./catalogo2.html" class="btn-voltar">Ir para o catálogo</a>
        `;
        return;
    }

    const total = carrinho.reduce(
        (soma, item) => soma + Number(item.preco || 0) * Number(item.quantidade || 0),
        0
    );

    container.innerHTML = `
        <h1>Meu Carrinho</h1>

        <div>
            ${carrinho.map((item, index) => `
                <article class="card-produto" style="display:flex;gap:20px;align-items:center;margin-bottom:15px;">
                    <img src="${escapeHtml2(item.img)}"
                         alt="${escapeHtml2(item.nome)}"
                         style="width:100px;height:100px;object-fit:contain;"
                         onerror="this.src='../images.jfif'">

                    <div style="flex:1;">
                        <h3>${escapeHtml2(item.nome)}</h3>
                        <p>${formatarPreco2(item.preco)}</p>

                        <div style="display:flex;gap:8px;align-items:center;">
                            <button type="button" onclick="alterarQuantidade2(${index}, -1)">−</button>
                            <strong>${item.quantidade}</strong>
                            <button type="button" onclick="alterarQuantidade2(${index}, 1)">+</button>
                            <button type="button" onclick="removerItem2(${index})">Remover</button>
                        </div>
                    </div>

                    <strong>${formatarPreco2(Number(item.preco || 0) * Number(item.quantidade || 0))}</strong>
                </article>
            `).join("")}
        </div>

        <div style="margin-top:25px;">
            <h2>Total: ${formatarPreco2(total)}</h2>
            <p>Checkout/pagamento ainda não está ligado nesta V2 de teste.</p>
            <button type="button" onclick="limparCarrinho2()">Limpar carrinho</button>
        </div>
    `;
}

function alterarQuantidade2(index, delta) {
    const carrinho = obterCarrinho2();

    if (!carrinho[index]) return;

    carrinho[index].quantidade += delta;

    if (carrinho[index].quantidade <= 0) {
        carrinho.splice(index, 1);
    }

    salvarCarrinho2(carrinho);
    renderizarCarrinho2();
}

function removerItem2(index) {
    const carrinho = obterCarrinho2();
    carrinho.splice(index, 1);
    salvarCarrinho2(carrinho);
    renderizarCarrinho2();
}

function limparCarrinho2() {
    salvarCarrinho2([]);
    renderizarCarrinho2();
}

function formatarPreco2(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function escapeHtml2(valor) {
    return String(valor ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
