let currentCategories = [];
let categoryModalInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    categoryModalInstance = new bootstrap.Modal(document.getElementById('categoryModal'));
    loadCategories();
    setupEventListeners();
});

async function loadCategories() {
    const container = document.getElementById('categories-container');
    container.innerHTML = ui.getSpinner();

    try {
        currentCategories = await api.get('/categories');
        renderCategories();
    } catch (error) {
        ui.showError(error);
        container.innerHTML = `<div class="alert alert-danger">Failed to load categories.</div>`;
    }
}

function renderCategories() {
    const container = document.getElementById('categories-container');
    
    if (!currentCategories || currentCategories.length === 0) {
        container.innerHTML = ui.getEmptyState('No Categories Yet', 'Create a category to start organizing your bookmarks.', 'bi-folder2-open');
        return;
    }

    let html = `
        <div class="table-responsive">
            <table class="table">
                <thead>
                    <tr>
                        <th style="width: 30%">Name</th>
                        <th style="width: 35%">Description</th>
                        <th style="width: 15%">Stats</th>
                        <th style="width: 20%" class="text-end">Actions</th>
                    </tr>
                </thead>
                <tbody id="categories-tbody">
    `;

    currentCategories.forEach((cat, index) => {
        const id = cat.id;
        // Defensive mapping for fields
        const name = cat.categoryName || cat.name || 'Unnamed';
        const description = cat.description || '<span class="text-muted fst-italic">No description</span>';
        const date = cat.createdDate || cat.createdAt ? utils.formatDate(cat.createdDate || cat.createdAt) : '';
        
        const bCount = cat.bookmarksCount !== undefined ? cat.bookmarksCount : (cat.bookmarks ? cat.bookmarks.length : 0);
        const nCount = cat.notesCount !== undefined ? cat.notesCount : (cat.notes ? cat.notes.length : 0);

        html += `
            <tr class="draggable-item" draggable="true" data-index="${index}">
                <td>
                    <div class="fw-semibold">${utils.escapeHtml(name)}</div>
                    ${date ? `<small class="text-muted">${date}</small>` : ''}
                </td>
                <td class="text-muted text-truncate-2">${typeof cat.description === 'string' ? utils.escapeHtml(cat.description) : description}</td>
                <td>
                    <span class="badge badge-soft-primary me-1" title="Bookmarks"><i class="bi bi-bookmark"></i> ${bCount}</span>
                    <span class="badge badge-soft-warning" title="Notes"><i class="bi bi-journal-text"></i> ${nCount}</span>
                </td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-primary me-2" onclick="editCategory(${id})">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteCategory(${id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    html += `</tbody></table></div>`;
    container.innerHTML = html;
    
    setupDragAndDrop();
}

function setupEventListeners() {
    const modalEl = document.getElementById('categoryModal');
    modalEl.addEventListener('hidden.bs.modal', () => {
        document.getElementById('category-form').reset();
        document.getElementById('category-id').value = '';
        document.getElementById('categoryModalTitle').textContent = 'Create Category';
    });

    document.getElementById('category-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        ui.setLoading('btn-save-category', true);

        const id = document.getElementById('category-id').value;
        const payload = {
            categoryName: document.getElementById('category-name').value,
            description: document.getElementById('category-description').value || null
        };

        try {
            if (id) {
                // PUT requires full object
                await api.put(`/categories/${id}`, payload);
                ui.showToast('Category updated successfully');
            } else {
                await api.post('/categories', payload);
                ui.showToast('Category created successfully');
            }
            categoryModalInstance.hide();
            loadCategories();
        } catch (error) {
            ui.showError(error);
        } finally {
            ui.setLoading('btn-save-category', false, 'Save Category');
        }
    });
}

window.editCategory = (id) => {
    const cat = currentCategories.find(c => c.id === id);
    if (!cat) return;

    document.getElementById('category-id').value = cat.id;
    document.getElementById('category-name').value = cat.categoryName || cat.name || '';
    document.getElementById('category-description').value = cat.description || '';
    
    document.getElementById('categoryModalTitle').textContent = 'Edit Category';
    categoryModalInstance.show();
};

window.deleteCategory = async (id) => {
    if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
        return;
    }

    try {
        await api.delete(`/categories/${id}`);
        ui.showToast('Category deleted successfully');
        loadCategories();
    } catch (error) {
        ui.showError(error);
    }
};

// Simple Client-side Drag & Drop reordering
function setupDragAndDrop() {
    const tbody = document.getElementById('categories-tbody');
    if (!tbody) return;

    let draggedRow = null;

    tbody.querySelectorAll('tr').forEach(row => {
        row.addEventListener('dragstart', function(e) {
            draggedRow = this;
            e.dataTransfer.effectAllowed = 'move';
            this.style.opacity = '0.5';
        });

        row.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            this.classList.add('drag-over');
        });

        row.addEventListener('dragleave', function(e) {
            this.classList.remove('drag-over');
        });

        row.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('drag-over');
            
            if (draggedRow !== this) {
                // Determine insertion point
                const allRows = [...tbody.querySelectorAll('tr')];
                const draggedIndex = allRows.indexOf(draggedRow);
                const targetIndex = allRows.indexOf(this);

                if (draggedIndex < targetIndex) {
                    this.after(draggedRow);
                } else {
                    this.before(draggedRow);
                }
                
                // Note: Reordering is visual only as API doesn't support order persistence.
            }
        });

        row.addEventListener('dragend', function() {
            this.style.opacity = '1';
            tbody.querySelectorAll('tr').forEach(r => r.classList.remove('drag-over'));
        });
    });
}
