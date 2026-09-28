const API_PRODUTOS_TESTE = "../api/produtos.php";
const CACHE_PRODUTOS_TESTE = "giacomini_produtos_v2_cache";

function numeroSeguro(valor) {
    if (typeof valor === "number") return Number.isFinite(valor) ? valor : 0;
    if (valor == null) return 0;

    let texto = String(valor).trim().replace(/[R$\s]/g, "");
    if (texto.includes(",") && texto.includes(".")) {
        texto = texto.replace(/\./g, "").replace(",", ".");
    } else {
        texto = texto.replace(",", ".");
    }

    const numero = Number(texto);
    return Number.isFinite(numero) ? numero : 0;
}

function textoSeguro(valor, fallback = "") {
    if (valor == null) return fallback;
    return String(valor).trim();
}

function normalizarProduto2(raw) {
    const estoque = numeroSeguro(raw.estoque ?? raw.quantidade ?? 0);
    const ativo = raw.ativo === undefined ? true : Boolean(Number(raw.ativo));

    const precoVista = numeroSeguro(
        raw.precoVista ??
        raw.preco_vista ??
        raw.preco ??
        raw.valor_vista
    );

    const precoParcelado = numeroSeguro(
        raw.precoParcelado ??
        raw.preco_parcelado ??
        raw.valor_parcelado ??
        precoVista
    );

    const precoDe = numeroSeguro(
        raw.precoDe ??
        raw.preco_de ??
        raw.preco_antigo ??
        0
    );

    const imagem = textoSeguro(
        raw.img ??
        raw.imagem ??
        raw.imagem_url ??
        raw.foto ??
        raw.url_imagem,
        "../images.jfif"
    );

    const categoria = textoSeguro(
        raw.categoria ??
        raw.categoria_nome ??
        raw.nome_categoria,
        "Produtos"
    );

    /*
     * Regra da V2:
     * estoque físico NÃO decide disponibilidade.
     * Produto ativo com estoque 0 continua disponível para encomenda.
     */
    const disponivel = ativo && raw.disponivel !== false;

    return {
        ...raw,
        id: raw.id ?? raw.produto_id ?? raw.codigo_makita ?? raw.sku,
        sku: textoSeguro(raw.sku ?? raw.codigo_makita ?? raw.codigo),
        nome: textoSeguro(raw.nome ?? raw.descricao ?? raw.descricao_resumida, "Produto sem nome"),
        marca: textoSeguro(raw.marca, "Makita"),
        categoria,
        subcategoria: textoSeguro(raw.subcategoria ?? raw.linha),
        descricao: textoSeguro(raw.descricao ?? raw.aplicacao ?? raw.descricao_resumida),
        img: imagem,
        estoque,
        ativo,
        disponivel,
        sobEncomenda: estoque <= 0,
        precoDe,
        precoVista,
        precoParcelado
    };
}

async function carregarProdutos2() {
    const resposta = await fetch(API_PRODUTOS_TESTE, {
        method: "GET",
        cache: "no-store",
        headers: { "Accept": "application/json" }
    });

    if (!resposta.ok) {
        throw new Error(`API respondeu HTTP ${resposta.status}`);
    }

    const dados = await resposta.json();

    const lista = Array.isArray(dados)
        ? dados
        : Array.isArray(dados.produtos)
            ? dados.produtos
            : Array.isArray(dados.data)
                ? dados.data
                : [];

    const produtos = lista
        .map(normalizarProduto2)
        .filter(p => p.ativo);

    sessionStorage.setItem(CACHE_PRODUTOS_TESTE, JSON.stringify(produtos));

    return produtos;
}

function obterProduto2PorId(produtos, identificador) {
    const alvo = decodeURIComponent(String(identificador || "")).trim();

    return produtos.find(p =>
        String(p.id) === alvo ||
        String(p.sku).toLowerCase() === alvo.toLowerCase() ||
        String(p.nome).toLowerCase() === alvo.toLowerCase()
    );
}

function formatarPreco2(valor) {
    return numeroSeguro(valor).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}
