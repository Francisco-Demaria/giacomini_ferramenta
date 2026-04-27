function renderizarCarrinho() {
    let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
    let lista = document.getElementById('lista-itens');
    let areaTotal = document.getElementById('area-total');
    let total = 0;
    
    if(carrinho.length === 0) {
        // Ajustado o link para voltar à pasta do catálogo
        lista.innerHTML = "<div class='carrinho-vazio'><i class='fas fa-shopping-basket' style='font-size: 3em; margin-bottom:20px; color:#ddd;'></i><br>Seu carrinho está vazio.<br><br><a href='../catalogo/catalogo.html' style='color:#166e36; font-weight:bold;'>Ir para o Catálogo</a></div>";
        areaTotal.style.display = 'none';
        return;
    }

    lista.innerHTML = '';
    areaTotal.style.display = 'block';

    carrinho.forEach((item, index) => {
        total += item.preco;
        // Ajustado o onerror da imagem para voltar à raiz
        lista.innerHTML += `
            <div class="item-carrinho">
                <div class="info-produto-cart">
                    <img src="${item.img || '../padrao.png'}" class="img-cart" onerror="this.src='../padrao.png'">
                    <div class="item-info"><h3>${item.nome}</h3></div>
                </div>
                <div class="item-preco">R$ ${item.preco.toFixed(2).replace('.',',')}</div>
                <button class="btn-remover" onclick="removerItem(${index})" title="Remover"><i class="fas fa-trash"></i></button>
            </div>
        `;
    });
    document.getElementById('valor-total').innerText = `R$ ${total.toFixed(2).replace('.',',')}`;
}

function removerItem(index) {
    let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
    carrinho.splice(index, 1);
    localStorage.setItem('carrinho', JSON.stringify(carrinho));
    renderizarCarrinho();
}

function enviarWhatsApp() {
    let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
    let total = carrinho.reduce((acc, item) => acc + item.preco, 0);
    
    let mensagem = "Olá, equipe Giacomini! Gostaria de fechar o pedido dos seguintes itens que adicionei ao meu carrinho:\n\n";
    carrinho.forEach(item => mensagem += `🛠️ *${item.nome}* - R$ ${item.preco.toFixed(2).replace('.',',')}\n`);
    mensagem += `\n💰 *VALOR TOTAL: R$ ${total.toFixed(2).replace('.',',')}*`;
    
    window.open("https://wa.me/5547989050263?text=" + encodeURIComponent(mensagem), "_blank");
    
    // Opcional: Limpa o carrinho depois de enviar a mensagem
    // localStorage.removeItem('carrinho'); 
    // renderizarCarrinho();
}

// --- FUNÇÕES DO MENU ---
window.abrirMenu = function() {
    const menu = document.getElementById('menu-lateral');
    const overlay = document.getElementById('overlay');
    if(menu && overlay) {
        menu.classList.add('aberto');
        overlay.style.display = 'block';
    }
};

window.fecharMenu = function() {
    const menu = document.getElementById('menu-lateral');
    const overlay = document.getElementById('overlay');
    if(menu && overlay) {
        menu.classList.remove('aberto');
        overlay.style.display = 'none';
    }
};

window.onload = renderizarCarrinho;