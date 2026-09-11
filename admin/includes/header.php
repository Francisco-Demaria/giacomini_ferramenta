<?php

if (!isset($_SESSION['admin_id'])) {
    header('Location: /admin/login.php');
    exit;
}

$nomeAdmin = $_SESSION['admin_nome'] ?? 'Administrador';

?>

<header class="admin-header">

    <div class="header-title">

        <h2>
            <?= htmlspecialchars(
                $titulo ?? 'Admin',
                ENT_QUOTES,
                'UTF-8'
            ) ?>
        </h2>

        <p>
            <?= htmlspecialchars(
                $descricao ?? '',
                ENT_QUOTES,
                'UTF-8'
            ) ?>
        </p>

    </div>


    <div class="header-right">

        <div class="header-user">

            <div class="header-avatar">
                <?= strtoupper(
                    substr($nomeAdmin, 0, 1)
                ) ?>
            </div>

            <div class="header-user-info">

                <strong>
                    <?= htmlspecialchars(
                        $nomeAdmin,
                        ENT_QUOTES,
                        'UTF-8'
                    ) ?>
                </strong>

                <span>
                    Administrador
                </span>

            </div>

        </div>

        <a
            href="/admin/logout.php"
            class="btn-secundario"
        >
            Sair
        </a>

    </div>

</header>