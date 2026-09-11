<?php

session_start();

if (!isset($_SESSION['admin_id'])) {
    header('Location: ../login.php');
    exit;
}

$titulo = 'Pedidos';
$descricao = 'Gerencie os pedidos realizados na loja.';
$paginaAtual = 'Pedidos';

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
            <a href="pedidos.php" class="ativo">Pedidos</a>
            <a href="clientes.php">Clientes</a>
            <a href="importacao.php">Importação</a>
            <a href="imagens.php">Imagens</a>
            <a href="configuracoes.php">Configurações</a>

        </nav>

    </aside>

    <main class="admin-main">

        <header class="admin-header">

            <div>
                <h1>Pedidos</h1>
                <p>Gerencie os pedidos realizados na loja.</p>
            </div>

        </header>

        <section class="admin-content">

            <div class="filtros">

                <input
                    type="text"
                    placeholder="Buscar pedido..."
                >

                <select>
                    <option>Todos os status</option>
                    <option>Pendente</option>
                    <option>Pago</option>
                    <option>Enviado</option>
                    <option>Concluído</option>
                    <option>Cancelado</option>
                </select>

                <button class="btn-secundario" type="button">
                    Filtrar
                </button>

            </div>

            <div class="card">

                <div class="card-header">
                    <div>
                        <h2>Pedidos recentes</h2>
                        <p>128 pedidos encontrados</p>
                    </div>
                </div>

                <div class="tabela-container">

                    <table class="tabela">

                        <thead>
                            <tr>
                                <th>Pedido</th>
                                <th>Cliente</th>
                                <th>Data</th>
                                <th>Total</th>
                                <th>Pagamento</th>
                                <th>Status</th>
                                <th>Ação</th>
                            </tr>
                        </thead>

                        <tbody>

                            <tr>
                                <td>#000128</td>
                                <td>João Silva</td>
                                <td>29/08/2026</td>
                                <td>R$ 899,90</td>
                                <td>PIX</td>
                                <td>
                                    <span class="status ativo-status">
                                        Pago
                                    </span>
                                </td>
                                <td>
                                    <button class="acao" type="button">
                                        Ver
                                    </button>
                                </td>
                            </tr>

                            <tr>
                                <td>#000127</td>
                                <td>Maria Souza</td>
                                <td>29/08/2026</td>
                                <td>R$ 1.299,90</td>
                                <td>Cartão</td>
                                <td>
                                    <span class="status alerta-status">
                                        Pendente
                                    </span>
                                </td>
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