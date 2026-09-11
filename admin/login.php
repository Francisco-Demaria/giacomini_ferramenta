<?php

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

if (!empty($_SESSION['admin_id'])) {
    header('Location: /admin/index.php');
    exit;
}

require_once __DIR__ . '/includes/auth.php';

$erro = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    $email = $_POST['email'] ?? '';
    $senha = $_POST['senha'] ?? '';

    if ($email === '' || $senha === '') {

        $erro = 'Preencha todos os campos.';

    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {

        $erro = 'Digite um e-mail válido.';

    } elseif (!autenticarAdmin($email, $senha)) {

        $erro = 'E-mail ou senha incorretos.';

    } else {

        header('Location: /admin/index.php');
        exit;
    }
}

?>

<!DOCTYPE html>
<html lang="pt-BR">

<head>

    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <title>Login | Giacomini Admin</title>

    <link
        rel="stylesheet"
        href="/admin/css/admin.css"
    >

</head>

<body class="login-page">

    <main class="login-container">

        <section class="login-card">

            <div class="login-logo">
                <strong>Giacomini</strong>
                <span>Ferramentas</span>
            </div>

            <div class="login-header">

                <h1>Área administrativa</h1>

                <p>
                    Entre para acessar o painel.
                </p>

            </div>

            <?php if ($erro): ?>

                <div class="login-error">
                    <?= htmlspecialchars(
                        $erro,
                        ENT_QUOTES,
                        'UTF-8'
                    ) ?>
                </div>

            <?php endif; ?>

            <form method="POST">

                <div class="form-group">

                    <label for="email">
                        E-mail
                    </label>

                    <input
                        type="email"
                        id="email"
                        name="email"
                        autocomplete="username"
                        required
                    >

                </div>

                <div class="form-group">

                    <label for="senha">
                        Senha
                    </label>

                    <input
                        type="password"
                        id="senha"
                        name="senha"
                        autocomplete="current-password"
                        required
                    >

                </div>

                <button
                    type="submit"
                    class="btn btn-primary btn-full"
                >
                    Entrar
                </button>

            </form>

        </section>

    </main>

</body>

</html>