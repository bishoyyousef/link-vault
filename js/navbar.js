class Navbar {
    constructor() {
        this.containerId = 'navbar-container';
        this.render();
        this.setupThemeToggle();
    }

    render() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        const email = auth.getUserEmail() || 'User';
        const currentPath = window.location.pathname;

        const isActive = (path) => currentPath.includes(path) ? 'active' : '';

        const isDark = localStorage.getItem('lv_theme') === 'dark';
        const themeIcon = isDark ? 'bi-sun-fill' : 'bi-moon-stars-fill';

        const html = `
            <nav class="navbar navbar-expand-lg sticky-top mb-4">
                <div class="container-fluid">
                    <a class="navbar-brand" href="categories.html">
                        <span class="brand-gradient">LinkVault</span>
                    </a>
                    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                        <span class="navbar-toggler-icon"></span>
                    </button>
                    <div class="collapse navbar-collapse" id="navbarNav">
                        <ul class="navbar-nav me-auto mb-2 mb-lg-0">
                            <li class="nav-item">
                                <a class="nav-link ${isActive('categories.html')}" href="categories.html">Categories</a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link ${isActive('bookmarks.html')}" href="bookmarks.html">Bookmarks</a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link ${isActive('notes.html')}" href="notes.html">Notes</a>
                            </li>
                        </ul>
                        <div class="d-flex align-items-center gap-3">
                            <button id="theme-toggle" class="btn btn-link text-secondary p-0 text-decoration-none">
                                <i class="bi ${themeIcon} fs-5"></i>
                            </button>
                            <span class="text-muted small">${utils.escapeHtml(email)}</span>
                            <button onclick="auth.logout()" class="btn btn-outline-danger btn-sm">
                                <i class="bi bi-box-arrow-right"></i> Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>
        `;

        container.innerHTML = html;

        // Apply theme immediately on load
        if (isDark) {
            document.documentElement.setAttribute('data-theme', 'dark');
        }
    }

    setupThemeToggle() {
        // Theme init logic
        const isDark = localStorage.getItem('lv_theme') === 'dark';
        if (isDark) {
            document.documentElement.setAttribute('data-theme', 'dark');
        }

        // Delay attaching listener until navbar is in DOM
        setTimeout(() => {
            const toggleBtn = document.getElementById('theme-toggle');
            if (toggleBtn) {
                toggleBtn.addEventListener('click', () => {
                    const currentTheme = document.documentElement.getAttribute('data-theme');
                    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
                    
                    if (newTheme === 'dark') {
                        document.documentElement.setAttribute('data-theme', 'dark');
                        localStorage.setItem('lv_theme', 'dark');
                        toggleBtn.innerHTML = '<i class="bi bi-sun-fill fs-5"></i>';
                    } else {
                        document.documentElement.removeAttribute('data-theme');
                        localStorage.setItem('lv_theme', 'light');
                        toggleBtn.innerHTML = '<i class="bi bi-moon-stars-fill fs-5"></i>';
                    }
                });
            }
        }, 0);
    }
}

// Global scope
const initTheme = () => {
     const isDark = localStorage.getItem('lv_theme') === 'dark';
     if (isDark) {
         document.documentElement.setAttribute('data-theme', 'dark');
     }
}
initTheme(); // Run immediately in head to avoid flash

document.addEventListener('DOMContentLoaded', () => {
    new Navbar();
});
