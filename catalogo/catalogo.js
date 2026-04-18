const URL_PLANILHA = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSjwdcNetNoRZzXi20wyCVlMwhQf86ckoI8ZcIDui7wnvQpxUg7NIAio6HEu_CMHqyG1yT4Rcee_q6H/pub?output=csv';

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

    let temDesconto = p.precoAntigo > p.preco;
    let htmlPrecoAntigo = temDesconto ? `<div class="preco-antigo">De: R$ ${p.precoAntigo.toFixed(2).replace('.',',')}</div>` : `<div class="preco-antigo" style="height:20px;"></div>`;
    let seloHTML = temDesconto ? `<div class="selo-desconto">${Math.round(((p.precoAntigo - p.preco) / p.precoAntigo) * 100)}% OFF</div>` : '';
    
    return `
        <a href="../produto/produto.html?nome=${encodeURIComponent(p.nome)}" style="text-decoration:none; color:inherit; display:block; height:100%;">
            <div class="cartao-produto">
                ${seloHTML}
                <img src="${img}" onerror="this.src='../padrao.png'" alt="${p.nome}">
                <h3>${p.nome}</h3>
                <div style="width:100%;">
                    ${htmlPrecoAntigo}
                    <div class="preco-atual">R$ ${p.preco.toFixed(2).replace('.', ',')}</div>
                    <button class="btn-comprar" style="width:100%; margin-top:10px;">Ver Detalhes</button>
                </div>
            </div>
        </a>`;
}

async function carregarCatalogo() {
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
        }).filter(p => p !== null && p.estoque > 0);

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

window.onload = () => { carregarCatalogo(); atualizarContador(); };
