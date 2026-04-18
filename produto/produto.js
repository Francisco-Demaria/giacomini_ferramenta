const URL_PLANILHA = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSjwdcNetNoRZzXi20wyCVlMwhQf86ckoI8ZcIDui7wnvQpxUg7NIAio6HEu_CMHqyG1yT4Rcee_q6H/pub?output=csv';
const IMG_FALHA = 'https://via.placeholder.com/150?text=Sem+Foto'; // Evita erro 404 no VSCode

function atualizarContador() {
    let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
    let contador = document.getElementById('contador-carrinho');
    if(contador) contador.innerText = carrinho.length;
}

async function carregarProduto() {
    const parametros = new URLSearchParams(window.location.search);
    const nomeProduto = parametros.get('nome');

    if (!nomeProduto) {
        document.getElementById('detalhes-produto').innerHTML = '<p class="mensagem-carregando">Produto não encontrado.</p>';
        return;
    }

    try {
        const resposta = await fetch(URL_PLANILHA);
        const dadosTexto = await resposta.text();
        const linhas = dadosTexto.split(/\r?\n/).slice(1).filter(l => l.trim() !== "");

        let produtos = linhas.map(linha => {
            const col = linha.split(',');
            if (col.length < 4) return null; 
            
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
        }).filter(p => p !== null);

        const produto = produtos.find(p => p.nome === nomeProduto);

        if (!produto) {
            document.getElementById('detalhes-produto').innerHTML = '<p class="mensagem-carregando">Produto não encontrado ou sem estoque.</p>';
            return;
        }

        // ============================================
        // 1. RENDERIZA O PRODUTO PRINCIPAL
        // ============================================
        
        // Verifica se é peça E está sem imagem
        const ehPeca = produto.categoria.toLowerCase().includes('peça') || produto.categoria.toLowerCase().includes('peca');
        const semImagem = produto.img === '';
        
        let htmlImagem = '';
        let imgParaCarrinho = IMG_FALHA; // Imagem padrão pro carrinho caso não tenha foto

        // Se NÃO for uma peça sem imagem, monta o bloco da foto normalmente
        if (!(ehPeca && semImagem)) {
            let imgProduto = produto.img;
            if (imgProduto !== '' && !imgProduto.startsWith('http') && !imgProduto.startsWith('img/')) {
                imgProduto = 'img/' + imgProduto;
            }
            if (imgProduto === '') imgProduto = IMG_FALHA;
            
            imgParaCarrinho = imgProduto; // Salva a imagem real para mandar pro carrinho

            htmlImagem = `
                <div class="imagem-detalhe-container">
                    <img src="${imgProduto}" alt="${produto.nome}" onerror="this.src='${IMG_FALHA}'">
                </div>
            `;
        }

        let temDesconto = produto.precoAntigo > produto.preco;
        let htmlPrecoAntigo = temDesconto ? `<p class="info-detalhe-preco-antigo">De: R$ ${produto.precoAntigo.toFixed(2).replace('.', ',')}</p>` : '';
        let txtSubcategoria = produto.subcategoria ? ` > ${produto.subcategoria}` : '';

        // Injeta na tela (se a imagem não existir, a info estica 100%)
        document.getElementById('detalhes-produto').innerHTML = `
            <div class="layout-detalhe-produto">
                ${htmlImagem}
                <div class="info-detalhe-container">
                    <h2>${produto.nome}</h2>
                    <p class="info-detalhe-categoria"><strong>Categoria:</strong> ${produto.categoria}${txtSubcategoria}</p>
                    ${htmlPrecoAntigo}
                    <div class="info-detalhe-preco-atual">R$ ${produto.preco.toFixed(2).replace('.', ',')}</div>
                    <p class="info-detalhe-descricao">${produto.descricao}</p>
                    <p class="info-detalhe-estoque" style="color: ${produto.estoque > 0 ? 'green' : 'red'};"><strong>Estoque:</strong> ${produto.estoque} unidades</p>
                    <button class="btn-adicionar-carrinho" onclick="adicionarAoCarrinho('${produto.nome}', ${produto.preco}, '${imgParaCarrinho}')">Adicionar ao Carrinho</button>
                </div>
            </div>
        `;

        // ============================================
        // 2. RENDERIZA OS RECOMENDADOS
        // ============================================
        carregarRecomendados(produtos, produto);

    } catch (erro) {
        console.error("Erro ao carregar o produto:", erro);
        document.getElementById('detalhes-produto').innerHTML = '<p class="mensagem-carregando">Erro ao carregar os detalhes do produto.</p>';
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