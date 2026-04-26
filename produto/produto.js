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
            // Expressão regular segura para não partir descrições que tenham vírgulas
            const regexCSV = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
            const col = linha.split(regexCSV);
            
            if (col.length < 4) return null; 
            
            // JÁ FAZEMOS O CÁLCULO AQUI PARA NÃO QUEBRAR OS RECOMENDADOS!
            let custo = parseFloat(col[3]) || 0;
            let precoVenda = Math.floor(custo * 1.35) + 0.99;
            let precoTabela = Math.floor(custo * 1.65) + 0.99;

            return {
                nome: col[0] ? col[0].trim().replace(/^"|"$/g, '') : '',
                categoria: col[1] ? col[1].trim().replace(/^"|"$/g, '') : '',
                subcategoria: col[2] ? col[2].trim().replace(/^"|"$/g, '') : '',
                precoCusto: custo,        // Guardamos o custo original para calcular o parcelamento depois
                preco: precoVenda,        // O 'preco' volta ao normal para os Recomendados lerem
                precoAntigo: precoTabela, // O 'precoAntigo' volta para exibir o "De:" nos Recomendados
                img: col[5] ? col[5].trim().replace(/^"|"$/g, '') : '',
                estoque: parseInt(col[6]) || 0,
                descricao: col[7] ? col[7].trim().replace(/^"|"$/g, '') : ''
            };
        }).filter(p => p !== null);

        const produto = produtos.find(p => p.nome === nomeProduto);

        if (!produto) {
            document.getElementById('detalhes-produto').innerHTML = '<p class="mensagem-carregando">Produto não encontrado ou sem stock.</p>';
            return;
        }

        // ============================================
        // 1. CÁLCULO DO PARCELAMENTO (PRODUTO PRINCIPAL)
        // ============================================
        let precoParcelado = Math.floor(produto.precoCusto * 1.45) + 0.99;
        let valorParcela = (precoParcelado / 5).toFixed(2).replace('.', ',');

        // ============================================
        // 2. LÓGICA DE IMAGEM
        // ============================================
        const ehPeca = produto.categoria.toLowerCase().includes('peça') || produto.categoria.toLowerCase().includes('peca');
        const semImagem = produto.img === '';
        
        let htmlImagem = '';
        let imgParaCarrinho = IMG_FALHA;

        if (!(ehPeca && semImagem)) {
            let imgProduto = produto.img;
            if (imgProduto !== '' && !imgProduto.startsWith('http') && !imgProduto.startsWith('../img/')) {
                imgProduto = '../img/' + imgProduto;
            }
            if (imgProduto === '') imgProduto = IMG_FALHA;
            
            imgParaCarrinho = imgProduto;

            htmlImagem = `
                <div class="imagem-detalhe-container" style="flex: 1; min-width: 300px;">
                    <img src="${imgProduto}" alt="${produto.nome}" onerror="this.src='${IMG_FALHA}'" style="width: 100%; border-radius: 8px;">
                </div>
            `;
        }

        let txtSubcategoria = produto.subcategoria ? ` > ${produto.subcategoria}` : '';

        // ============================================
        // 3. RENDERIZAÇÃO DO HTML
        // ============================================
        document.getElementById('detalhes-produto').innerHTML = `
            <div class="layout-detalhe-produto" style="display: flex; gap: 30px; flex-wrap: wrap; padding: 20px;">
                ${htmlImagem}
                <div class="info-detalhe-container" style="flex: 1; min-width: 300px;">
                    <span style="background: #eee; padding: 4px 10px; border-radius: 4px; font-size: 0.8em; text-transform: uppercase;">${produto.categoria}${txtSubcategoria}</span>
                    <h2 style="margin-top: 15px; font-size: 2em;">${produto.nome}</h2>
                    
                    <div class="bloco-precos" style="margin: 20px 0; padding: 20px; background: #fff; border: 1px solid #eee; border-radius: 10px;">
                        <p style="text-decoration: line-through; color: #999; margin-bottom: 5px;">De: R$ ${produto.precoAntigo.toFixed(2).replace('.', ',')}</p>
                        <p style="color: #666; font-size: 0.9em; margin-bottom: 5px;">Por apenas:</p>
                        <div style="color: var(--verde-principal); font-size: 2.5em; font-weight: 900; line-height: 1;">
                            R$ ${produto.preco.toFixed(2).replace('.', ',')}
                            <small style="font-size: 0.4em; color: #666; display: block; font-weight: normal; margin-top: 5px;">À VISTA</small>
                        </div>
                        
                        <div style="margin-top: 20px; padding-top: 15px; border-top: 1px dotted #ccc;">
                            <p style="font-size: 1.2em; color: #444;">Ou <strong>5x de R$ ${valorParcela}</strong> no cartão</p>
                            <small style="color: #888;">(Total parcelado: R$ ${precoParcelado.toFixed(2).replace('.', ',')})</small>
                        </div>
                    </div>

                    <p class="info-detalhe-descricao" style="line-height: 1.6; color: #555; margin-bottom: 20px;">${produto.descricao}</p>
                    
                    <button class="btn-adicionar-carrinho" 
                            onclick="adicionarAoCarrinho('${produto.nome}', ${produto.preco}, '${imgParaCarrinho}')"
                            style="width: 100%; padding: 18px; background: var(--verde-principal); color: white; border: none; border-radius: 8px; font-weight: bold; font-size: 1.2em; cursor: pointer;">
                        <i class="fas fa-shopping-cart"></i> ADICIONAR AO CARRINHO
                    </button>
                </div>
            </div>
        `;

        // Agora a função de recomendados já não falha porque encontra o "p.preco" normal
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

function abrirMenu() { document.getElementById('menu-lateral').classList.add('aberto'); document.getElementById('overlay').style.display = 'block'; }
function fecharMenu() { document.getElementById('menu-lateral').classList.remove('aberto'); document.getElementById('overlay').style.display = 'none'; }


window.onload = () => { carregarProduto(); atualizarContador(); };
