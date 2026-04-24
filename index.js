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

let slideIndex = 0;

let currentSlide = 0;
const wrapper = document.getElementById('slider-wrapper');
const slides = document.querySelectorAll('.slide');
const totalOriginalSlides = slides.length;

// MÁGICA DO CÉREBRO: Clonamos o primeiro slide e colocamos no fim
const firstClone = slides[0].cloneNode(true);
wrapper.appendChild(firstClone);

function mudarSlide(n) {
    currentSlide += n;
    wrapper.style.transition = "transform 0.7s ease-in-out";
    wrapper.style.transform = `translateX(-${currentSlide * 100}%)`;

    // Se chegou no clone (fim), volta pro início REAL sem o usuário ver
    if (currentSlide >= totalOriginalSlides) {
        setTimeout(() => {
            wrapper.style.transition = "none";
            currentSlide = 0;
            wrapper.style.transform = `translateX(0)`;
        }, 700); // tempo da transição
    }
    
    // Se for para trás do primeiro
    if (currentSlide < 0) {
        setTimeout(() => {
            wrapper.style.transition = "none";
            currentSlide = totalOriginalSlides - 1;
            wrapper.style.transform = `translateX(-${currentSlide * 100}%)`;
        }, 700);
    }
}

// Roda sozinho igual a esteira das marcas
setInterval(() => mudarSlide(1), 5000);

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
            // A MÁGICA PARA NÃO QUEBRAR OS PRODUTOS:
            // Essa Regex ignora as vírgulas que estão dentro de textos com aspas
            const regexCSV = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
            const col = linha.split(regexCSV);
            
            if (col.length < 8) return null;

            return {
                // O replace tira as aspas extras que o Google Sheets coloca e mantém limpo
                nome: col[0] ? col[0].trim().replace(/^"|"$/g, '') : '',
                categoria: col[1] ? col[1].trim().replace(/^"|"$/g, '') : '',
                subcategoria: col[2] ? col[2].trim().replace(/^"|"$/g, '') : '',
                preco: parseFloat(col[3]) || 0,
                precoAntigo: parseFloat(col[4]) || 0,
                img: col[5] ? col[5].trim().replace(/^"|"$/g, '') : '',
                estoque: parseInt(col[6]) || 0,
                descricao: col[7] ? col[7].trim().replace(/^"|"$/g, '').replace(/<br>/gi, '<br>') : ''
            };
        }).filter(p => p !== null && p.estoque > 0);

        // Removemos as peças da vitrine inicial
        produtos = produtos.filter(p => !p.categoria.toLowerCase().includes('peça') && !p.categoria.toLowerCase().includes('peca'));

        // 1. DESTAQUES: Do menor estoque para o maior (gatilho de urgência) e embaralha empates
        let destaques = [...produtos].sort((a, b) => {
            if (a.estoque === b.estoque) return Math.random() - 0.5;
            return a.estoque - b.estoque;
        }).slice(0, 3);
        
        let gridDest = document.getElementById('grid-destaques');
        if(gridDest) gridDest.innerHTML = destaques.length > 0 ? destaques.map(p => criarCartao(p)).join('') : "<p style='width:100%; text-align:center;'>Nenhum destaque no momento.</p>";

        // 2. LANÇAMENTOS: Os 4 últimos cadastrados na planilha
        let lancamentos = [...produtos].reverse().slice(0, 3);
        let gridLanc = document.getElementById('grid-lancamentos');
        if(gridLanc) gridLanc.innerHTML = lancamentos.length > 0 ? lancamentos.map(p => criarCartao(p)).join('') : "<p style='width:100%; text-align:center;'>Nenhum lançamento recente.</p>";

        // 3. PROMOÇÕES: Maior porcentagem real de desconto primeiro
        let promocoes = [...produtos].filter(p => p.precoAntigo > p.preco);
        promocoes = promocoes.sort((a, b) => {
            let descontoA = ((a.precoAntigo - a.preco) / a.precoAntigo) * 100;
            let descontoB = ((b.precoAntigo - b.preco) / b.precoAntigo) * 100;
            return descontoB - descontoA; // Maior desconto no topo
        }).slice(0, 3);
        
        let gridProm = document.getElementById('grid-promocoes');
        if(gridProm) gridProm.innerHTML = promocoes.length > 0 ? promocoes.map(p => criarCartao(p)).join('') : "<p style='width:100%; text-align:center;'>Nenhuma oferta ativa no momento.</p>";

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
