function calcularPrecos(produto) {

    const precoVista =
        Number(produto.precoVista) || 0;

    const precoParcelado =
        Number(produto.precoParcelado) || 0;

    /*
     * Por enquanto, usamos o preço parcelado
     * também como referência visual do "De".
     *
     * Depois podemos reformular o card para
     * não exibir "De" caso você prefira.
     */
    const precoDe =
        Math.max(
            precoParcelado,
            precoVista
        );

    return {
        precoVista,
        precoParcelado,
        precoDe,
        possuiPrecoEspecial:
            precoParcelado >
            precoVista
    };
}


function formatarPreco(valor) {

    return Number(valor || 0)
        .toFixed(2)
        .replace('.', ',');
}