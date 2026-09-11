<?php

require_once __DIR__ . '/../includes/proteger.php';
require_once __DIR__ . '/../../config/banco.php';

$erro = '';

$categorias = $pdo->query("
    SELECT id, nome
    FROM categorias
    WHERE ativo = 1
    ORDER BY nome ASC
")->fetchAll();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    $codigo = trim($_POST['codigo'] ?? '');
    $nome = trim($_POST['nome'] ?? '');
    $marca = trim($_POST['marca'] ?? '');
    $linha = trim($_POST['linha'] ?? '');
    $categoriaId = filter_input(INPUT_POST, 'categoria_id', FILTER_VALIDATE_INT);
    $subcategoriaId = filter_input(INPUT_POST, 'subcategoria_id', FILTER_VALIDATE_INT);
    $codigoAlternativo = trim($_POST['codigo_alternativo'] ?? '');
    $pesoKg = str_replace(',', '.', trim($_POST['peso_kg'] ?? ''));
    $ncm = trim($_POST['ncm'] ?? '');
    $aplicacao = trim($_POST['aplicacao'] ?? '');
    $descricao = trim($_POST['descricao'] ?? '');

    $estoqueInicial = filter_input(
        INPUT_POST,
        'estoque_inicial',
        FILTER_VALIDATE_INT
    );

    $estoqueMinimo = filter_input(
        INPUT_POST,
        'estoque_minimo',
        FILTER_VALIDATE_INT
    );

    $estoqueMaximo = filter_input(
        INPUT_POST,
        'estoque_maximo',
        FILTER_VALIDATE_INT
    );

    $precoVista = str_replace(',', '.', trim($_POST['preco_vista'] ?? ''));
    $precoParcelado = str_replace(',', '.', trim($_POST['preco_parcelado'] ?? ''));

    if ($codigo === '') {
        $erro = 'Informe o código do produto.';
    } elseif ($nome === '') {
        $erro = 'Informe o nome do produto.';
    } elseif (!$categoriaId) {
        $erro = 'Selecione uma categoria.';
    } else {

        try {

            $pdo->beginTransaction();

            $stmt = $pdo->prepare("
                INSERT INTO produtos (
                    sku,
                    codigo_makita,
                    nome,
                    descricao,
                    marca,
                    categoria_id,
                    subcategoria_id,
                    aplicacao,
                    linha,
                    codigo_alternativo,
                    peso_kg,
                    ncm,
                    preco_vista,
                    preco_parcelado,
                    ativo
                ) VALUES (
                    :sku,
                    :codigo_makita,
                    :nome,
                    :descricao,
                    :marca,
                    :categoria_id,
                    :subcategoria_id,
                    :aplicacao,
                    :linha,
                    :codigo_alternativo,
                    :peso_kg,
                    :ncm,
                    :preco_vista,
                    :preco_parcelado,
                    1
                )
            ");

            $stmt->execute([
                ':sku' => $codigo,
                ':codigo_makita' => $codigo,
                ':nome' => $nome,
                ':descricao' => $descricao ?: null,
                ':marca' => $marca ?: null,
                ':categoria_id' => $categoriaId,
                ':subcategoria_id' => $subcategoriaId ?: null,
                ':aplicacao' => $aplicacao ?: null,
                ':linha' => $linha ?: null,
                ':codigo_alternativo' => $codigoAlternativo ?: null,
                ':peso_kg' => $pesoKg !== '' ? $pesoKg : null,
                ':ncm' => $ncm ?: null,
                ':preco_vista' => $precoVista !== '' ? $precoVista : null,
                ':preco_parcelado' => $precoParcelado !== '' ? $precoParcelado : null
            ]);

            $produtoId = $pdo->lastInsertId();

            $stmt = $pdo->prepare("
                INSERT INTO estoque (
                    produto_id,
                    quantidade,
                    estoque_minimo,
                    estoque_maximo
                ) VALUES (
                    :produto_id,
                    :quantidade,
                    :estoque_minimo,
                    :estoque_maximo
                )
            ");

            $stmt->execute([
                ':produto_id' => $produtoId,
                ':quantidade' => $estoqueInicial ?? 0,
                ':estoque_minimo' => $estoqueMinimo ?? 0,
                ':estoque_maximo' => $estoqueMaximo ?? 0
            ]);

            $pdo->commit();

            header(
                'Location: /admin/pages/editar-produto.php?id='
                . $produtoId
                . '&salvo=1'
            );
            exit;

        } catch (Throwable $e) {

            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }

            $erro = 'Não foi possível cadastrar o produto.';
        }
    }
}

require_once __DIR__ . '/../includes/header.php';
require_once __DIR__ . '/../includes/sidebar.php';
?>

<main class="admin-main">

    <div class="page-header">
        <div>
            <h1>Novo produto</h1>
            <p>Cadastre um produto no catálogo.</p>
        </div>

        <a href="/admin/pages/produtos.php" class="btn btn-secondary">
            Voltar
        </a>
    </div>

    <?php if ($erro): ?>
        <div class="alert alert-error">
            <?= htmlspecialchars($erro) ?>
        </div>
    <?php endif; ?>

    <form method="POST" class="admin-form">

        <section class="panel">

            <div class="panel-header">
                <h2>Informações principais</h2>
            </div>

            <div class="form-grid">

                <div class="form-group">
                    <label for="codigo">Código *</label>

                    <input
                        type="text"
                        id="codigo"
                        name="codigo"
                        required
                    >
                </div>

                <div class="form-group">
                    <label for="nome">Nome *</label>

                    <input
                        type="text"
                        id="nome"
                        name="nome"
                        required
                    >
                </div>

                <div class="form-group">
                    <label for="marca">Marca</label>

                    <input
                        type="text"
                        id="marca"
                        name="marca"
                        value="Makita"
                    >
                </div>

                <div class="form-group">
                    <label for="linha">Linha</label>

                    <input
                        type="text"
                        id="linha"
                        name="linha"
                    >
                </div>

                <div class="form-group">
                    <label for="categoria_id">Categoria *</label>

                    <select
                        id="categoria_id"
                        name="categoria_id"
                        required
                    >
                        <option value="">Selecione</option>

                        <?php foreach ($categorias as $categoria): ?>

                            <option value="<?= $categoria['id'] ?>">
                                <?= htmlspecialchars($categoria['nome']) ?>
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
                        disabled
                    >
                        <option value="">
                            Selecione a categoria primeiro
                        </option>
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
                    >
                </div>

                <div class="form-group">
                    <label for="peso_kg">Peso (kg)</label>

                    <input
                        type="number"
                        step="0.001"
                        id="peso_kg"
                        name="peso_kg"
                    >
                </div>

                <div class="form-group">
                    <label for="ncm">NCM</label>

                    <input
                        type="text"
                        id="ncm"
                        name="ncm"
                    >
                </div>

            </div>

        </section>

        <section class="panel">

            <div class="panel-header">
                <h2>Preço</h2>
            </div>

            <div class="form-grid">

                <div class="form-group">
                    <label for="preco_vista">
                        Preço à vista
                    </label>

                    <input
                        type="number"
                        step="0.01"
                        id="preco_vista"
                        name="preco_vista"
                    >
                </div>

                <div class="form-group">
                    <label for="preco_parcelado">
                        Preço à prazo
                    </label>

                    <input
                        type="number"
                        step="0.01"
                        id="preco_parcelado"
                        name="preco_parcelado"
                    >
                </div>

            </div>

        </section>

        <section class="panel">

            <div class="panel-header">
                <h2>Estoque</h2>
            </div>

            <div class="form-grid">

                <div class="form-group">
                    <label for="estoque_inicial">
                        Estoque inicial
                    </label>

                    <input
                        type="number"
                        id="estoque_inicial"
                        name="estoque_inicial"
                        value="0"
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
                        value="0"
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
                        value="0"
                    >
                </div>

            </div>

        </section>

        <section class="panel">

            <div class="panel-header">
                <h2>Descrição</h2>
            </div>

            <div class="form-group">

                <label for="aplicacao">
                    Aplicação
                </label>

                <textarea
                    id="aplicacao"
                    name="aplicacao"
                    rows="4"
                ></textarea>

            </div>

            <div class="form-group">

                <label for="descricao">
                    Descrição
                </label>

                <textarea
                    id="descricao"
                    name="descricao"
                    rows="6"
                ></textarea>

            </div>

        </section>

        <div class="form-actions">

            <a
                href="/admin/pages/produtos.php"
                class="btn btn-secondary"
            >
                Cancelar
            </a>

            <button
                type="submit"
                class="btn btn-primary"
            >
                Cadastrar produto
            </button>

        </div>

    </form>

</main>

<script>

const categoria = document.getElementById('categoria_id');
const subcategoria = document.getElementById('subcategoria_id');

categoria.addEventListener('change', async function () {

    const categoriaId = this.value;

    subcategoria.innerHTML = '';

    if (!categoriaId) {

        subcategoria.disabled = true;

        const option = document.createElement('option');
        option.textContent = 'Selecione a categoria primeiro';

        subcategoria.appendChild(option);

        return;
    }

    subcategoria.disabled = true;

    const carregando = document.createElement('option');
    carregando.textContent = 'Carregando...';

    subcategoria.appendChild(carregando);

    try {

        const resposta = await fetch(
            '/admin/pages/subcategorias-api.php?categoria_id='
            + encodeURIComponent(categoriaId)
        );

        if (!resposta.ok) {
            throw new Error('Erro ao carregar subcategorias.');
        }

        const dados = await resposta.json();

        subcategoria.innerHTML = '';

        const primeira = document.createElement('option');
        primeira.value = '';
        primeira.textContent = 'Nenhuma';

        subcategoria.appendChild(primeira);

        dados.forEach(item => {

            const option = document.createElement('option');

            option.value = item.id;
            option.textContent = item.nome;

            subcategoria.appendChild(option);

        });

        subcategoria.disabled = false;

    } catch (erro) {

        subcategoria.innerHTML = '';

        const option = document.createElement('option');

        option.textContent =
            'Erro ao carregar subcategorias';

        subcategoria.appendChild(option);

    }

});

</script>