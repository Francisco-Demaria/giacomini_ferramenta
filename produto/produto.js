const URL_PLANILHA = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSjwdcNetNoRZzXi20wyCVlMwhQf86ckoI8ZcIDui7wnvQpxUg7NIAio6HEu_CMHqyG1yT4Rcee_q6H/pub?output=csv';
const IMG_FALHA = 'https://via.placeholder.com/150?text=Sem+Foto'; // Evita erro 404 no VSCode

function atualizarContador() {
    let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
    let contador = document.getElementById('contador-carrinho');
    if(contador) contador.innerText = carrinho.length;
}

async function carregarProduto() {
    const parametros = new URLSearchParams(window.location.search);
    const nomeBusca = parametros.get('nome');
    const container = document.getElementById('detalhes-produto');

    try {
        const resposta = await fetch(URL_PLANILHA);
        const texto = await resposta.text();
        // Divide as linhas e remove a primeira (cabeçalho)
        const linhas = texto.split(/\r?\n/).slice(1);

        let produto = null;
        for (let linha of linhas) {
            const col = linha.split(',');
            // Coluna 0 é o Nome
            if (col[0] === nomeBusca) { 
                produto = {
                    nome: col[0],
                    categoria: col[1],
                    subcategoria: col[2],
                    precoCusto: parseFloat(col[3]), // Coluna 3: Preço Atual (Custo)
                    precoAntigo: col[4],           // Coluna 4: Preço Antigo
                    img: col[5],                    // Coluna 5: Imagem
                    estoque: col[6],                // Coluna 6: Estoque
                    descricao: col[7]               // Coluna 7: Descrição
                };
                break;
            }
        }

        if (!produto) {
            container.innerHTML = "<h2>Produto não encontrado!</h2>";
            return;
        }

        // CÁLCULOS DE PREÇO (Sempre terminando em ,99)
        let aVista = Math.floor(produto.precoCusto * 1.35) + 0.99;
        let totalCartao = Math.floor(produto.precoCusto * 1.45) + 0.99;
        let parcela = (totalCartao / 5).toFixed(2).replace('.', ',');

        // Caminho da imagem
        let imgFinal = produto.img.startsWith('http') ? produto.img : '../img/' + produto.img;

        container.innerHTML = `
            <div class="produto-wrapper" style="display: flex; gap: 40px; flex-wrap: wrap; padding: 20px;">
                <div class="produto-imagem" style="flex: 1; min-width: 300px;">
                    <img src="${imgFinal}" style="width: 100%; border-radius: 8px;" onerror="this.src='../padrao.png'">
                </div>
                <div class="produto-info" style="flex: 1; min-width: 300px;">
                    <span style="background: #eee; padding: 4px 10px; border-radius: 4px; font-size: 0.8em;">${produto.categoria} ${produto.subcategoria ? '> ' + produto.subcategoria : ''}</span>
                    <h1 style="margin: 15px 0;">${produto.nome}</h1>
                    <p style="color: #666; margin-bottom: 20px;">${produto.descricao}</p>
                    
                    <div class="card-preco" style="background: #f9f9f9; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
                        <div style="color: var(--verde-principal); font-size: 2.2em; font-weight: 900;">
                            R$ ${aVista.toFixed(2).replace('.', ',')}
                            <small style="font-size: 0.4em; color: #666; display: block;">À VISTA NO PIX OU BOLETO</small>
                        </div>
                        <div style="margin-top: 15px; font-size: 1.2em; color: #444;">
                            Ou <strong>5x de R$ ${parcela}</strong> no cartão
                            <small style="display: block; font-size: 0.7em; color: #888;">Total parcelado: R$ ${totalCartao.toFixed(2).replace('.', ',')}</small>
                        </div>
                        <button onclick="adicionarAoCarrinho('${produto.nome}', ${aVista}, '${imgFinal}')" 
                                style="width: 100%; background: var(--verde-principal); color: white; border: none; padding: 15px; border-radius: 6px; font-weight: bold; font-size: 1.2em; margin-top: 20px; cursor: pointer;">
                            <i class="fas fa-shopping-cart"></i> Adicionar ao Carrinho
                        </button>
                    </div>
                </div>
            </div>
        `;
    } catch (e) {
        container.innerHTML = "<h2>Erro ao carregar dados.</h2>";
    }
}

function carregarRecomendados(todosProdutos, produtoAtual) {
    const container = document.getElementById('grid-recomendados');
    if (!container) return;

    let recomendados = todosProdutos.filter(p => p.categoria === produtoAtual.categoria && p.nome !== produtoAtual.nome && p.estoque > 0);
    
    if (recomendados.length === 0) {
        recomendados = todosProdutos.filter(p => p.nome !== produtoAtual.nome && p.estoque > 0);
    }

    recomendados = recomendados.sort(() => Math.random() - 0.5);
    recomendados = recomendados.slice(0, 4);

    if (recomendados.length === 0) {
        container.innerHTML = '<p style="width:100%; text-align:center;">Nenhuma recomendação no momento.</p>';
        return;
    }

    container.innerHTML = recomendados.map(p => {
        // Verifica se é peça E está sem imagem para os cards de baixo
        const ehPecaRec = p.categoria.toLowerCase().includes('peça') || p.categoria.toLowerCase().includes('peca');
        const semImagemRec = p.img === '';
        
        let htmlImagemCard = '';

        if (!(ehPecaRec && semImagemRec)) {
            let img = p.img;
            if (img !== '' && !img.startsWith('http') && !img.startsWith('img/')) { img = 'img/' + img; }
            if (img === '') img = IMG_FALHA;
            htmlImagemCard = `<img src="${img}" onerror="this.src='${IMG_FALHA}'" alt="${p.nome}">`;
        } else {
            // Um leve espaçamento se não houver foto no card, para não colar o texto no topo
            htmlImagemCard = `<div style="height: 20px;"></div>`; 
        }

        let temDesconto = p.precoAntigo > p.preco;
        let htmlPrecoAntigo = temDesconto ? `<div class="preco-antigo">De: R$ ${p.precoAntigo.toFixed(2).replace('.',',')}</div>` : `<div class="preco-antigo"></div>`;
        let seloHTML = temDesconto ? `<div class="selo-desconto">${Math.round(((p.precoAntigo - p.preco) / p.precoAntigo) * 100)}% OFF</div>` : '';
        
        return `
            <a href="produto.html?nome=${encodeURIComponent(p.nome)}" style="text-decoration:none; color:inherit; display:block; height:100%;">
                <div class="cartao-produto">
                    ${seloHTML}
                    ${htmlImagemCard}
                    <h3>${p.nome}</h3>
                    <div style="width:100%; margin-top: auto;">
                        ${htmlPrecoAntigo}
                        <div class="preco-atual">R$ ${p.preco.toFixed(2).replace('.', ',')}</div>
                        <button class="btn-comprar">Ver Detalhes</button>
                    </div>
                </div>
            </a>`;
    }).join('');
}

function adicionarAoCarrinho(nome, preco, img) {
    let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
    carrinho.push({ nome: nome, preco: preco, img: img });
    localStorage.setItem('carrinho', JSON.stringify(carrinho));
    atualizarContador();
    alert(`${nome} adicionado ao carrinho!`);
}

window.onload = () => { carregarProduto(); atualizarContador(); };
