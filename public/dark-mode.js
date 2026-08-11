document.addEventListener("DOMContentLoaded", () => {
    const btnToggle = document.createElement('button');
    btnToggle.className = 'dark-mode-toggle';
    btnToggle.id = 'theme-toggle-btn';
    
    const modoOscuroActivo = localStorage.getItem('darkMode') === 'true';
    if (modoOscuroActivo) {
        document.body.classList.add('dark-mode');
        btnToggle.innerHTML = '☀️';
    } else {
        btnToggle.innerHTML = '🌙';
    }

    btnToggle.onclick = () => {
        document.body.classList.toggle('dark-mode');
        const esOscuro = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', esOscuro);
        btnToggle.innerHTML = esOscuro ? '☀️' : '🌙';
    };

    document.body.appendChild(btnToggle);
});
