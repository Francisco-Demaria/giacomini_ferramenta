// ===============================
// SISTEMA DE PAGINAÇÃO
// ===============================

const PRODUTOS_POR_LOTE = 20;

let todosProdutos = [];
let produtosFiltrados = [];

let indiceAtual = 0;

function renderizarMaisProdutos() {
    const grid = document.getElementById('lista-maquinas');
    const loading = document.getElementById('loading-produtos');
    const fim = document.getElementById('fim-produtos');

    if (!grid) return;

    const lote = produtosFiltrados.slice(
        indiceAtual,
        indiceAtual + PRODUTOS_POR_LOTE
    );

    if (lote.length === 0) {
        loading.hidden = true;
        fim.hidden = false;
        return;
    }

    loading.hidden = false;
    fim.hidden = true;

    grid.insertAdjacentHTML(
        'beforeend',
        lote.map(criarCartao).join('')
    );

    indiceAtual += lote.length;

    if (indiceAtual >= produtosFiltrados.length) {
        loading.hidden = true;
        fim.hidden = false;
    } else {
        loading.hidden = true;
    }
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

    if (img !== '' && !img.startsWith('http') && !img.startsWith('img/')) {
        img = 'img/' + img;
    }

    if (img === '') {
        img = 'padrao.png';
    }

    // =========================================================
    // LÓGICA DE PREÇOS
    // =========================================================

    const precoTabela = p.precoDe;
    const precoAVista = p.precoVista;
    const precoParcelado = p.precoParcelado;   

    const valorParcela =
        (precoParcelado / 5)
            .toFixed(2)
            .replace('.', ',');


    // =========================================================
    // HTML DO CARD
    // =========================================================

    return `
        <a href="../produto/produto.html?nome=${encodeURIComponent(p.nome)}"
           class="link-produto">

            <div class="cartao-produto">

                <div class="selo-desconto">
                    OFERTA
                </div>

                <img
                    src="${img}"
                    alt="${p.nome}"
                    loading="lazy"
                    decoding="async"
                >

                <h3>${p.nome}</h3>

                <div
                    class="precos-container"
                >

                    <div class="preco-tabela">
                        De:
                        R$
                        ${precoTabela.toFixed(2).replace('.', ',')}
                    </div>

                    <div class="texto-por-apenas">
                        Por apenas
                    </div>

                    <div class="peco-vista">
                        R$
                        ${precoAVista.toFixed(2).replace('.', ',')}

                        <small class="preco-vista-label">
                            à vista
                        </small>
                    </div>

                    <div class="preco-parcelado">
                        ou 5x de R$ ${valorParcela}
                    </div>

                    <div class="info-parcelamento">
                        (R$
                        ${precoParcelado.toFixed(2).replace('.', ',')}
                        no cartão)
                    </div>

                    <button class="btn-comprar">
                        Ver Detalhes
                    </button>

                </div>
            </div>

        </a>
    `;
}

async function carregarCatalogo() {
    try {
        const produtosCarregados = await carregarProdutos();

        let produtos = produtosCarregados.filter(
            p => p.estoque > 0
        );

        todosProdutos = [...produtos];

        // ==========================================
        // BUSCA PELA URL
        // ==========================================

        const urlParams =
            new URLSearchParams(window.location.search);

        const termoBusca =
            urlParams.get('busca');

        if (termoBusca) {
            const termoMinusculo =
                termoBusca.toLowerCase().trim();

            produtos = produtos.filter(p =>
                p.nome.toLowerCase().includes(termoMinusculo) ||
                p.descricao.toLowerCase().includes(termoMinusculo)
            );

            console.log(
                "Mostrando resultados para:",
                termoBusca
            );
        }

        // ==========================================
        // SEPARAÇÃO: MÁQUINAS / PEÇAS
        // ==========================================

        const maquinas = produtos.filter(p =>
            !p.categoria.toLowerCase().includes('peça') &&
            !p.categoria.toLowerCase().includes('peca')
        );

        const pecas = produtos.filter(p =>
            p.categoria.toLowerCase().includes('peça') ||
            p.categoria.toLowerCase().includes('peca')
        );

        const containerMaquinas =
            document.getElementById('lista-maquinas');

        const containerPecas =
            document.getElementById('container-grupos-pecas');

// ==========================================
// MÁQUINAS
// ==========================================

if (containerMaquinas) {

    produtosFiltrados = maquinas;
    indiceAtual = 0;

    containerMaquinas.innerHTML = '';

    if (produtosFiltrados.length > 0) {

        renderizarMaisProdutos();

    } else {

        containerMaquinas.innerHTML = `
            <p class="mensagem-vazia">
                Nenhum resultado encontrado.
            </p>
        `;
    }
}
        // ==========================================
        // PEÇAS
        // ==========================================

        if (containerPecas) {

            if (pecas.length > 0) {

                let grupos = {};

                pecas.forEach(p => {

                    let sub =
                        p.subcategoria === ''
                            ? 'Outras Peças'
                            : p.subcategoria;

                    if (!grupos[sub]) {
                        grupos[sub] = [];
                    }

                    grupos[sub].push(p);
                });

                let htmlGrupos = '';

                for (let subcat in grupos) {

                    let idSubcat =
                        subcat
                            .replace(/[^a-zA-Z0-9]/g, '')
                            .toLowerCase();

                    htmlGrupos += `
                        <div>

                            <div
                                class="sanfona-subcategoria"
                                onclick="abrirSubcategoria('${idSubcat}')"
                            >
                                <span>
                                    ⚙️ ${subcat}

                                    <span class="info-subcategoria">
                                        (${grupos[subcat].length} itens)
                                    </span>
                                </span>

                                <span>▼</span>
                            </div>

                            <div
                                class="conteudo-subcategoria"
                                id="subcat-${idSubcat}"
                            >

                                ${grupos[subcat].map(p => `

                                    <div class="item-peca-simples">

                                        <div>

                                            <strong class="nome-peca">
                                                ${p.nome}
                                            </strong>

                                            <br>

                                            <span class="descricao-peca">
                                                Estoque:
                                                ${p.estoque}
                                                |
                                                ${p.descricao}
                                            </span>

                                        </div>

                                        <div class="direita">

                                            <strong class="preco-peca">
                                                R$
                                                ${p.precoVista
                                                    .toFixed(2)
                                                    .replace('.', ',')}
                                            </strong>

                                            <a
                                                href="../produto/produto.html?nome=${encodeURIComponent(p.nome)}"
                                                class="btn-comprar btn-detalhes-peca">
                                                Ver Detalhes
                                            </a>

                                        </div>

                                    </div>

                                `).join('')}

                            </div>

                        </div>
                    `;
                }

                containerPecas.innerHTML =
                    htmlGrupos;

            } else {

                containerPecas.innerHTML = `
                    <p class="mensagem-vazia">
                        Nenhum resultado encontrado.
                    </p>
                `;
            }
        }

    } catch (erro) {

        console.error(
            "Erro na planilha",
            erro
        );
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
    if (todosProdutos.length === 0) return;

    let filtrados = [...todosProdutos];

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
        const precoVenda =
            p.precoVista;
        
        // Compara se o preço de venda está dentro do que o cliente digitou
        return precoVenda >= precoMin && precoVenda <= precoMax;
    });

    // 4. Ordenação
    if (ordem === 'menor-preco') {
        filtrados.sort((a, b) => a.precoVista - b.precoVista);
    }

    else if (ordem === 'maior-preco') {
        filtrados.sort((a, b) => b.precoVista - a.precoVista);
    }

    const containerMaquinas = document.getElementById('sessao-maquinas');
    const containerGrid = document.getElementById('lista-maquinas');
    const containerPecas = document.getElementById('sessao-pecas');

    // 5. O SEGREDO DA SANFONA: Se for "Peças", monta em formato de lista expansível
    if (cat === 'peca') {
        containerMaquinas.style.display = 'none';
        containerPecas.style.display = 'block';

        if (filtrados.length === 0) {
            containerPecas.innerHTML = `
                <p class="mensagem-nenhuma-peca">
                    Nenhuma peça encontrada.
                </p>
            `;
        } else {
            let subcats = [...new Set(filtrados.map(p => p.subcategoria))];
            
            let htmlSanfona = subcats.map((sub, index) => {
                let pecasDaSub = filtrados.filter(p => p.subcategoria === sub);
                return `
                    <div class="grupo-sanfona">
                        <button onclick="abrirSanfona('sanfona-${index}')" class="btn-sanfona">
                            ${sub || 'Outras Peças'} <i class="fas fa-chevron-down"></i>
                        </button>
                        <div id="sanfona-${index}" class="conteudo-sanfona">
                            ${pecasDaSub.map(p => `
                                <div class="linha-peca">
                                    <div>
                                        <strong class="nome-peca-sanfona">${p.nome}</strong><br>
                                        <span class="info-peca-sanfona">Estoque: ${p.estoque} | ${p.descricao}</span>
                                    </div>
                                    <div style="text-align: right; min-width: 100px;">
                                        <strong style="color: var(--verde-destaque); font-size: 1.1em; display: block; margin-bottom: 5px;">R$ ${p.precoVista.toFixed(2).replace('.',',')}</strong>
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

        produtosFiltrados = filtrados;
        indiceAtual = 0;

        containerGrid.innerHTML = '';

        if (produtosFiltrados.length > 0) {
            renderizarMaisProdutos();
        } else {
            containerGrid.innerHTML = `
                <p class="mensagem-vazia">
                    Nenhum produto encontrado com estes filtros.
                </p>
            `;
        }
    }
}
    
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

const observer = new IntersectionObserver((entries) => {

    if (!entries[0].isIntersecting) return;

    if (indiceAtual >= produtosFiltrados.length) return;

    renderizarMaisProdutos();

}, {
    rootMargin: '300px'
});

const sentinela =
    document.getElementById('sentinela-produtos');

if (sentinela) {
    observer.observe(sentinela);
}
