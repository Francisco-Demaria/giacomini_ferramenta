<?php

require_once __DIR__ . '/includes/proteger.php';
require_once __DIR__ . '/../config/banco.php';

$titulo = 'Dashboard';
$paginaAtual = 'Dashboard';
$descricao = 'Visão geral da operação da Giacomini Ferramentas.';

/*
|--------------------------------------------------------------------------
| Produtos
|--------------------------------------------------------------------------
*/

$stmt = $pdo->query("
    SELECT COUNT(*) AS total
    FROM produtos
");

$totalProdutos = (int) $stmt->fetch()['total'];

$stmt = $pdo->query("
    SELECT COUNT(*) AS total
    FROM produtos
    WHERE ativo = 1
");

$produtosAtivos = (int) $stmt->fetch()['total'];

/*
|--------------------------------------------------------------------------
| Estoque baixo
|--------------------------------------------------------------------------
*/

$stmt = $pdo->query("
    SELECT COUNT(*) AS total
    FROM estoque
    WHERE quantidade <= estoque_minimo
");

$estoqueBaixo = (int) $stmt->fetch()['total'];

/*
|--------------------------------------------------------------------------
| Importações
|--------------------------------------------------------------------------
*/

$stmt = $pdo->query("
    SELECT COUNT(*) AS total
    FROM importacoes
");

$totalImportacoes = (int) $stmt->fetch()['total'];

/*
|--------------------------------------------------------------------------
| Últimas importações
|--------------------------------------------------------------------------
*/

$stmt = $pdo->query("
    SELECT
        nome_arquivo,
        formato,
        status,
        total_linhas,
        linhas_importadas,
        linhas_atualizadas,
        linhas_com_erro,
        iniciado_em
    FROM importacoes
    ORDER BY id DESC
    LIMIT 5
");

$importacoes = $stmt->fetchAll();

?>

<!DOCTYPE html>

<html lang="pt-BR">

<head>

    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <title>
        <?= htmlspecialchars($titulo, ENT_QUOTES, 'UTF-8') ?>
        | Giacomini Admin
    </title>

    <link
        rel="stylesheet"
        href="/admin/css/admin.css"
    >

</head>

<body>

<div class="admin-layout">

    <?php require __DIR__ . '/includes/sidebar.php'; ?>

    <main class="admin-main">

        <?php require __DIR__ . '/includes/header.php'; ?>

        <section class="admin-content">

            <div class="stats-grid">

                <article class="stat-card">

                    <div class="stat-card-top">

                        <span class="stat-card-label">
                            Produtos
                        </span>

                        <span class="stat-icon">
                            📦
                        </span>

                    </div>

                    <strong class="stat-value">
                        <?= number_format(
                            $totalProdutos,
                            0,
                            ',',
                            '.'
                        ) ?>
                    </strong>

                    <span class="stat-description">
                        Produtos cadastrados
                    </span>

                </article>


                <article class="stat-card">

                    <div class="stat-card-top">

                        <span class="stat-card-label">
                            Produtos ativos
                        </span>

                        <span class="stat-icon">
                            ✓
                        </span>

                    </div>

                    <strong class="stat-value">
                        <?= number_format(
                            $produtosAtivos,
                            0,
                            ',',
                            '.'
                        ) ?>
                    </strong>

                    <span class="stat-description">
                        Disponíveis no catálogo
                    </span>

                </article>


                <article class="stat-card">

                    <div class="stat-card-top">

                        <span class="stat-card-label">
                            Estoque baixo
                        </span>

                        <span class="stat-icon">
                            ⚠
                        </span>

                    </div>

                    <strong class="stat-value">
                        <?= number_format(
                            $estoqueBaixo,
                            0,
                            ',',
                            '.'
                        ) ?>
                    </strong>

                    <span class="stat-description">
                        Precisam de atenção
                    </span>

                </article>


                <article class="stat-card">

                    <div class="stat-card-top">

                        <span class="stat-card-label">
                            Importações
                        </span>

                        <span class="stat-icon">
                            ↻
                        </span>

                    </div>

                    <strong class="stat-value">
                        <?= number_format(
                            $totalImportacoes,
                            0,
                            ',',
                            '.'
                        ) ?>
                    </strong>

                    <span class="stat-description">
                        Importações registradas
                    </span>

                </article>

            </div>


            <div class="admin-panel">

                <div class="panel-header">

                    <div>

                        <h2>
                            Últimas importações
                        </h2>

                        <p>
                            Histórico das atualizações do catálogo.
                        </p>

                    </div>

                    <a
                        href="/admin/pages/importacao.php"
                        class="btn btn-secondary"
                    >
                        Ver importações
                    </a>

                </div>


                <div class="table-wrapper">

                    <table class="admin-table">

                        <thead>

                            <tr>

                                <th>Arquivo</th>
                                <th>Formato</th>
                                <th>Status</th>
                                <th>Linhas</th>
                                <th>Importadas</th>
                                <th>Atualizadas</th>
                                <th>Erros</th>

                            </tr>

                        </thead>

                        <tbody>

                        <?php if (!$importacoes): ?>

                            <tr>

                                <td colspan="7">
                                    Nenhuma importação registrada.
                                </td>

                            </tr>

                        <?php else: ?>

                            <?php foreach ($importacoes as $importacao): ?>

                                <tr>

                                    <td>
                                        <?= htmlspecialchars(
                                            $importacao['nome_arquivo'],
                                            ENT_QUOTES,
                                            'UTF-8'
                                        ) ?>
                                    </td>

                                    <td>
                                        <?= strtoupper(
                                            htmlspecialchars(
                                                $importacao['formato'],
                                                ENT_QUOTES,
                                                'UTF-8'
                                            )
                                        ) ?>
                                    </td>

                                    <td>

                                        <span class="badge">
                                            <?= htmlspecialchars(
                                                $importacao['status'],
                                                ENT_QUOTES,
                                                'UTF-8'
                                            ) ?>
                                        </span>

                                    </td>

                                    <td>
                                        <?= number_format(
                                            $importacao['total_linhas'],
                                            0,
                                            ',',
                                            '.'
                                        ) ?>
                                    </td>

                                    <td>
                                        <?= number_format(
                                            $importacao['linhas_importadas'],
                                            0,
                                            ',',
                                            '.'
                                        ) ?>
                                    </td>

                                    <td>
                                        <?= number_format(
                                            $importacao['linhas_atualizadas'],
                                            0,
                                            ',',
                                            '.'
                                        ) ?>
                                    </td>

                                    <td>
                                        <?= number_format(
                                            $importacao['linhas_com_erro'],
                                            0,
                                            ',',
                                            '.'
                                        ) ?>
                                    </td>

                                </tr>

                            <?php endforeach; ?>

                        <?php endif; ?>

                        </tbody>

                    </table>

                </div>

            </div>

        </section>

    </main>

</div>

</body>

</html>