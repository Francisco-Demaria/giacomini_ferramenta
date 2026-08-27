const URL_PLANILHA = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSjwdcNetNoRZzXi20wyCVlMwhQf86ckoI8ZcIDui7wnvQpxUg7NIAio6HEu_CMHqyG1yT4Rcee_q6H/pub?output=csv';

function parseCSV(linha) {
    const regexCSV = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;

    return linha.split(regexCSV).map(valor =>
        valor.trim().replace(/^"|"$/g, '')
    );
}

const CACHE_PRODUTOS = 'giacomini_produtos_cache';
const TEMPO_CACHE = 5 * 60 * 1000; // 5 minutos

async function carregarProdutos() {

    // ==========================================
    // 1. TENTA USAR O CACHE
    // ==========================================

    const cacheSalvo =
        sessionStorage.getItem(CACHE_PRODUTOS);

    if (cacheSalvo) {

        try {

            const cache =
                JSON.parse(cacheSalvo);

            const cacheValido =
                Date.now() - cache.timestamp < TEMPO_CACHE;

            if (
                cacheValido &&
                Array.isArray(cache.produtos) &&
                cache.produtos.every(p =>
                    p.precoVista !== undefined &&
                    p.precoParcelado !== undefined &&
                    p.precoDe !== undefined
                )
            ) {

    console.log('Produtos carregados do cache.');

    return cache.produtos;
}

        } catch (erro) {

            console.warn(
                'Cache inválido. Recarregando planilha.',
                erro
            );

            sessionStorage.removeItem(
                CACHE_PRODUTOS
            );
        }
    }

    // ==========================================
    // 2. BUSCA A PLANILHA
    // ==========================================

    console.log('Carregando produtos da planilha...');

    const resposta = await fetch(URL_PLANILHA);

    if (!resposta.ok) {
        throw new Error(
            'Não foi possível carregar a planilha.'
        );
    }

    const dadosTexto =
        await resposta.text();

    // ==========================================
    // 3. PROCESSA CSV
    // ==========================================

    const linhas =
        dadosTexto
            .split(/\r?\n/)
            .slice(1)
            .filter(
                linha => linha.trim() !== ''
            );

    const produtos = linhas
        .map(linha => {

            const col = parseCSV(linha);

            if (col.length < 4) {
                return null;
            }

            return {

                nome: col[0] || '',

                categoria: col[1] || '',

                subcategoria: col[2] || '',

                preco:
                    parseFloat(col[3]) || 0,

                precoAntigo:
                    parseFloat(col[4]) || 0,

                img: col[5] || '',

                estoque:
                    parseInt(col[6]) || 0,

                descricao: col[7] || ''
            };
        })
        .filter(
            produto => produto !== null
        );

    // ==========================================
    // 4. PROCESSA OS PRODUTOS
    // ==========================================

    const produtosProcessados = produtos.map(produto => {

        const precos = calcularPrecos(produto);

        return {
            ...produto,

            precoDe: precos.precoDe,
            precoVista: precos.precoVista,
            precoParcelado: precos.precoParcelado,
            possuiPrecoEspecial: precos.possuiPrecoEspecial
        };
    });


    // ==========================================
    // 5. SALVA NO CACHE
    // ==========================================

    sessionStorage.setItem(
        CACHE_PRODUTOS,
        JSON.stringify({
            timestamp: Date.now(),
            produtos: produtosProcessados
        })
    );


    // ==========================================
    // 6. RETORNA OS PRODUTOS
    // ==========================================

    return produtosProcessados;
}