const API_PRODUTOS_TESTE = "../api/produtos.php";

function numeroSeguro(valor) {
    const numero = Number(valor);
    return Number.isFinite(numero) ? numero : 0;
}

function escapeHtml2(valor) {
    return String(valor ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function formatarPreco2(valor) {
    return numeroSeguro(valor).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

async function requisicaoProdutos2(params = {}) {
    const url = new URL(API_PRODUTOS_TESTE, window.location.href);

    Object.entries(params).forEach(([chave, valor]) => {
        if (valor !== undefined && valor !== null && String(valor) !== "") {
            url.searchParams.set(chave, valor);
        }
    });

    const resposta = await fetch(url, {
        cache: "no-store",
        headers: { Accept: "application/json" }
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
        throw new Error(dados.erro || `API respondeu HTTP ${resposta.status}`);
    }

    return dados;
}

async function carregarEstrutura2() {
    return requisicaoProdutos2({ modo: "estrutura" });
}

async function carregarProdutos2(params = {}) {
    const dados = await requisicaoProdutos2({
        modo: "produtos",
        porPagina: 24,
        ...params
    });

    return {
        produtos: Array.isArray(dados.produtos) ? dados.produtos : [],
        paginacao: dados.paginacao || {}
    };
}

async function carregarProduto2({ id = "", sku = "" } = {}) {
    const dados = await requisicaoProdutos2({
        modo: "produto",
        id,
        sku
    });

    return dados.produto || null;
}
