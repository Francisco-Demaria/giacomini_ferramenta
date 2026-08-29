function atualizarContador() {
    const carrinho =
        JSON.parse(localStorage.getItem('carrinho')) || [];

    const contador =
        document.getElementById('contador-carrinho');

    if (contador) {
        contador.innerText = carrinho.length;
    }
}

window.atualizarContador = atualizarContador;