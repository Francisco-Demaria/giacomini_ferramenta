<?php

session_start();

if (!isset($_SESSION['admin_id'])) {
    header('Location: ../login.php');
    exit;
}

$titulo = 'Configurações';
$descricao = 'Gerencie as configurações gerais da administração.';
$paginaAtual = 'Configurações';

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
            <a href="imagens.php">Imagens</a>
            <a href="configuracoes.php" class="ativo">
                Configurações
            </a>

        </nav>

    </aside>

    <main class="admin-main">

        <header class="admin-header">

            <div>
                <h1>Configurações</h1>
                <p>Configurações gerais da administração.</p>
            </div>

        </header>

        <section class="admin-content">

            <div class="card">

                <div class="card-header">
                    <div>
                        <h2>Informações da loja</h2>
                        <p>Configurações básicas.</p>
                    </div>
                </div>

                <div class="form-grid">

                    <div class="campo">
                        <label>Nome da loja</label>
                        <input
                            type="text"
                            value="Giacomini Ferramentas"
                        >
                    </div>

                    <div class="campo">
                        <label>E-mail</label>
                        <input
                            type="email"
                            value="contato@giacominiferramentas.com"
                        >
                    </div>

                    <div class="campo">
                        <label>Telefone</label>
                        <input
                            type="text"
                            value="(47) 00000-0000"
                        >
                    </div>

                    <div class="campo">
                        <label>Moeda</label>

                        <select>
                            <option>Real brasileiro (R$)</option>
                        </select>

                    </div>

                </div>

                <div class="form-acoes">

                    <button
                        class="btn-principal"
                        type="button"
                    >
                        Salvar alterações
                    </button>

                </div>

            </div>

            <div class="card">

                <div class="card-header">
                    <div>
                        <h2>Preferências</h2>
                        <p>Comportamento do painel administrativo.</p>
                    </div>
                </div>

                <div class="configuracao-item">

                    <div>
                        <strong>Notificações de estoque baixo</strong>
                        <p>
                            Avisar quando produtos atingirem
                            o estoque mínimo.
                        </p>
                    </div>

                    <input type="checkbox" checked>

                </div>

                <div class="configuracao-item">

                    <div>
                        <strong>Bloquear produtos sem estoque</strong>
                        <p>
                            Impedir que produtos sem estoque
                            sejam vendidos.
                        </p>
                    </div>

                    <input type="checkbox" checked>

                </div>

            </div>

        </section>

    </main>

</div>

</body>
</html>