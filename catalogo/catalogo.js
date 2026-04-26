const URL_PLANILHA = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSjwdcNetNoRZzXi20wyCVlMwhQf86ckoI8ZcIDui7wnvQpxUg7NIAio6HEu_CMHqyG1yT4Rcee_q6H/pub?output=csv';
let todosOsProdutosDaPlanilha = [];

function atualizarContador() {
    let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
    let contador = document.getElementById('contador-carrinho');
    if(contador) contador.innerText = carrinho.length;
}

function fazerBusca() {
    let termo = document.getElementById('input-busca').value;
    if(termo.trim() !== '') {
        window.location.href = 'catalogo.html?busca=' + encodeURIComponent(termo);
    }
}

function mudarCatalogo(tipo) {
    document.getElementById('sessao-maquinas').style.display = tipo === 'maquinas' ? 'block' : 'none';
    document.getElementById('sessao-pecas').style.display = tipo === 'pecas' ? 'block' : 'none';
    
    document.getElementById('btn-maquinas').classList.toggle('ativo', tipo === 'maquinas');
    document.getElementById('btn-pecas').classList.toggle('ativo', tipo === 'pecas');
}

function criarCartao(p) {
    let img = p.img;
    if (img !== '' && !img.startsWith('http') && !img.startsWith('../img/')) { img = '../img/' + img; }
    if (img === '') img = '../padrao.png';

    // CÁLCULO DOS PREÇOS (Baseado no custo da planilha)
    // À vista: Custo * 1.35 e arredonda para baixo + 0.99
    let precoAVista = Math.floor(p.preco * 1.35) + 0.99;
    // Parcelado: Custo * 1.45 e arredonda para baixo + 0.99
    let precoParcelado = Math.floor(p.preco * 1.45) + 0.99;
    let valorParcela = (precoParcelado / 5).toFixed(2).replace('.', ',');

    return `
        <a href="../produto/produto.html?nome=${encodeURIComponent(p.nome)}" style="text-decoration:none; color:inherit;">
            <div class="cartao-produto">
                <img src="${img}" alt="${p.nome}" onerror="this.src='../padrao.png'">
                <h3>${p.nome}</h3>
                
                <div class="precos-container" style="margin-top: auto; text-align: center;">
                    <div style="color: #666; font-size: 0.85em;">À vista</div>
                    <div style="color: var(--verde-principal); font-weight: 900; font-size: 1.4em; margin-bottom: 5px;">
                        R$ ${precoAVista.toFixed(2).replace('.', ',')}
                    </div>
                    
                    <div style="color: #444; font-size: 0.9em; font-weight: bold;">
                        5x de R$ ${valorParcela}
                    </div>
                    <div style="color: #888; font-size: 0.75em; margin-bottom: 15px;">
                        (R$ ${precoParcelado.toFixed(2).replace('.', ',')} no cartão)
                    </div>
                    
                    <button class="btn-comprar" style="width: 100%;">Ver Detalhes</button>
                </div>
            </div>
        </a>`;
}

async function carregarCatalogo() {
    try {
        // O Date().getTime() gera um número diferente a cada milissegundo, forçando o download limpo
        const resposta = await fetch(URL_PLANILHA + '&t=' + new Date().getTime());
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
        }).filter(p => p !== null && p.estoque > 0);

        todosOsProdutosDaPlanilha = [...produtos];
        
        // --- INÍCIO DA LÓGICA DE BUSCA ---
        // Verifica se existe o parâmetro "?busca=" na URL
        const urlParams = new URLSearchParams(window.location.search);
        const termoBusca = urlParams.get('busca');

        if (termoBusca) {
            const termoMinusculo = termoBusca.toLowerCase();
            // Filtra os produtos onde o NOME ou a DESCRIÇÃO contenham o termo pesquisado
            produtos = produtos.filter(p => 
                p.nome.toLowerCase().includes(termoMinusculo) || 
                p.descricao.toLowerCase().includes(termoMinusculo)
            );
            
            // Opcional: Mostra para o usuário o que ele pesquisou na tela (se quiser adicionar um elemento HTML depois)
            console.log("Mostrando resultados para:", termoBusca);
        }
        // --- FIM DA LÓGICA DE BUSCA ---

        const maquinas = produtos.filter(p => !p.categoria.toLowerCase().includes('peça') && !p.categoria.toLowerCase().includes('peca'));
        const pecas = produtos.filter(p => p.categoria.toLowerCase().includes('peça') || p.categoria.toLowerCase().includes('peca'));

        const containerMaquinas = document.getElementById('lista-maquinas');
        const containerPecas = document.getElementById('container-grupos-pecas');

        if (containerMaquinas) {
            containerMaquinas.innerHTML = maquinas.length > 0 ? maquinas.map(p => criarCartao(p)).join('') : '<p style="width:100%; text-align:center;">Nenhum resultado encontrado.</p>';
        }

        if (containerPecas) {
            if (pecas.length > 0) {
                let grupos = {};
                pecas.forEach(p => {
                    let sub = p.subcategoria === '' ? 'Outras Peças' : p.subcategoria;
                    if (!grupos[sub]) grupos[sub] = [];
                    grupos[sub].push(p);
                });

                let htmlGrupos = '';
                for (let subcat in grupos) {
                    let idSubcat = subcat.replace(/[^a-zA-Z0-9]/g, '').toLowerCase(); 
                    
                    htmlGrupos += `
                    <div>
                        <div class="sanfona-subcategoria" onclick="abrirSubcategoria('${idSubcat}')">
                            <span>⚙️ ${subcat} <span style="font-size:0.8em; font-weight:normal; color:#666;">(${grupos[subcat].length} itens)</span></span>
                            <span>▼</span>
                        </div>
                        <div class="conteudo-subcategoria" id="subcat-${idSubcat}">
                            ${grupos[subcat].map(p => `
                                <div class="item-peca-simples">
                                    <div>
                                        <strong style="font-size:1.1em;">${p.nome}</strong><br>
                                        <span style="color:#666; font-size: 0.9em;">Estoque: ${p.estoque} | ${p.descricao}</span>
                                    </div>
                                    <div class="direita" style="text-align: right; min-width: 120px;">
                                        <strong style="color:var(--verde-destaque); display:block; margin-bottom:8px; font-size:1.2em;">R$ ${p.preco.toFixed(2).replace('.', ',')}</strong>
                                        <a href="../produto/produto.html?nome=${encodeURIComponent(p.nome)}" class="btn-comprar" style="padding: 8px 15px; font-size: 0.9em; text-decoration:none; display:inline-block;">Ver Detalhes</a>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>`;
                }
                containerPecas.innerHTML = htmlGrupos;
            } else {
                containerPecas.innerHTML = '<p style="text-align:center;">Nenhum resultado encontrado.</p>';
            }
        }

    } catch (erro) {
        console.error("Erro na planilha", erro);
    }
}

function abrirSubcategoria(id) {
    const conteudo = document.getElementById(`subcat-${id}`);
    if (conteudo) {
        conteudo.classList.toggle('ativo');
    }
}

window.onload = () => { carregarCatalogo(); atualizarContador(); };

window.aplicarSuperFiltro = function() {
    if (todosOsProdutosDaPlanilha.length === 0) return;

    let filtrados = [...todosOsProdutosDaPlanilha];

    const ordem = document.getElementById('filtro-ordem').value;
    const cat = document.querySelector('input[name="cat"]:checked').value;
    const bat = document.querySelector('input[name="bat"]:checked').value;
    const precoMin = parseFloat(document.getElementById('preco-min').value) || 0;
    const precoMax = parseFloat(document.getElementById('preco-max').value) || Infinity;

    // 1. Filtro de Categoria (aceita acentos ou sem acentos)
    if (cat !== 'todas') {
        filtrados = filtrados.filter(p => p.categoria.toLowerCase().includes(cat) || 
                                          (cat === 'peca' && p.categoria.toLowerCase().includes('peça')) ||
                                          (cat === 'acessorio' && p.categoria.toLowerCase().includes('acessório')));
    }

    // 2. Filtro de Bateria
    if (bat !== 'todas') {
        filtrados = filtrados.filter(p => p.nome.toLowerCase().includes(bat) || p.descricao.toLowerCase().includes(bat));
    }

    // 3. Filtro de Preço (Mín e Máx)
// 3. Filtro de Preço (Mín e Máx) baseado no PREÇO DE VENDA
    filtrados = filtrados.filter(p => {
        // Calcula o preço final que o cliente realmente vê na tela
        let precoVenda = Math.floor(p.preco * 1.35) + 0.99;
        
        // Compara se o preço de venda está dentro do que o cliente digitou
        return precoVenda >= precoMin && precoVenda <= precoMax;
    });

    // 4. Ordenação
    if (ordem === 'menor-preco') filtrados.sort((a, b) => a.preco - b.preco);
    else if (ordem === 'maior-preco') filtrados.sort((a, b) => b.preco - a.preco);

    const containerMaquinas = document.getElementById('sessao-maquinas');
    const containerGrid = document.getElementById('lista-maquinas');
    const containerPecas = document.getElementById('sessao-pecas');

    // 5. O SEGREDO DA SANFONA: Se for "Peças", monta em formato de lista expansível
    if (cat === 'peca') {
        containerMaquinas.style.display = 'none';
        containerPecas.style.display = 'block';

        if (filtrados.length === 0) {
            containerPecas.innerHTML = '<p style="padding: 40px; text-align: center; color: #666;">Nenhuma peça encontrada.</p>';
        } else {
            let subcats = [...new Set(filtrados.map(p => p.subcategoria))];
            
            let htmlSanfona = subcats.map((sub, index) => {
                let pecasDaSub = filtrados.filter(p => p.subcategoria === sub);
                return `
                    <div style="margin-bottom: 12px; border: 1px solid var(--borda); border-radius: 6px; overflow: hidden; background: #fff;">
                        <button onclick="abrirSanfona('sanfona-${index}')" style="width: 100%; background: #fff; padding: 18px; border: none; text-align: left; font-size: 1.1em; font-weight: bold; cursor: pointer; display: flex; justify-content: space-between; align-items: center; color: var(--grafite);">
                            ${sub || 'Outras Peças'} <i class="fas fa-chevron-down"></i>
                        </button>
                        <div id="sanfona-${index}" style="max-height: 0; overflow: hidden; transition: max-height 0.4s ease-in-out, padding 0.4s ease-in-out; background: #f9f9f9; padding: 0 15px;">
                            ${pecasDaSub.map(p => `
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px 0; border-bottom: 1px solid #eee;">
                                    <div>
                                        <strong style="color: var(--grafite); font-size: 1.05em;">${p.nome}</strong><br>
                                        <span style="font-size:0.85em; color:#777;">Estoque: ${p.estoque} | ${p.descricao}</span>
                                    </div>
                                    <div style="text-align: right; min-width: 100px;">
                                        <strong style="color: var(--verde-destaque); font-size: 1.1em; display: block; margin-bottom: 5px;">R$ ${p.preco.toFixed(2).replace('.',',')}</strong>
                                        <a href="../produto/produto.html?nome=${encodeURIComponent(p.nome)}" style="font-size: 0.85em; color: var(--branco); background: var(--verde-principal); padding: 6px 12px; border-radius: 4px; text-decoration: none;">Detalhes</a>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }).join('');
            
            containerPecas.innerHTML = htmlSanfona;
        }
    } 
    // Se não for "Peças", mostra os cartões normais!
    else {
        containerPecas.style.display = 'none';
        containerMaquinas.style.display = 'block';

        containerGrid.innerHTML = filtrados.length > 0 
            ? filtrados.map(p => criarCartao(p)).join('') 
            : '<p style="padding: 40px; text-align: center; width: 100%; color: #666;">Nenhum produto encontrado com estes filtros.</p>';
    }
};

// 6. Função para animar a abertura da sanfona
window.abrirSanfona = function(id) {
    const elemento = document.getElementById(id);
    if (elemento.style.maxHeight && elemento.style.maxHeight !== '0px') {
        elemento.style.maxHeight = '0px';
        elemento.style.paddingTop = '0px';
        elemento.style.paddingBottom = '0px';
    } else {
        elemento.style.maxHeight = elemento.scrollHeight + 40 + 'px'; // +40px de respiro
        elemento.style.paddingTop = '15px';
        elemento.style.paddingBottom = '15px';
    }
};
