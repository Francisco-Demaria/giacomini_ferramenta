<?php

header('Content-Type: application/json; charset=utf-8');

$produtos = [
    [
        "sku" => "BOS001",
        "nome" => "Furadeira Bosch",
        "marca" => "Bosch",
        "categoria" => "Ferramentas",
        "subcategoria" => "Furadeiras",
        "precoVista" => 449.90,
        "precoParcelado" => 499.90,
        "imagem" => "img/bos001.webp",
        "estoque" => 1,
        "descricao" => "Furadeira Bosch para uso profissional e doméstico.",
        "pesoKg" => 2.1,
        "dimensoes" => "25x10x22"
    ]
];

echo json_encode(
    $produtos,
    JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT
);