const URL_PLANILHA = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSjwdcNetNoRZzXi20wyCVlMwhQf86ckoI8ZcIDui7wnvQpxUg7NIAio6HEu_CMHqyG1yT4Rcee_q6H/pub?output=csv';

function atualizarContador() {
    let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
    let contador = document.getElementById('contador-carrinho');
    if(contador) contador.innerText = carrinho.length;
}

function fazerBusca() {
    let termo = document.getElementById('input-busca').value;
    // Removido o ../ pois o index já está na raiz
    if(termo.trim() !== '') window.location.href = 'catalogo/catalogo.html?busca=' + encodeURIComponent(termo);
}

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
    // Ajustado para img/ e padrao.png (sem ../)
    if (img !== '' && !img.startsWith('http') && !img.startsWith('img/')) { img = 'img/' + img; }
    if (img === '') img = 'padrao.png';

    let temDesconto = p.precoAntigo > p.preco;
    let htmlPrecoAntigo = temDesconto ? `<div class="preco-antigo">De: R$ ${p.precoAntigo.toFixed(2).replace('.',',')}</div>` : `<div class="preco-antigo" style="height:20px;"></div>`;
    let seloHTML = temDesconto ? `<div class="selo-desconto">${Math.round(((p.precoAntigo - p.preco) / p.precoAntigo) * 100)}% OFF</div>` : '';
    let badgeCategoria = p.categoria ? `<span class="badge-categoria" style="position:absolute; top:10px; left:10px; background:var(--verde-escuro); color:white; padding:5px 10px; border-radius:10px; font-size:0.8em; z-index:2;">${p.categoria}</span>` : '';

    return `
        <a href="produto/produto.html?nome=${encodeURIComponent(p.nome)}" style="text-decoration:none; color:inherit; display:block; height:100%;">
            <div class="cartao-produto" style="display: flex; flex-direction: column; height: 100%; justify-content: space-between;">
                ${badgeCategoria}
                ${seloHTML}
                <img src="${img}" onerror="this.src='padrao.png'" alt="${p.nome}" style="height: 180px; width: 100%; object-fit: contain; margin-bottom: 15px;">
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

// ... (O resto do seu código do carrossel continua igualzinho aqui pra baixo) ...
document.addEventListener('DOMContentLoaded', () => {
    const track = document.getElementById('track-marcas');
    const btnNext = document.getElementById('btn-next');
    const btnPrev = document.getElementById('btn-prev');
    let isAnimating = false;
    btnNext.addEventListener('click', () => {
        if (isAnimating) return;
        isAnimating = true;
        const firstItem = track.firstElementChild;
        const itemWidth = firstItem.offsetWidth + 60; 
        track.style.transition = 'transform 0.4s ease-in-out';
        track.style.transform = `translateX(-${itemWidth}px)`;
        setTimeout(() => {
            track.style.transition = 'none'; 
            track.appendChild(firstItem); 
            track.style.transform = 'translateX(0)'; 
            isAnimating = false;
        }, 400); 
    });
    btnPrev.addEventListener('click', () => {
        if (isAnimating) return;
        isAnimating = true;
        const lastItem = track.lastElementChild;
        const firstItem = track.firstElementChild;
        const itemWidth = firstItem.offsetWidth + 60;
        track.insertBefore(lastItem, firstItem);
        track.style.transition = 'none';
        track.style.transform = `translateX(-${itemWidth}px)`;
        void track.offsetWidth;
        track.style.transition = 'transform 0.4s ease-in-out';
        track.style.transform = 'translateX(0)';
        setTimeout(() => { isAnimating = false; }, 400);
    });
});