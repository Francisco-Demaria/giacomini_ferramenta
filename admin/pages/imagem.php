<?php

session_start();

if (!isset($_SESSION['admin_id'])) {
    header('Location: ../login.php');
    exit;
}

$titulo = 'Imagens';
$descricao = 'Gerencie as imagens dos produtos.';
$paginaAtual = 'Imagens';

?>

<!DOCTYPE html>
<html lang="pt-BR">

<head>

    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <title><?= $titulo ?> — Giacomini Admin</title>

    <link rel="stylesheet" href="../css/admin.css">

</head>

<body>

<div class="admin-layout">

    <?php require __DIR__ . '/../includes/sidebar.php'; ?>

    <main class="admin-main">

        <?php require __DIR__ . '/../includes/header.php'; ?>

        <!-- CONTEÚDO DA PÁGINA -->

    </main>

</div>

</body>

</html>

<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title><?= $titulo ?> — Giacomini Admin</title>

    <link rel="stylesheet" href="../css/admin.css">
</head>

<body>

<div class="admin-layout">

    <aside class="sidebar">

        <div class="sidebar-logo">
            <h2>Giacomini</h2>
            <span>Admin</span>
        </div>

        <nav class="sidebar-nav">

            <a href="../index.php">Dashboard</a>
            <a href="produtos.php">Produtos</a>
            <a href="estoque.php">Estoque</a>
            <a href="pedidos.php">Pedidos</a>
            <a href="clientes.php">Clientes</a>
            <a href="importacao.php">Importação</a>
            <a href="imagens.php" class="ativo">Imagens</a>
            <a href="configuracoes.php">Configurações</a>

        </nav>

    </aside>

    <main class="admin-main">

        <header class="admin-header">

            <div>
                <h1>Imagens</h1>
                <p>Gerencie as imagens dos produtos.</p>
            </div>

            <button class="btn-principal" type="button">
                + Enviar imagem
            </button>

        </header>

        <section class="admin-content">

            <div class="metricas">

                <div class="metrica">
                    <span>Imagens cadastradas</span>
                    <strong>9.842</strong>
                </div>

                <div class="metrica">
                    <span>Produtos sem imagem</span>
                    <strong>1.204</strong>
                </div>

                <div class="metrica">
                    <span>Imagens no Cloudinary</span>
                    <strong>8.638</strong>
                </div>

            </div>

            <div class="card">

                <div class="card-header">

                    <div>
                        <h2>Biblioteca de imagens</h2>
                        <p>Últimas imagens adicionadas.</p>
                    </div>

                </div>

                <div class="galeria">

                    <div class="imagem-card">
                        <div class="imagem-placeholder">
                            IMG
                        </div>
                        <strong>Makita Furadeira</strong>
                        <span>MAC-1001</span>
                    </div>

                    <div class="imagem-card">
                        <div class="imagem-placeholder">
                            IMG
                        </div>
                        <strong>Makita Serra</strong>
                        <span>MAC-1002</span>
                    </div>

                    <div class="imagem-card">
                        <div class="imagem-placeholder">
                            IMG
                        </div>
                        <strong>Makita Parafusadeira</strong>
                        <span>MAC-1003</span>
                    </div>

                </div>

            </div>

        </section>

    </main>

</div>

</body>
</html>