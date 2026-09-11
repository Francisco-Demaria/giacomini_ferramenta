<?php

require_once __DIR__ . '/../includes/proteger.php';
require_once __DIR__ . '/../../config/banco.php';

$mensagem = '';
$erro = '';
$preview = null;

function normalizarCabecalho(string $texto): string
{
    $texto = trim($texto);

    $texto = mb_strtolower(
        $texto,
        'UTF-8'
    );

    $texto = strtr(
        $texto,
        [
            'á' => 'a',
            'à' => 'a',
            'ã' => 'a',
            'â' => 'a',
            'ä' => 'a',
            'é' => 'e',
            'ê' => 'e',
            'ë' => 'e',
            'í' => 'i',
            'ï' => 'i',
            'ó' => 'o',
            'ô' => 'o',
            'õ' => 'o',
            'ö' => 'o',
            'ú' => 'u',
            'ü' => 'u',
            'ç' => 'c'
        ]
    );

    $texto = preg_replace('/\s+/', ' ', $texto);

    return $texto;
}

function numeroMakita($valor): ?float
{
    if ($valor === null) {
        return null;
    }

    $valor = trim((string)$valor);

    if ($valor === '') {
        return null;
    }

    $valor = str_replace(
        ['R$', ' '],
        '',
        $valor
    );

    if (
        str_contains($valor, ',')
        && str_contains($valor, '.')
    ) {
        $valor = str_replace('.', '', $valor);
        $valor = str_replace(',', '.', $valor);

    } elseif (str_contains($valor, ',')) {

        $valor = str_replace(',', '.', $valor);
    }

    $numero = (float)$valor;

    return is_finite($numero)
        ? $numero
        : null;
}

function lerCsv(string $arquivo): array
{
    $handle = fopen($arquivo, 'r');

    if (!$handle) {
        throw new RuntimeException(
            'Não foi possível abrir o CSV.'
        );
    }

    $linhas = [];

    while (($linha = fgetcsv(
        $handle,
        0,
        ';'
    )) !== false) {

        $linhas[] = $linha;
    }

    fclose($handle);

    return $linhas;
}

function lerCsvVirgula(string $arquivo): array
{
    $handle = fopen($arquivo, 'r');

    if (!$handle) {
        throw new RuntimeException(
            'Não foi possível abrir o CSV.'
        );
    }

    $linhas = [];

    while (($linha = fgetcsv(
        $handle,
        0,
        ','
    )) !== false) {

        $linhas[] = $linha;
    }

    fclose($handle);

    return $linhas;
}

function extrairXlsx(string $arquivo): array
{
    if (!class_exists('ZipArchive')) {
        throw new RuntimeException(
            'A extensão ZipArchive não está disponível no servidor.'
        );
    }

    $zip = new ZipArchive();

    if ($zip->open($arquivo) !== true) {
        throw new RuntimeException(
            'Não foi possível abrir o XLSX.'
        );
    }

    $sharedStrings = [];

    $sharedXml = $zip->getFromName(
        'xl/sharedStrings.xml'
    );

    if ($sharedXml !== false) {

        $xml = simplexml_load_string($sharedXml);

        if ($xml !== false) {

            foreach ($xml->si as $si) {

                $texto = '';

                if (isset($si->t)) {
                    $texto = (string)$si->t;

                } elseif (isset($si->r)) {

                    foreach ($si->r as $run) {
                        $texto .= (string)$run->t;
                    }
                }

                $sharedStrings[] = $texto;
            }
        }
    }

    $sheetXml = $zip->getFromName(
        'xl/worksheets/sheet1.xml'
    );

    if ($sheetXml === false) {
        $zip->close();

        throw new RuntimeException(
            'A primeira planilha do XLSX não foi encontrada.'
        );
    }

    $xml = simplexml_load_string($sheetXml);

    if ($xml === false) {
        $zip->close();

        throw new RuntimeException(
            'Não foi possível interpretar a planilha.'
        );
    }

    $linhas = [];

    foreach ($xml->sheetData->row as $row) {

        $dados = [];

        foreach ($row->c as $cell) {

            $referencia = (string)$cell['r'];

            preg_match(
                '/([A-Z]+)[0-9]+/',
                $referencia,
                $match
            );

            $coluna = $match[1] ?? '';

            $indice = 0;

            for (
                $i = 0;
                $i < strlen($coluna);
                $i++
            ) {
                $indice =
                    $indice * 26
                    + (ord($coluna[$i]) - 64);
            }

            $indice--;

            $valor = '';

            if (isset($cell->v)) {

                $valor = (string)$cell->v;

                if ((string)$cell['t'] === 's') {

                    $valor = $sharedStrings[
                        (int)$valor
                    ] ?? '';
                }
            }

            $dados[$indice] = $valor;
        }

        if (!empty($dados)) {
            $linhas[] = $dados;
        }
    }

    $zip->close();

    return $linhas;
}

function detectarCabecalho(array $linhas): int
{
    foreach ($linhas as $indice => $linha) {

        $texto = implode(
            ' | ',
            array_map(
                fn($valor) => normalizarCabecalho(
                    (string)$valor
                ),
                $linha
            )
        );

        if (
            str_contains($texto, 'codigo makita')
            && str_contains($texto, 'descricao resumida')
        ) {
            return $indice;
        }
    }

    throw new RuntimeException(
        'Não encontrei o cabeçalho da planilha Makita.'
    );
}

function obterColuna(
    array $cabecalho,
    array $nomes
): ?int {

    foreach ($nomes as $nome) {

        $nome = normalizarCabecalho($nome);

        foreach ($cabecalho as $indice => $valor) {

            if (
                normalizarCabecalho(
                    (string)$valor
                ) === $nome
            ) {
                return $indice;
            }
        }
    }

    return null;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    try {

        $confirmarImportacao =
            ($_POST['confirmar_importacao'] ?? '') === '1';

        if (
            !isset($_FILES['arquivo'])
            || $_FILES['arquivo']['error']
                !== UPLOAD_ERR_OK
        ) {
            throw new RuntimeException(
                'Selecione um arquivo válido.'
            );
        }

        $arquivo = $_FILES['arquivo'];

        $extensao = strtolower(
            pathinfo(
                $arquivo['name'],
                PATHINFO_EXTENSION
            )
        );

        if (!in_array(
            $extensao,
            ['xlsx', 'csv'],
            true
        )) {
            throw new RuntimeException(
                'O arquivo deve ser XLSX ou CSV.'
            );
        }

        if ($arquivo['size'] > 50 * 1024 * 1024) {
            throw new RuntimeException(
                'O arquivo ultrapassa o limite de 50 MB.'
            );
        }

        /*
         * A planilha é lida diretamente do arquivo temporário do PHP.
         * Ela não é copiada para o diretório público nem permanece no site.
         */
        $arquivoTemporario = $arquivo['tmp_name'];

        if (!is_uploaded_file($arquivoTemporario)) {
            throw new RuntimeException('Upload temporário inválido.');
        }

        if ($extensao === 'xlsx') {

            $linhas = extrairXlsx($arquivoTemporario);

        } else {

            $linhas = lerCsv($arquivoTemporario);

            if (
                count($linhas) > 0
                && count($linhas[0]) <= 2
            ) {
                $linhas = lerCsvVirgula($arquivoTemporario);
            }
        }

        $indiceCabecalho =
            detectarCabecalho($linhas);

        $cabecalho =
            $linhas[$indiceCabecalho];

        $colunas = [

            'codigo' => obterColuna(
                $cabecalho,
                [
                    'Código Makita',
                    'Codigo Makita'
                ]
            ),

            'nome' => obterColuna(
                $cabecalho,
                [
                    'descrição resumida',
                    'descricao resumida'
                ]
            ),

            'aplicacao' => obterColuna(
                $cabecalho,
                [
                    'aplicação',
                    'aplicacao'
                ]
            ),

            'alternativo' => obterColuna(
                $cabecalho,
                [
                    'alternativo'
                ]
            ),

            'linha' => obterColuna(
                $cabecalho,
                [
                    'linha'
                ]
            ),

            'peso' => obterColuna(
                $cabecalho,
                [
                    'peso'
                ]
            ),

            'ncm' => obterColuna(
                $cabecalho,
                [
                    'ncm'
                ]
            ),

            'preco_vista' => obterColuna(
                $cabecalho,
                [
                    'à vista c/ 2.5% desc (com impostos)',
                    'a vista c/ 2.5% desc (com impostos)'
                ]
            ),

            'preco_parcelado' => obterColuna(
                $cabecalho,
                [
                    'à prazo (com impostos)',
                    'a prazo (com impostos)'
                ]
            )
        ];

        if ($colunas['codigo'] === null) {
            throw new RuntimeException(
                'A coluna Código Makita não foi encontrada.'
            );
        }

        if ($colunas['nome'] === null) {
            throw new RuntimeException(
                'A coluna descrição resumida não foi encontrada.'
            );
        }

        $totalLinhas =
            count($linhas)
            - $indiceCabecalho
            - 1;

        if (!$confirmarImportacao) {
            $amostra = [];

            for ($i = $indiceCabecalho + 1; $i < count($linhas) && count($amostra) < 8; $i++) {
                $linha = $linhas[$i];
                $codigo = trim((string)($linha[$colunas['codigo']] ?? ''));
                $nome = trim((string)($linha[$colunas['nome']] ?? ''));

                if ($codigo !== '' && $nome !== '') {
                    $amostra[] = [
                        'codigo' => $codigo,
                        'nome' => $nome,
                        'preco' => $colunas['preco_vista'] !== null
                            ? numeroMakita($linha[$colunas['preco_vista']] ?? null)
                            : null
                    ];
                }
            }

            $preview = [
                'arquivo' => $arquivo['name'],
                'total_linhas' => max(0, $totalLinhas),
                'amostra' => $amostra
            ];

            $mensagem = 'Pré-visualização concluída. Confira a amostra antes de confirmar.';
        } else {

        $importados = 0;
        $atualizados = 0;
        $ignorados = 0;

        $pdo->beginTransaction();

        for (
            $i = $indiceCabecalho + 1;
            $i < count($linhas);
            $i++
        ) {

            $linha = $linhas[$i];

            $codigo = trim(
                (string)($linha[
                    $colunas['codigo']
                ] ?? '')
            );

            $nome = trim(
                (string)($linha[
                    $colunas['nome']
                ] ?? '')
            );

            if (
                $codigo === ''
                || $nome === ''
            ) {
                $ignorados++;
                continue;
            }

            $aplicacao =
                $colunas['aplicacao'] !== null
                ? trim(
                    (string)($linha[
                        $colunas['aplicacao']
                    ] ?? '')
                )
                : null;

            $alternativo =
                $colunas['alternativo'] !== null
                ? trim(
                    (string)($linha[
                        $colunas['alternativo']
                    ] ?? '')
                )
                : null;

            $linhaProduto =
                $colunas['linha'] !== null
                ? trim(
                    (string)($linha[
                        $colunas['linha']
                    ] ?? '')
                )
                : null;

            $peso =
                $colunas['peso'] !== null
                ? numeroMakita(
                    $linha[
                        $colunas['peso']
                    ] ?? null
                )
                : null;

            $ncm =
                $colunas['ncm'] !== null
                ? trim(
                    (string)($linha[
                        $colunas['ncm']
                    ] ?? '')
                )
                : null;

            $precoVista =
                $colunas['preco_vista'] !== null
                ? numeroMakita(
                    $linha[
                        $colunas['preco_vista']
                    ] ?? null
                )
                : null;

            $precoParcelado =
                $colunas['preco_parcelado'] !== null
                ? numeroMakita(
                    $linha[
                        $colunas['preco_parcelado']
                    ] ?? null
                )
                : null;

            $stmt = $pdo->prepare("
                SELECT id
                FROM produtos
                WHERE codigo_makita = :codigo
                LIMIT 1
            ");

            $stmt->execute([
                ':codigo' => $codigo
            ]);

            $existente = $stmt->fetch();

            if ($existente) {

                $stmt = $pdo->prepare("
                    UPDATE produtos
                    SET
                        sku = :sku,
                        nome = :nome,
                        aplicacao = :aplicacao,
                        linha = :linha,
                        codigo_alternativo = :alternativo,
                        peso_kg = :peso,
                        ncm = :ncm,
                        preco_vista = :preco_vista,
                        preco_parcelado = :preco_parcelado
                    WHERE id = :id
                ");

                $stmt->execute([
                    ':sku' => $codigo,
                    ':nome' => $nome,
                    ':aplicacao' => $aplicacao ?: null,
                    ':linha' => $linhaProduto ?: null,
                    ':alternativo' => $alternativo ?: null,
                    ':peso' => $peso,
                    ':ncm' => $ncm ?: null,
                    ':preco_vista' => $precoVista,
                    ':preco_parcelado' => $precoParcelado,
                    ':id' => $existente['id']
                ]);

                $atualizados++;

            } else {

                $stmt = $pdo->prepare("
                    INSERT INTO produtos (
                        sku,
                        codigo_makita,
                        nome,
                        aplicacao,
                        linha,
                        codigo_alternativo,
                        peso_kg,
                        ncm,
                        preco_vista,
                        preco_parcelado,
                        ativo
                    ) VALUES (
                        :sku,
                        :codigo_makita,
                        :nome,
                        :aplicacao,
                        :linha,
                        :alternativo,
                        :peso,
                        :ncm,
                        :preco_vista,
                        :preco_parcelado,
                        1
                    )
                ");

                $stmt->execute([
                    ':sku' => $codigo,
                    ':codigo_makita' => $codigo,
                    ':nome' => $nome,
                    ':aplicacao' => $aplicacao ?: null,
                    ':linha' => $linhaProduto ?: null,
                    ':alternativo' => $alternativo ?: null,
                    ':peso' => $peso,
                    ':ncm' => $ncm ?: null,
                    ':preco_vista' => $precoVista,
                    ':preco_parcelado' => $precoParcelado
                ]);

                $importados++;
            }
        }

        $pdo->commit();

        $mensagem =
            'Importação concluída. '
            . 'Novos: ' . $importados
            . ' | Atualizados: ' . $atualizados
            . ' | Ignorados: ' . $ignorados
            . ' | Total de linhas: ' . $totalLinhas;

        }

    } catch (Throwable $e) {

        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }

        $erro = $e->getMessage();
    }
}

require_once __DIR__ . '/../includes/header.php';
require_once __DIR__ . '/../includes/sidebar.php';
?>

<main class="admin-main">

    <div class="page-header">

        <div>
            <h1>Importação Makita</h1>

            <p>
                Importe produtos e preços através de XLSX ou CSV.
            </p>
        </div>

    </div>

    <?php if ($mensagem): ?>

        <div class="alert alert-success">
            <?= htmlspecialchars($mensagem) ?>
        </div>

    <?php endif; ?>

    <?php if ($erro): ?>

        <div class="alert alert-error">
            <?= htmlspecialchars($erro) ?>
        </div>

    <?php endif; ?>

    <?php if ($preview): ?>

        <section class="panel import-preview">
            <div class="panel-header">
                <div>
                    <h2>Pré-visualização: <?= htmlspecialchars($preview['arquivo'], ENT_QUOTES, 'UTF-8') ?></h2>
                    <p><?= (int) $preview['total_linhas'] ?> linhas encontradas. A planilha não foi salva nem importada.</p>
                </div>
            </div>

            <div class="table-wrapper">
                <table class="admin-table">
                    <thead><tr><th>Código Makita</th><th>Produto</th><th>Preço à vista</th></tr></thead>
                    <tbody>
                        <?php foreach ($preview['amostra'] as $item): ?>
                            <tr>
                                <td><?= htmlspecialchars($item['codigo'], ENT_QUOTES, 'UTF-8') ?></td>
                                <td><?= htmlspecialchars($item['nome'], ENT_QUOTES, 'UTF-8') ?></td>
                                <td><?= $item['preco'] !== null ? 'R$ ' . number_format($item['preco'], 2, ',', '.') : '—' ?></td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        </section>

    <?php endif; ?>

    <section class="panel">

        <div class="panel-header">

            <div>
                <h2>Enviar planilha</h2>

                <p>
                    Use o arquivo oficial de produtos da Makita.
                </p>
            </div>

        </div>

        <form
            method="POST"
            enctype="multipart/form-data"
            class="admin-form"
        >

            <?php if ($preview): ?>
                <input type="hidden" name="confirmar_importacao" value="1">
            <?php endif; ?>

            <div class="form-group">

                <label for="arquivo">
                    Arquivo XLSX ou CSV
                </label>

                <input
                    type="file"
                    id="arquivo"
                    name="arquivo"
                    accept=".xlsx,.csv"
                    required
                >

                <small>
                    A planilha deve conter as colunas
                    Código Makita e descrição resumida.
                </small>

                <?php if ($preview): ?>
                    <small class="form-help">
                        Por segurança, selecione novamente o mesmo arquivo
                        para confirmar a importação. Nenhuma cópia foi salva.
                    </small>
                <?php endif; ?>

            </div>

            <div class="form-actions">

                <button
                    type="submit"
                    class="btn btn-primary"
                >
                    <?= $preview ? 'Confirmar importação' : 'Pré-visualizar planilha' ?>
                </button>

            </div>

        </form>

    </section>

    <section class="panel">

        <div class="panel-header">

            <h2>Como funciona</h2>

        </div>

        <div class="info-list">

            <p>
                <strong>1.</strong>
                Você envia a planilha.
            </p>

            <p>
                <strong>2.</strong>
                O sistema encontra automaticamente o cabeçalho.
            </p>

            <p>
                <strong>3.</strong>
                Produtos existentes são atualizados pelo Código Makita.
            </p>

            <p>
                <strong>4.</strong>
                Produtos novos são cadastrados.
            </p>

            <p>
                <strong>5.</strong>
                Preços à vista e à prazo são atualizados.
            </p>

            <p>
                <strong>6.</strong>
                Os produtos ficam disponíveis sob encomenda; a importação
                não cria nem altera registros de estoque.
            </p>

        </div>

    </section>

</main>
