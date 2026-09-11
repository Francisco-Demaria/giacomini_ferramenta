<?php

session_start();

if (!isset($_SESSION['admin_id'])) {
    header('Location: ../login.php');
    exit;
}

$titulo = 'Clientes';
$descricao = 'Visualize e gerencie os clientes da loja.';
$paginaAtual = 'Clientes';

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
            <a href="clientes.php" class="ativo">Clientes</a>
            <a href="importacao.php">Importação</a>
            <a href="imagens.php">Imagens</a>
            <a href="configuracoes.php">Configurações</a>

        </nav>

    </aside>

    <main class="admin-main">

        <header class="admin-header">

            <div>
                <h1>Clientes</h1>
                <p>Visualize e gerencie os clientes da loja.</p>
            </div>

        </header>

        <section class="admin-content">

            <div class="card">

                <div class="card-header">

                    <div>
                        <h2>Clientes cadastrados</h2>
                        <p>1.284 clientes</p>
                    </div>

                </div>

                <div class="tabela-container">

                    <table class="tabela">

                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>E-mail</th>
                                <th>Telefone</th>
                                <th>Pedidos</th>
                                <th>Cadastro</th>
                                <th>Ação</th>
                            </tr>
                        </thead>

                        <tbody>

                            <tr>
                                <td>João Silva</td>
                                <td>joao@email.com</td>
                                <td>(47) 99999-9999</td>
                                <td>4</td>
                                <td>12/08/2026</td>
                                <td>
                                    <button class="acao" type="button">
                                        Ver
                                    </button>
                                </td>
                            </tr>

                            <tr>
                                <td>Maria Souza</td>
                                <td>maria@email.com</td>
                                <td>(47) 98888-8888</td>
                                <td>2</td>
                                <td>18/08/2026</td>
                                <td>
                                    <button class="acao" type="button">
                                        Ver
                                    </button>
                                </td>
                            </tr>

                        </tbody>

                    </table>

                </div>

            </div>

        </section>

    </main>

</div>

</body>
</html>