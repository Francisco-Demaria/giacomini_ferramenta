<?php

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

require_once __DIR__ . '/../../config/banco.php';

function autenticarAdmin(string $email, string $senha): bool
{
    global $pdo;

    $sql = "
        SELECT
            id,
            nome,
            email,
            senha_hash,
            nivel,
            ativo
        FROM usuarios
        WHERE email = :email
        LIMIT 1
    ";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        ':email' => trim($email)
    ]);

    $usuario = $stmt->fetch();

    if (!$usuario) {
        return false;
    }

    if ((int) $usuario['ativo'] !== 1) {
        return false;
    }

    if (!password_verify($senha, $usuario['senha_hash'])) {
        return false;
    }

    session_regenerate_id(true);

    $_SESSION['admin_id'] = $usuario['id'];
    $_SESSION['admin_nome'] = $usuario['nome'];
    $_SESSION['admin_email'] = $usuario['email'];
    $_SESSION['admin_nivel'] = $usuario['nivel'];

    $stmt = $pdo->prepare("
        UPDATE usuarios
        SET ultimo_login = NOW()
        WHERE id = :id
    ");

    $stmt->execute([
        ':id' => $usuario['id']
    ]);

    return true;
}