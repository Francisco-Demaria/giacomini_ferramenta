function abrirMenu() {
    const menu = document.getElementById('menu-lateral');
    const overlay = document.getElementById('overlay');

    if (!menu || !overlay) return;

    menu.classList.add('aberto');
    overlay.style.display = 'block';
}

function fecharMenu() {
    const menu = document.getElementById('menu-lateral');
    const overlay = document.getElementById('overlay');

    if (!menu || !overlay) return;

    menu.classList.remove('aberto');
    overlay.style.display = 'none';
}

// Disponibiliza as funções para onclick="" no HTML
window.abrirMenu = abrirMenu;
window.fecharMenu = fecharMenu;