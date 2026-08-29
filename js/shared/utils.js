function formatarPreco(valor) {
    return Number(valor || 0)
        .toFixed(2)
        .replace('.', ',');
}

function obterImagem(img, caminhoFallback = 'padrao.png') {
    if (!img) {
        return caminhoFallback;
    }

    if (
        img.startsWith('http://') ||
        img.startsWith('https://') ||
        img.startsWith('img/')
    ) {
        return img;
    }

    return 'img/' + img;
}

function ehPeca(produto) {
    const categoria = String(produto.categoria || '').toLowerCase();

    return (
        categoria.includes('peça') ||
        categoria.includes('peca')
    );
}

window.formatarPreco = formatarPreco;
window.obterImagem = obterImagem;
window.ehPeca = ehPeca;