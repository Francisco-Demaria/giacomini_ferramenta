const URL_PLANILHA = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSjwdcNetNoRZzXi20wyCVlMwhQf86ckoI8ZcIDui7wnvQpxUg7NIAio6HEu_CMHqyG1yT4Rcee_q6H/pub?output=csv';

function parseCSV(linha) {
    const regexCSV = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;

    return linha.split(regexCSV).map(valor =>
        valor.trim().replace(/^"|"$/g, '')
    );
}

async function carregarProdutos() {
    const resposta = await fetch(
        URL_PLANILHA + '&t=' + Date.now()
    );

    if (!resposta.ok) {
        throw new Error('Não foi possível carregar a planilha.');
    }

    const dadosTexto = await resposta.text();

    const linhas = dadosTexto
        .split(/\r?\n/)
        .slice(1)
        .filter(linha => linha.trim() !== '');

    return linhas
        .map(linha => {
            const col = parseCSV(linha);

            if (col.length < 4) {
                return null;
            }

            return {
                nome: col[0] || '',
                categoria: col[1] || '',
                subcategoria: col[2] || '',

                // Valor vindo da planilha
                preco: parseFloat(col[3]) || 0,

                // Valor especial/tabelado
                precoAntigo: parseFloat(col[4]) || 0,

                img: col[5] || '',

                estoque: parseInt(col[6]) || 0,

                descricao: col[7] || ''
            };
        })
        .filter(produto => produto !== null);
}