const URL_API_PRODUTOS = '/api/produtos.php';

const CACHE_PRODUTOS = 'giacomini_produtos_cache';
const TEMPO_CACHE = 5 * 60 * 1000;

function numeroSeguro(valor) {
    if (typeof valor === 'number') {
        return Number.isFinite(valor) ? valor : 0;
    }

    if (valor === null || valor === undefined) {
        return 0;
    }

    let texto = String(valor)
        .trim()
        .replace('R$', '')
        .replace(/\s/g, '');

    if (texto.includes(',') && texto.includes('.')) {
        texto = texto
            .replace(/\./g, '')
            .replace(',', '.');
    } else if (texto.includes(',')) {
        texto = texto.replace(',', '.');
    }

    const numero = Number(texto);

    return Number.isFinite(numero)
        ? numero
        : 0;
}


function normalizarProduto(produto) {

    return {
        sku: produto.sku || '',

        nome: produto.nome || '',

        marca: produto.marca || '',

        categoria: produto.categoria || '',

        subcategoria:
            produto.subcategoria || '',

        precoVista:
            numeroSeguro(produto.precoVista),

        precoParcelado:
            numeroSeguro(produto.precoParcelado),

        precoDe:
            Math.max(
                numeroSeguro(produto.precoParcelado),
                numeroSeguro(produto.precoVista)
            ),

        preco:
            numeroSeguro(produto.precoVista),

        precoAntigo:
            numeroSeguro(produto.precoParcelado),

        img:
            produto.imagem || produto.img || '',

        estoque:
            parseInt(produto.estoque, 10) || 0,

        descricao:
            produto.descricao || '',

        pesoKg:
            numeroSeguro(produto.pesoKg),

        dimensoes:
            produto.dimensoes || ''
    };
}


async function carregarProdutos() {

    const cacheSalvo =
        sessionStorage.getItem(
            CACHE_PRODUTOS
        );

    if (cacheSalvo) {

        try {

            const cache =
                JSON.parse(cacheSalvo);

            const cacheValido =
                Date.now() -
                cache.timestamp <
                TEMPO_CACHE;

            if (
                cacheValido &&
                Array.isArray(cache.produtos)
            ) {
                console.log(
                    'Produtos carregados do cache.'
                );

                return cache.produtos;
            }

        } catch (erro) {

            console.warn(
                'Cache inválido.',
                erro
            );

            sessionStorage.removeItem(
                CACHE_PRODUTOS
            );
        }
    }


    console.log(
        'Carregando produtos pela API PHP...'
    );

    const resposta =
        await fetch(
            URL_API_PRODUTOS,
            {
                cache: 'no-store'
            }
        );


    if (!resposta.ok) {
        throw new Error(
            `Erro HTTP ${resposta.status} ao carregar produtos.`
        );
    }


    const dados =
        await resposta.json();


    if (!Array.isArray(dados)) {
        throw new Error(
            'A API não retornou uma lista de produtos.'
        );
    }


    const produtos =
        dados
            .map(normalizarProduto)
            .filter(
                produto =>
                    produto.nome.trim() !== ''
            );


    sessionStorage.setItem(
        CACHE_PRODUTOS,
        JSON.stringify({
            timestamp: Date.now(),
            produtos
        })
    );


    return produtos;
}