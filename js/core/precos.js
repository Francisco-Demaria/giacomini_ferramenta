const MARGEM_VISTA = 1.30;
const MARGEM_PARCELADO = 1.50;
const MARGEM_TABELA = 1.70;

function calcularPrecos(produto) {
    const custo = Number(produto.preco) || 0;
    const valorEspecial = Number(produto.precoAntigo) || 0;

    // ==========================================
    // PRODUTO NORMAL
    // ==========================================

    if (valorEspecial <= 0) {
        const precoVista =
            Math.floor(custo * MARGEM_VISTA) + 0.99;

        const precoParcelado =
            Math.floor(custo * MARGEM_PARCELADO) + 0.99;

        const precoDe =
            Math.floor(custo * MARGEM_TABELA) + 0.99;

        return {
            precoVista,
            precoParcelado,
            precoDe,
            possuiPrecoEspecial: false
        };
    }

    // ==========================================
    // PRODUTO COM PREÇO ESPECIAL
    // ==========================================

    return {
        precoVista: custo,
        precoParcelado: valorEspecial,
        precoDe: custo * 1.7,
        possuiPrecoEspecial: true
    };
}

function formatarPreco(valor) {
    return Number(valor)
        .toFixed(2)
        .replace('.', ',');
}