const auth = {
    getToken() {
        return localStorage.getItem('lv_token');
    },

    setToken(token) {
        localStorage.setItem('lv_token', token);
    },

    clearToken() {
        localStorage.removeItem('lv_token');
    },

    isAuthenticated() {
        return !!this.getToken();
    },

    getUserEmail() {
        const token = this.getToken();
        if (!token) return null;
        return utils.getEmailFromToken(token);
    },

    logout() {
        this.clearToken();
        window.location.href = 'login.html';
    },

    checkAuth() {
        const isLoginPage = window.location.pathname.endsWith('login.html') || window.location.pathname.endsWith('/');
        
        if (!this.isAuthenticated() && !isLoginPage) {
            window.location.href = 'login.html';
        } else if (this.isAuthenticated() && isLoginPage) {
            window.location.href = 'categories.html';
        }
    }
};

// Run check on script load
auth.checkAuth();
