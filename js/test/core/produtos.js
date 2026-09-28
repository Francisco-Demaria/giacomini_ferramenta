const URL_PLANILHA =
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vSjwdcNetNoRZzXi20wyCVlMwhQf86ckoI8ZcIDui7wnvQpxUg7NIAio6HEu_CMHqyG1yT4Rcee_q6H/pub?output=csv';

function parseCSV(texto) {
    const linhas = [];
    let linha = [];
    let valor = '';
    let dentroAspas = false;

    for (let i = 0; i < texto.length; i++) {
        const char = texto[i];
        const proximo = texto[i + 1];

        if (char === '"') {
            if (dentroAspas && proximo === '"') {
                valor += '"';
                i++;
            } else {
                dentroAspas = !dentroAspas;
            }
        }

        else if (char === ',' && !dentroAspas) {
            linha.push(valor.trim());
            valor = '';
        }

        else if (
            (char === '\n' || char === '\r') &&
            !dentroAspas
        ) {
            if (char === '\r' && proximo === '\n') {
                i++;
            }

            linha.push(valor.trim());
            valor = '';

            if (linha.some(c => c !== '')) {
                linhas.push(linha);
            }

            linha = [];
        }

        else {
            valor += char;
        }
    }

    if (valor !== '' || linha.length > 0) {
        linha.push(valor.trim());

        if (linha.some(c => c !== '')) {
            linhas.push(linha);
        }
    }

    return linhas;
}

function numero(valor) {
    if (valor === undefined || valor === null) {
        return 0;
    }

    let texto = String(valor)
        .trim()
        .replace(/^"|"$/g, '');

    if (!texto) {
        return 0;
    }

    // Trata valores brasileiros:
    // 1.234,56 -> 1234.56
    if (
        texto.includes('.') &&
        texto.includes(',')
    ) {
        texto = texto
            .replace(/\./g, '')
            .replace(',', '.');
    }

    else if (texto.includes(',')) {
        texto = texto.replace(',', '.');
    }

    const valorNumerico = parseFloat(texto);

    return Number.isFinite(valorNumerico)
        ? valorNumerico
        : 0;
}

function inteiro(valor) {
    const numeroInteiro = parseInt(
        String(valor ?? '').replace(/\D/g, ''),
        10
    );

    return Number.isFinite(numeroInteiro)
        ? numeroInteiro
        : 0;
}

async function carregarProdutos() {

    console.log(
        'Carregando produtos da planilha...'
    );

    const resposta = await fetch(
        URL_PLANILHA,
        {
            cache: 'no-store'
        }
    );

    if (!resposta.ok) {
        throw new Error(
            `Não foi possível carregar a planilha. HTTP ${resposta.status}`
        );
    }

    const dadosTexto =
        await resposta.text();

    if (!dadosTexto.trim()) {
        throw new Error(
            'A planilha retornou vazia.'
        );
    }

    const linhas =
        parseCSV(dadosTexto);

    if (linhas.length < 2) {
        throw new Error(
            'A planilha não possui produtos.'
        );
    }

    /*
     * Cabeçalhos atuais:
     *
     * SKU
     * Nome
     * Marca
     * Categoria
     * Subcategoria
     * Preço de Compra
     * Preço à vista
     * Preço Parcelado
     * Imagem
     * Estoque
     * Descrição
     * Peso [Kg]
     * CxLxA [m]
     * EAN/GTIN
     * ML
     */

    const cabecalho = linhas[0].map(
        coluna =>
            coluna
                .trim()
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
    );

    const coluna = nome => {
        return cabecalho.indexOf(
            nome
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
        );
    };

    const indices = {
        sku: coluna('sku'),
        nome: coluna('nome'),
        marca: coluna('marca'),
        categoria: coluna('categoria'),
        subcategoria: coluna('subcategoria'),
        precoCompra: coluna('preco de compra'),
        precoVista: coluna('preco a vista'),
        precoParcelado: coluna('preco parcelado'),
        imagem: coluna('imagem'),
        estoque: coluna('estoque'),
        descricao: coluna('descricao'),
        peso: coluna('peso [kg]'),
        medidas: coluna('cxlxa [m]'),
        ean: coluna('ean/gtin'),
        ml: coluna('ml')
    };

    if (
        indices.nome === -1 ||
        indices.categoria === -1
    ) {
        console.error(
            'Cabeçalho encontrado:',
            cabecalho
        );

        throw new Error(
            'Não encontrei as colunas Nome e Categoria na planilha.'
        );
    }

    const produtos = [];

    for (
        let i = 1;
        i < linhas.length;
        i++
    ) {
        const linha = linhas[i];

        const pegar = indice => {
            if (
                indice === -1 ||
                indice >= linha.length
            ) {
                return '';
            }

            return String(
                linha[indice] ?? ''
            ).trim();
        };

        const nome = pegar(indices.nome);

        if (!nome) {
            continue;
        }

        const estoque =
            inteiro(
                pegar(indices.estoque)
            );

        const precoVista =
            numero(
                pegar(indices.precoVista)
            );

        const precoParcelado =
            numero(
                pegar(indices.precoParcelado)
            );

        const precoCompra =
            numero(
                pegar(indices.precoCompra)
            );

        const imagem =
            pegar(indices.imagem);

        const produto = {

            sku:
                pegar(indices.sku),

            nome,

            marca:
                pegar(indices.marca),

            categoria:
                pegar(indices.categoria),

            subcategoria:
                pegar(indices.subcategoria),

            precoCompra,

            precoVista,

            precoParcelado,

            // Compatibilidade com o código antigo
            preco:
                precoVista,

            precoDe:
                precoCompra,

            precoAntigo:
                precoCompra,

            img:
                imagem,

            imagem,

            estoque,

            /*
             * IMPORTANTE:
             * estoque 0 NÃO significa
             * produto indisponível.
             *
             * Os produtos da Makita podem
             * ser vendidos sob encomenda.
             */
            disponivel: true,

            descricao:
                pegar(indices.descricao),

            peso:
                numero(
                    pegar(indices.peso)
                ),

            medidas:
                pegar(indices.medidas),

            ean:
                pegar(indices.ean),

            ml:
                pegar(indices.ml),

            possuiPrecoEspecial:
                false
        };

        produtos.push(produto);
    }

    console.log(
        `Produtos carregados da planilha: ${produtos.length}`
    );

    return produtos;
}