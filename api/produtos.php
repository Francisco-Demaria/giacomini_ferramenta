<?php

header('Content-Type: application/json; charset=utf-8');

$urlPlanilha = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSjwdcNetNoRZzXi20wyCVlMwhQf86ckoI8ZcIDui7wnvQpxUg7NIAio6HEu_CMHqyG1yT4Rcee_q6H/pub?output=csv';

$csv = @file_get_contents($urlPlanilha);

if ($csv === false) {
    http_response_code(500);

    echo json_encode([
        'erro' => 'Não foi possível acessar a planilha.'
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

$linhas = str_getcsv($csv, "\n", '"', '\\');

if (count($linhas) < 2) {
    echo json_encode([], JSON_UNESCAPED_UNICODE);
    exit;
}

$cabecalho = str_getcsv($linhas[0], ",", '"', '\\');

$produtos = [];

foreach (array_slice($linhas, 1) as $linha) {

    if (trim($linha) === '') {
        continue;
    }

    $dados = str_getcsv($linha, ",", '"', '\\');

    $produto = [];

    foreach ($cabecalho as $indice => $coluna) {

        $coluna = trim($coluna);

        if ($coluna === '') {
            continue;
        }

        $produto[$coluna] = $dados[$indice] ?? '';
    }

    $sku = trim($produto['SKU'] ?? '');

    if ($sku === '') {
        continue;
    }

    $produtos[] = [
        'sku' => $sku,
        'nome' => $produto['Nome'] ?? '',
        'marca' => $produto['Marca'] ?? '',
        'categoria' => $produto['Categoria'] ?? '',
        'subcategoria' => $produto['Subcategoria'] ?? '',
        'precoVista' => $produto['Preço à vista'] ?? '',
        'precoParcelado' => $produto['Preço Parcelado'] ?? '',
        'imagem' => $produto['Imagem'] ?? '',
        'estoque' => $produto['Estoque'] ?? '',
        'descricao' => $produto['Descrição'] ?? '',
        'pesoKg' => $produto['Peso (Kg)'] ?? '',
        'dimensoes' => $produto['CxLxA'] ?? ''
    ];
}

echo json_encode(
    $produtos,
    JSON_UNESCAPED_UNICODE |
    JSON_UNESCAPED_SLASHES |
    JSON_PRETTY_PRINT
);