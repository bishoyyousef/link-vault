const ui = {
    toastContainer: null,

    init() {
        // Create toast container if it doesn't exist
        if (!document.getElementById('toast-container')) {
            this.toastContainer = document.createElement('div');
            this.toastContainer.id = 'toast-container';
            this.toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
            document.body.appendChild(this.toastContainer);
        } else {
            this.toastContainer = document.getElementById('toast-container');
        }

        // Initialize keyboard shortcuts globally
        this.initKeyboardShortcuts();
    },

    showToast(message, type = 'success') {
        if (!this.toastContainer) this.init();

        const toastEl = document.createElement('div');
        toastEl.className = `toast align-items-center text-white bg-${type} border-0 mb-2`;
        toastEl.setAttribute('role', 'alert');
        toastEl.setAttribute('aria-live', 'assertive');
        toastEl.setAttribute('aria-atomic', 'true');

        toastEl.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    ${utils.escapeHtml(message)}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        `;

        this.toastContainer.appendChild(toastEl);
        const bsToast = new bootstrap.Toast(toastEl, { delay: 3000 });
        bsToast.show();

        toastEl.addEventListener('hidden.bs.toast', () => {
            toastEl.remove();
        });
    },

    showError(error) {
        const message = error instanceof Error ? error.message : 'An unexpected error occurred';
        this.showToast(message, 'danger');
    },

    setLoading(buttonId, isLoading, defaultText = 'Submit') {
        const btn = document.getElementById(buttonId);
        if (!btn) return;

        if (isLoading) {
            btn.disabled = true;
            btn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...`;
        } else {
            btn.disabled = false;
            btn.innerHTML = defaultText;
        }
    },

    getEmptyState(title, message, icon = 'bi-inbox') {
        return `
            <div class="empty-state">
                <i class="bi ${icon}"></i>
                <h5>${title}</h5>
                <p class="text-muted">${message}</p>
            </div>
        `;
    },

    getSpinner() {
        return `
            <div class="spinner-container">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
        `;
    },

    initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ignore if in an input/textarea
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
                return;
            }

            // 'N' to open primary modal (create item)
            if (e.key === 'n' || e.key === 'N') {
                const createBtn = document.querySelector('[data-bs-target^="#create"]');
                if (createBtn) {
                    e.preventDefault();
                    createBtn.click();
                }
            }
        });
    },

    renderPagination(totalItems, itemsPerPage, currentPage, onPageChange) {
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        if (totalPages <= 1) return '';

        let html = '<ul class="pagination justify-content-center mt-4">';
        
        // Prev
        html += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                    <a class="page-link cursor-pointer" onclick="${onPageChange}(${currentPage - 1})">Previous</a>
                 </li>`;

        for (let i = 1; i <= totalPages; i++) {
            html += `<li class="page-item ${currentPage === i ? 'active' : ''}">
                        <a class="page-link cursor-pointer" onclick="${onPageChange}(${i})">${i}</a>
                     </li>`;
        }

        // Next
        html += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                    <a class="page-link cursor-pointer" onclick="${onPageChange}(${currentPage + 1})">Next</a>
                 </li>`;
                 
        html += '</ul>';
        return html;
    }
};

// Initialize UI
document.addEventListener('DOMContentLoaded', () => ui.init());
