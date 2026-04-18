const URL_PLANILHA = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSjwdcNetNoRZzXi20wyCVlMwhQf86ckoI8ZcIDui7wnvQpxUg7NIAio6HEu_CMHqyG1yT4Rcee_q6H/pub?output=csv';

function atualizarContador() {
    let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
    let contador = document.getElementById('contador-carrinho');
    if(contador) contador.innerText = carrinho.length;
}

function fazerBusca() {
    let termo = document.getElementById('input-busca').value;
    if(termo.trim() !== '') window.location.href = '../catalogo/catalogo.html?busca=' + encodeURIComponent(termo);
} // <--- A CHAVE QUE ESTAVA FALTANDO FOI COLOCADA AQUI

function abrirMenu() { document.getElementById('menu-lateral').classList.add('aberto'); document.getElementById('overlay').style.display = 'block'; }
function fecharMenu() { document.getElementById('menu-lateral').classList.remove('aberto'); document.getElementById('overlay').style.display = 'none'; }

let slideIndex = 0; let timer;
function mudarSlide(n) {
    let slides = document.querySelectorAll('.slide');
    if(slides.length === 0) return;
    slideIndex += n;
    if (slideIndex >= slides.length) slideIndex = 0;
    if (slideIndex < 0) slideIndex = slides.length - 1;
    document.getElementById('slider-wrapper').style.transform = `translateX(-${slideIndex * 100}%)`;
    resetarTimer();
}
function autoSlide() { mudarSlide(1); }
function resetarTimer() { clearInterval(timer); timer = setInterval(autoSlide, 5000); }
resetarTimer();

function criarCartao(p) {
    let img = p.img;
    // Ajustado para ../img/ e ../padrao.png
    if (img !== '' && !img.startsWith('http') && !img.startsWith('../img/')) { img = '../img/' + img; }
    if (img === '') img = '../padrao.png';

    let temDesconto = p.precoAntigo > p.preco;
    let htmlPrecoAntigo = temDesconto ? `<div class="preco-antigo">De: R$ ${p.precoAntigo.toFixed(2).replace('.',',')}</div>` : `<div class="preco-antigo" style="height:20px;"></div>`;
    let seloHTML = temDesconto ? `<div class="selo-desconto">${Math.round(((p.precoAntigo - p.preco) / p.precoAntigo) * 100)}% OFF</div>` : '';
    let badgeCategoria = p.categoria ? `<span class="badge-categoria" style="position:absolute; top:10px; left:10px; background:var(--verde-escuro); color:white; padding:5px 10px; border-radius:10px; font-size:0.8em; z-index:2;">${p.categoria}</span>` : '';

    return `
        <a href="../produto/produto.html?nome=${encodeURIComponent(p.nome)}" style="text-decoration:none; color:inherit; display:block; height:100%;">
            <div class="cartao-produto" style="display: flex; flex-direction: column; height: 100%; justify-content: space-between;">
                ${badgeCategoria}
                ${seloHTML}
                <img src="${img}" onerror="this.src='../padrao.png'" alt="${p.nome}" style="height: 180px; width: 100%; object-fit: contain; margin-bottom: 15px;">
                <h3 style="flex-grow: 1; display: flex; align-items: flex-start; justify-content: center; min-height: 48px; margin: 0 0 10px 0;">${p.nome}</h3>
                <div style="width:100%;">
                    ${htmlPrecoAntigo}
                    <div class="preco-atual">R$ ${p.preco.toFixed(2).replace('.', ',')}</div>
                    <button class="btn-comprar" style="width:100%; margin-top:10px;">Ver Detalhes</button>
                </div>
            </div>
        </a>`;
}

async function carregarDados() {
    try {
        const resposta = await fetch(URL_PLANILHA);
        const dadosTexto = await resposta.text();
        const linhas = dadosTexto.split(/\r?\n/).slice(1).filter(l => l.trim() !== "");

        let produtos = linhas.map(linha => {
            const col = linha.split(',');
            if (col.length < 8) return null;

            return {
                nome: col[0] ? col[0].trim() : '',
                categoria: col[1] ? col[1].trim() : '',
                subcategoria: col[2] ? col[2].trim() : '',
                preco: parseFloat(col[3]) || 0,
                precoAntigo: parseFloat(col[4]) || 0,
                img: col[5] ? col[5].trim() : '',
                estoque: parseInt(col[6]) || 0,
                descricao: col[7] ? col[7].trim() : ''
            };
        }).filter(p => p !== null && p.estoque > 0);

        let gridDest = document.getElementById('grid-destaques');
        if(gridDest) gridDest.innerHTML = produtos.slice(0, 4).map(p => criarCartao(p)).join('');
        
        let lancamentos = produtos.slice(-4).reverse();
        let gridLanc = document.getElementById('grid-lancamentos');
        if(gridLanc) gridLanc.innerHTML = lancamentos.length > 0 ? lancamentos.map(p => criarCartao(p)).join('') : "<p style='width:100%; text-align:center;'>Nenhum lançamento recente.</p>";
        
        let promocoes = produtos.filter(p => p.precoAntigo > p.preco);
        let gridProm = document.getElementById('grid-promocoes');
        if(gridProm) gridProm.innerHTML = promocoes.length > 0 ? promocoes.slice(0, 4).map(p => criarCartao(p)).join('') : "<p style='width:100%; text-align:center;'>Nenhuma oferta ativa no momento.</p>";

    } catch (erro) {
        console.error("Erro na planilha", erro);
    }
}

window.onload = () => { carregarDados(); atualizarContador(); };

// Função para rolar o carrossel de marcas
function moverMarcas(direcao) {
    const trilho = document.getElementById('trilho-marcas');
    // Calcula a largura de 2 itens para rolar proporcionalmente
    const distancia = 340; 
    trilho.scrollBy({ left: direcao * distancia, behavior: 'smooth' });
}

document.addEventListener('DOMContentLoaded', () => {
    const track = document.getElementById('track-marcas');
    const btnNext = document.getElementById('btn-next');
    const btnPrev = document.getElementById('btn-prev');

    // Se tivermos apenas 4 marcas, clonamos elas para que o carrossel nunca fique com espaço vazio na tela
    const items = Array.from(track.children);
    if (items.length <= 4) {
        items.forEach(item => {
            let clone = item.cloneNode(true);
            track.appendChild(clone);
        });
    }

    let isAnimating = false;

    // Clique para a Direita (Avançar)
    btnNext.addEventListener('click', () => {
        if (isAnimating) return; // Evita bugar se clicar muito rápido
        isAnimating = true;
        
        const firstItem = track.firstElementChild;
        // Pega a largura do item + as margens (30px de cada lado = 60px)
        const itemWidth = firstItem.offsetWidth + 60; 
        
        // Faz a animação de deslizar
        track.style.transition = 'transform 0.4s ease-in-out';
        track.style.transform = `translateX(-${itemWidth}px)`;
        
        // Quando a animação termina (400ms), joga o primeiro pro final e zera a posição
        setTimeout(() => {
            track.style.transition = 'none';
            track.appendChild(firstItem);
            track.style.transform = 'translateX(0)';
            isAnimating = false;
        }, 400); 
    });

    // Clique para a Esquerda (Voltar)
    btnPrev.addEventListener('click', () => {
        if (isAnimating) return;
        isAnimating = true;
        
        const lastItem = track.lastElementChild;
        const itemWidth = lastItem.offsetWidth + 60;
        
        // Joga o último item pro começo instantaneamente (escondido)
        track.insertBefore(lastItem, track.firstElementChild);
        track.style.transition = 'none';
        track.style.transform = `translateX(-${itemWidth}px)`;
        
        // Força o navegador a recalcular a posição antes de animar
        void track.offsetWidth;
        
        // Faz a animação voltando pro 0
        track.style.transition = 'transform 0.4s ease-in-out';
        track.style.transform = 'translateX(0)';
        
        setTimeout(() => {
            isAnimating = false;
        }, 400);
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const track = document.getElementById('track-marcas');
    const btnNext = document.getElementById('btn-next');
    const btnPrev = document.getElementById('btn-prev');

    let isAnimating = false; // Trava para não bugar se clicar muito rápido

    // CLIQUE PARA A DIREITA (Avançar)
    btnNext.addEventListener('click', () => {
        if (isAnimating) return;
        isAnimating = true;

        const firstItem = track.firstElementChild;
        // Pega a largura exata da imagem + a margem direita e esquerda (30px + 30px = 60px)
        const itemWidth = firstItem.offsetWidth + 60; 

        // Anima a esteira para a esquerda
        track.style.transition = 'transform 0.4s ease-in-out';
        track.style.transform = `translateX(-${itemWidth}px)`;

        // Depois que a animação acaba, joga a primeira imagem pro final
        setTimeout(() => {
            track.style.transition = 'none'; // Tira a animação para mover invisível
            track.appendChild(firstItem); // Move do começo pro fim
            track.style.transform = 'translateX(0)'; // Reseta a posição
            isAnimating = false;
        }, 400); // 400ms é o mesmo tempo da transição no CSS
    });

    // CLIQUE PARA A ESQUERDA (Voltar)
    btnPrev.addEventListener('click', () => {
        if (isAnimating) return;
        isAnimating = true;

        const lastItem = track.lastElementChild;
        const firstItem = track.firstElementChild;
        const itemWidth = firstItem.offsetWidth + 60;

        // Joga a ÚLTIMA imagem pro COMEÇO de forma invisível primeiro
        track.insertBefore(lastItem, firstItem);
        
        // Empurra a esteira para a esquerda para parecer que nada mudou
        track.style.transition = 'none';
        track.style.transform = `translateX(-${itemWidth}px)`;

        // Força o navegador a recalcular a tela (truque de performance)
        void track.offsetWidth;

        // Agora sim, anima a esteira de volta para o ponto 0
        track.style.transition = 'transform 0.4s ease-in-out';
        track.style.transform = 'translateX(0)';

        setTimeout(() => {
            isAnimating = false;
        }, 400);
    });
});