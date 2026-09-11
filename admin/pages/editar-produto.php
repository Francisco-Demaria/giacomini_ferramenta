<?php

require_once __DIR__ . '/../includes/proteger.php';
require_once __DIR__ . '/../../config/banco.php';

$id = (int) ($_GET['id'] ?? 0);

if ($id <= 0) {
    header('Location: /admin/pages/produtos.php');
    exit;
}

$titulo = 'Editar produto';
$paginaAtual = 'Produtos';
$descricao = 'Edite as informações do produto.';

$erro = '';
$sucesso = isset($_GET['criado']);


/*
|--------------------------------------------------------------------------
| Produto
|--------------------------------------------------------------------------
*/

$stmt = $pdo->prepare("
    SELECT
        p.*,
        COALESCE(e.quantidade, 0) AS estoque_quantidade,
        COALESCE(e.estoque_minimo, 0) AS estoque_minimo,
        e.estoque_maximo

    FROM produtos p

    LEFT JOIN estoque e
        ON e.produto_id = p.id

    WHERE p.id = :id

    LIMIT 1
");

$stmt->execute([
    ':id' => $id
]);

$produto = $stmt->fetch();

if (!$produto) {
    header('Location: /admin/pages/produtos.php');
    exit;
}


/*
|--------------------------------------------------------------------------
| Categorias
|--------------------------------------------------------------------------
*/

$stmt = $pdo->query("
    SELECT
        id,
        nome

    FROM categorias

    WHERE ativo = 1

    ORDER BY nome ASC
");

$categorias = $stmt->fetchAll();


/*
|--------------------------------------------------------------------------
| Subcategorias
|--------------------------------------------------------------------------
*/

$stmt = $pdo->prepare("
    SELECT
        id,
        nome

    FROM subcategorias

    WHERE
        categoria_id = :categoria_id
        AND ativo = 1

    ORDER BY nome ASC
");

$stmt->execute([
    ':categoria_id' =>
        (int) $produto['categoria_id']
]);

$subcategorias = $stmt->fetchAll();


/*
|--------------------------------------------------------------------------
| Atualização
|--------------------------------------------------------------------------
*/

if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    $sku = trim($_POST['sku'] ?? '');
    $codigoMakita = trim($_POST['codigo_makita'] ?? '');
    $nome = trim($_POST['nome'] ?? '');
    $descricaoProduto = trim($_POST['descricao'] ?? '');
    $marca = trim($_POST['marca'] ?? '');
    $categoriaId = (int) ($_POST['categoria_id'] ?? 0);
    $subcategoriaId = (int) ($_POST['subcategoria_id'] ?? 0);
    $aplicacao = trim($_POST['aplicacao'] ?? '');
    $linha = trim($_POST['linha'] ?? '');
    $codigoAlternativo = trim($_POST['codigo_alternativo'] ?? '');
    $pesoKgTexto = trim($_POST['peso_kg'] ?? '');
    $pesoKg =
        $pesoKgTexto !== ''
            ? (float) $pesoKgTexto
            : null;
    $ncm = trim($_POST['ncm'] ?? '');

    $quantidade = max(
        0,
        (int) ($_POST['estoque_quantidade'] ?? 0)
    );

    $estoqueMinimo = max(
        0,
        (int) ($_POST['estoque_minimo'] ?? 0)
    );

    $estoqueMaximoTexto =
        trim($_POST['estoque_maximo'] ?? '');

    $estoqueMaximo =
        $estoqueMaximoTexto !== ''
            ? max(0, (int) $estoqueMaximoTexto)
            : null;

    $ativo =
        isset($_POST['ativo'])
            ? 1
            : 0;


    if ($sku === '') {

        $erro = 'O SKU é obrigatório.';

    } elseif ($nome === '') {

        $erro = 'O nome do produto é obrigatório.';

    } else {

        try {

            $pdo->beginTransaction();


            /*
            |--------------------------------------------------------------------------
            | Produto
            |--------------------------------------------------------------------------
            */

            $stmt = $pdo->prepare("
                UPDATE produtos

                SET
                    sku = :sku,
                    codigo_makita = :codigo_makita,
                    nome = :nome,
                    descricao = :descricao,
                    marca = :marca,
                    categoria_id = :categoria_id,
                    subcategoria_id = :subcategoria_id,
                    aplicacao = :aplicacao,
                    linha = :linha,
                    codigo_alternativo = :codigo_alternativo,
                    peso_kg = :peso_kg,
                    ncm = :ncm,
                    ativo = :ativo

                WHERE id = :id
            ");

            $stmt->execute([
                ':sku' => $sku,
                ':codigo_makita' =>
                    $codigoMakita !== ''
                        ? $codigoMakita
                        : null,
                ':nome' => $nome,
                ':descricao' =>
                    $descricaoProduto !== ''
                        ? $descricaoProduto
                        : null,
                ':marca' =>
                    $marca !== ''
                        ? $marca
                        : null,
                ':categoria_id' =>
                    $categoriaId > 0
                        ? $categoriaId
                        : null,
                ':subcategoria_id' =>
                    $subcategoriaId > 0
                        ? $subcategoriaId
                        : null,
                ':aplicacao' =>
                    $aplicacao !== ''
                        ? $aplicacao
                        : null,
                ':linha' =>
                    $linha !== ''
                        ? $linha
                        : null,
                ':codigo_alternativo' =>
                    $codigoAlternativo !== ''
                        ? $codigoAlternativo
                        : null,
                ':peso_kg' => $pesoKg,
                ':ncm' =>
                    $ncm !== ''
                        ? $ncm
                        : null,
                ':ativo' => $ativo,
                ':id' => $id
            ]);


            /*
            |--------------------------------------------------------------------------
            | Estoque
            |--------------------------------------------------------------------------
            */

            $stmt = $pdo->prepare("
                INSERT INTO estoque (
                    produto_id,
                    quantidade,
                    estoque_minimo,
                    estoque_maximo
                )

                VALUES (
                    :produto_id,
                    :quantidade,
                    :estoque_minimo,
                    :estoque_maximo
                )

                ON DUPLICATE KEY UPDATE

                    quantidade = VALUES(quantidade),
                    estoque_minimo = VALUES(estoque_minimo),
                    estoque_maximo = VALUES(estoque_maximo)
            ");

            $stmt->execute([
                ':produto_id' => $id,
                ':quantidade' => $quantidade,
                ':estoque_minimo' => $estoqueMinimo,
                ':estoque_maximo' => $estoqueMaximo
            ]);


            $pdo->commit();


            header(
                'Location: /admin/pages/editar-produto.php?id='
                . $id
                . '&salvo=1'
            );

            exit;

        } catch (Throwable $e) {

            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }

            if (
                str_contains(
                    strtolower($e->getMessage()),
                    'duplicate'
                )
            ) {

                $erro =
                    'Esse SKU já está sendo usado por outro produto.';

            } else {

                $erro =
                    'Não foi possível atualizar o produto.';
            }
        }
    }
}


/*
|--------------------------------------------------------------------------
| Recarregar produto após POST
|--------------------------------------------------------------------------
*/

$stmt = $pdo->prepare("
    SELECT
        p.*,
        COALESCE(e.quantidade, 0) AS estoque_quantidade,
        COALESCE(e.estoque_minimo, 0) AS estoque_minimo,
        e.estoque_maximo

    FROM produtos p

    LEFT JOIN estoque e
        ON e.produto_id = p.id

    WHERE p.id = :id

    LIMIT 1
");

$stmt->execute([
    ':id' => $id
]);

$produto = $stmt->fetch();

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
        Editar produto | Giacomini Admin
    </title>

    <link
        rel="stylesheet"
        href="/admin/css/admin.css"
    >

</head>

<body>

<div class="admin-layout">

    <?php require __DIR__ . '/../includes/sidebar.php'; ?>

    <main class="admin-main">

        <?php require __DIR__ . '/../includes/header.php'; ?>

        <section class="admin-content">

            <?php if ($sucesso || isset($_GET['salvo'])): ?>

                <div class="login-error"
                     style="
                        background:#eaf7ee;
                        border-color:#c7e8d0;
                        color:#16833a;
                     ">

                    Produto salvo com sucesso.

                </div>

            <?php endif; ?>


            <?php if ($erro): ?>

                <div class="login-error">

                    <?= htmlspecialchars(
                        $erro,
                        ENT_QUOTES,
                        'UTF-8'
                    ) ?>

                </div>

            <?php endif; ?>


            <div class="admin-panel">

                <div class="panel-header">

                    <div>

                        <h2>
                            <?= htmlspecialchars(
                                $produto['nome'],
                                ENT_QUOTES,
                                'UTF-8'
                            ) ?>
                        </h2>

                        <p>
                            ID:
                            <?= (int) $produto['id'] ?>
                        </p>

                    </div>

                    <span class="badge <?= (int) $produto['ativo'] === 1
                        ? 'badge-success'
                        : 'badge-danger'
                    ?>">
                        <?= (int) $produto['ativo'] === 1
                            ? 'Ativo'
                            : 'Inativo'
                        ?>
                    </span>

                </div>


                <form
                    method="POST"
                    class="product-form"
                >

                    <div class="form-grid">

                        <div class="form-group">

                            <label for="sku">
                                SKU *
                            </label>

                            <input
                                type="text"
                                id="sku"
                                name="sku"
                                maxlength="80"
                                required
                                value="<?= htmlspecialchars(
                                    $produto['sku'],
                                    ENT_QUOTES,
                                    'UTF-8'
                                ) ?>"
                            >

                        </div>


                        <div class="form-group">

                            <label for="codigo_makita">
                                Código Makita
                            </label>

                            <input
                                type="text"
                                id="codigo_makita"
                                name="codigo_makita"
                                maxlength="80"
                                value="<?= htmlspecialchars(
                                    $produto['codigo_makita'] ?? '',
                                    ENT_QUOTES,
                                    'UTF-8'
                                ) ?>"
                            >

                        </div>


                        <div class="form-group full">

                            <label for="nome">
                                Nome *
                            </label>

                            <input
                                type="text"
                                id="nome"
                                name="nome"
                                maxlength="255"
                                required
                                value="<?= htmlspecialchars(
                                    $produto['nome'],
                                    ENT_QUOTES,
                                    'UTF-8'
                                ) ?>"
                            >

                        </div>


                        <div class="form-group">

                            <label for="marca">
                                Marca
                            </label>

                            <input
                                type="text"
                                id="marca"
                                name="marca"
                                maxlength="100"
                                value="<?= htmlspecialchars(
                                    $produto['marca'] ?? '',
                                    ENT_QUOTES,
                                    'UTF-8'
                                ) ?>"
                            >

                        </div>


                        <div class="form-group">

                            <label for="linha">
                                Linha
                            </label>

                            <input
                                type="text"
                                id="linha"
                                name="linha"
                                maxlength="120"
                                value="<?= htmlspecialchars(
                                    $produto['linha'] ?? '',
                                    ENT_QUOTES,
                                    'UTF-8'
                                ) ?>"
                            >

                        </div>


                        <div class="form-group">

                            <label for="categoria_id">
                                Categoria
                            </label>

                            <select
                                id="categoria_id"
                                name="categoria_id"
                            >

                                <option value="">
                                    Selecione
                                </option>

                                <?php foreach ($categorias as $categoria): ?>

                                    <option
                                        value="<?= (int) $categoria['id'] ?>"
                                        <?= (int) $produto['categoria_id']
                                            === (int) $categoria['id']
                                            ? 'selected'
                                            : ''
                                        ?>
                                    >
                                        <?= htmlspecialchars(
                                            $categoria['nome'],
                                            ENT_QUOTES,
                                            'UTF-8'
                                        ) ?>
                                    </option>

                                <?php endforeach; ?>

                            </select>

                        </div>


                        <div class="form-group">

                            <label for="subcategoria_id">
                                Subcategoria
                            </label>

                            <select
                                id="subcategoria_id"
                                name="subcategoria_id"
                            >

                                <option value="">
                                    Selecione
                                </option>

                                <?php foreach ($subcategorias as $subcategoria): ?>

                                    <option
                                        value="<?= (int) $subcategoria['id'] ?>"
                                        <?= (int) $produto['subcategoria_id']
                                            === (int) $subcategoria['id']
                                            ? 'selected'
                                            : ''
                                        ?>
                                    >
                                        <?= htmlspecialchars(
                                            $subcategoria['nome'],
                                            ENT_QUOTES,
                                            'UTF-8'
                                        ) ?>
                                    </option>

                                <?php endforeach; ?>

                            </select>

                        </div>


                        <div class="form-group">

                            <label for="codigo_alternativo">
                                Código alternativo
                            </label>

                            <input
                                type="text"
                                id="codigo_alternativo"
                                name="codigo_alternativo"
                                maxlength="120"
                                value="<?= htmlspecialchars(
                                    $produto['codigo_alternativo'] ?? '',
                                    ENT_QUOTES,
                                    'UTF-8'
                                ) ?>"
                            >

                        </div>


                        <div class="form-group">

                            <label for="peso_kg">
                                Peso (kg)
                            </label>

                            <input
                                type="number"
                                id="peso_kg"
                                name="peso_kg"
                                step="0.001"
                                min="0"
                                value="<?= htmlspecialchars(
                                    $produto['peso_kg'] ?? '',
                                    ENT_QUOTES,
                                    'UTF-8'
                                ) ?>"
                            >

                        </div>


                        <div class="form-group">

                            <label for="ncm">
                                NCM
                            </label>

                            <input
                                type="text"
                                id="ncm"
                                name="ncm"
                                maxlength="20"
                                value="<?= htmlspecialchars(
                                    $produto['ncm'] ?? '',
                                    ENT_QUOTES,
                                    'UTF-8'
                                ) ?>"
                            >

                        </div>


                        <div class="form-group full">

                            <label for="aplicacao">
                                Aplicação
                            </label>

                            <textarea
                                id="aplicacao"
                                name="aplicacao"
                            ><?= htmlspecialchars(
                                $produto['aplicacao'] ?? '',
                                ENT_QUOTES,
                                'UTF-8'
                            ) ?></textarea>

                        </div>


                        <div class="form-group full">

                            <label for="descricao">
                                Descrição
                            </label>

                            <textarea
                                id="descricao"
                                name="descricao"
                            ><?= htmlspecialchars(
                                $produto['descricao'] ?? '',
                                ENT_QUOTES,
                                'UTF-8'
                            ) ?></textarea>

                        </div>

                    </div>


                    <div class="panel-header"
                         style="
                            margin:25px -25px 0;
                         ">

                        <div>

                            <h2>
                                Estoque
                            </h2>

                            <p>
                                Controle a quantidade disponível.
                            </p>

                        </div>

                    </div>


                    <div class="form-grid-3"
                         style="margin-top:25px;">

                        <div class="form-group">

                            <label for="estoque_quantidade">
                                Quantidade
                            </label>

                            <input
                                type="number"
                                id="estoque_quantidade"
                                name="estoque_quantidade"
                                min="0"
                                value="<?= (int) $produto['estoque_quantidade'] ?>"
                            >

                        </div>


                        <div class="form-group">

                            <label for="estoque_minimo">
                                Estoque mínimo
                            </label>

                            <input
                                type="number"
                                id="estoque_minimo"
                                name="estoque_minimo"
                                min="0"
                                value="<?= (int) $produto['estoque_minimo'] ?>"
                            >

                        </div>


                        <div class="form-group">

                            <label for="estoque_maximo">
                                Estoque máximo
                            </label>

                            <input
                                type="number"
                                id="estoque_maximo"
                                name="estoque_maximo"
                                min="0"
                                value="<?= htmlspecialchars(
                                    $produto['estoque_maximo'] ?? '',
                                    ENT_QUOTES,
                                    'UTF-8'
                                ) ?>"
                            >

                        </div>

                    </div>


                    <div class="form-group"
                         style="margin-top:22px;">

                        <label>

                            <input
                                type="checkbox"
                                name="ativo"
                                value="1"
                                <?= (int) $produto['ativo'] === 1
                                    ? 'checked'
                                    : ''
                                ?>
                            >

                            Produto ativo

                        </label>

                    </div>


                    <div class="form-actions">

                        <a
                            href="/admin/pages/produtos.php"
                            class="btn btn-secondary"
                        >
                            Voltar
                        </a>

                        <button
                            type="submit"
                            class="btn btn-primary"
                        >
                            Salvar alterações
                        </button>

                    </div>

                </form>

            </div>

        </section>

    </main>

</div>

</body>

</html>