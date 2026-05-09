let currentNotes = [];
let filteredNotes = [];
let categories = [];
let noteModalInstance = null;
let currentPage = 1;
const itemsPerPage = 10;

document.addEventListener('DOMContentLoaded', async () => {
    noteModalInstance = new bootstrap.Modal(document.getElementById('noteModal'));
    
    await loadCategories();
    initFiltersFromUrl();
    await loadNotes();
    
    setupEventListeners();
});

async function loadCategories() {
    try {
        categories = await api.get('/categories');
        const filterSelect = document.getElementById('filter-category');
        const formSelect = document.getElementById('note-category');
        
        let optionsHtml = '';
        categories.forEach(cat => {
            const id = cat.id;
            const name = utils.escapeHtml(cat.categoryName || cat.name || 'Unnamed');
            optionsHtml += `<option value="${id}">${name}</option>`;
        });

        filterSelect.innerHTML = `<option value="">All Categories</option>` + optionsHtml;
        formSelect.innerHTML = `<option value="">Select a category</option>` + optionsHtml;
    } catch (error) {
        console.error("Failed to load categories", error);
    }
}

function initFiltersFromUrl() {
    const catId = utils.getQueryParam('Category');
    if (catId) document.getElementById('filter-category').value = catId;
    
    const isPinned = utils.getQueryParam('Pinned');
    if (isPinned === 'true') document.getElementById('filter-pinned').checked = true;
    
    const search = utils.getQueryParam('searchWord');
    if (search) document.getElementById('filter-search').value = search;
}

async function loadNotes() {
    const container = document.getElementById('notes-container');
    container.innerHTML = ui.getSpinner();

    try {
        const params = new URLSearchParams();
        
        const catId = document.getElementById('filter-category').value;
        if (catId) params.append('Category', catId);
        
        const isPinned = document.getElementById('filter-pinned').checked;
        if (isPinned) params.append('Pinned', 'true');
        
        const search = document.getElementById('filter-search').value.trim();
        if (search) params.append('searchWord', search);

        const qs = params.toString();
        currentNotes = await api.get(`/notes${qs ? '?' + qs : ''}`);
        
        applyClientSideSorting();
    } catch (error) {
        ui.showError(error);
        container.innerHTML = `<div class="alert alert-danger">Failed to load notes.</div>`;
    }
}

function applyClientSideSorting() {
    filteredNotes = [...currentNotes];
    const sortVal = document.getElementById('filter-sort').value;

    filteredNotes.sort((a, b) => {
        const dateA = new Date(a.createdDate || a.createdAt || 0).getTime();
        const dateB = new Date(b.createdDate || b.createdAt || 0).getTime();
        const titleA = (a.title || '').toLowerCase();
        const titleB = (b.title || '').toLowerCase();

        switch (sortVal) {
            case 'date-desc': return dateB - dateA;
            case 'date-asc': return dateA - dateB;
            case 'title-asc': return titleA.localeCompare(titleB);
            case 'pinned': 
                if (a.isPinned === b.isPinned) return dateB - dateA;
                return a.isPinned ? -1 : 1;
            default: return dateB - dateA;
        }
    });

    renderNotes();
}

window.changePage = (page) => {
    currentPage = page;
    renderNotes();
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

function renderNotes() {
    const container = document.getElementById('notes-container');
    const paginationContainer = document.getElementById('pagination-container');
    
    if (!filteredNotes || filteredNotes.length === 0) {
        container.innerHTML = ui.getEmptyState('No Notes Found', 'Adjust filters or create a new standalone note.', 'bi-journal-x');
        paginationContainer.innerHTML = '';
        return;
    }

    const totalItems = filteredNotes.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedItems = filteredNotes.slice(startIndex, startIndex + itemsPerPage);

    let html = '<div class="row g-4" id="notes-grid">';

    paginatedItems.forEach((note, index) => {
        const id = note.id;
        const title = utils.escapeHtml(note.title || 'Untitled');
        const content = utils.escapeHtml(note.content || '');
        const catName = categories.find(c => c.id === note.categoryId)?.categoryName || 'Unknown';
        const date = note.createdDate || note.createdAt ? utils.formatDate(note.createdDate || note.createdAt) : '';
        const isPinned = note.isPinned;

        html += `
            <div class="col-md-6 col-lg-4">
                <div class="card h-100 draggable-item" draggable="true" data-id="${id}" data-index="${index}">
                    <div class="card-header bg-transparent d-flex justify-content-between align-items-start border-0 pb-0">
                        <div class="d-flex align-items-center gap-2">
                            <button class="icon-btn p-1 ${isPinned ? 'active' : ''}" onclick="togglePin(${id})" title="${isPinned ? 'Unpin' : 'Pin'}">
                                <i class="bi bi-pin-angle${isPinned ? '-fill' : ''}"></i>
                            </button>
                            <h5 class="mb-0 text-truncate" style="max-width: 180px;" title="${title}">${title}</h5>
                        </div>
                        <div class="dropdown">
                            <button class="btn btn-sm btn-link text-muted text-decoration-none" data-bs-toggle="dropdown">
                                <i class="bi bi-three-dots-vertical"></i>
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end shadow-sm">
                                <li><button class="dropdown-item" onclick="editNote(${id})"><i class="bi bi-pencil me-2"></i>Edit</button></li>
                                <li><hr class="dropdown-divider"></li>
                                <li><button class="dropdown-item text-danger" onclick="deleteNote(${id})"><i class="bi bi-trash me-2"></i>Delete</button></li>
                            </ul>
                        </div>
                    </div>
                    <div class="card-body pt-2">
                        <p class="card-text text-muted text-truncate-2" style="white-space: pre-wrap;">${content}</p>
                    </div>
                    <div class="card-footer bg-transparent border-0 pt-0">
                        <div class="d-flex justify-content-between align-items-center w-100">
                            <span class="badge badge-soft-primary">${utils.escapeHtml(catName)}</span>
                            <small class="text-muted">${date}</small>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
    
    paginationContainer.innerHTML = ui.renderPagination(totalItems, itemsPerPage, currentPage, 'changePage');
    
    setupDragAndDrop();
}

function setupEventListeners() {
    // Form submit
    document.getElementById('note-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        ui.setLoading('btn-save-note', true);

        const id = document.getElementById('note-id').value;
        const payload = {
            title: document.getElementById('note-title').value,
            content: document.getElementById('note-content').value,
            categoryId: parseInt(document.getElementById('note-category').value)
        };

        try {
            if (id) {
                await api.put(`/notes/${id}`, payload);
                ui.showToast('Note updated successfully');
            } else {
                await api.post('/notes', payload);
                ui.showToast('Note created successfully');
            }
            noteModalInstance.hide();
            await loadNotes();
        } catch (error) {
            ui.showError(error);
        } finally {
            ui.setLoading('btn-save-note', false, 'Save Note');
        }
    });

    // Modal reset
    document.getElementById('noteModal').addEventListener('hidden.bs.modal', () => {
        document.getElementById('note-form').reset();
        document.getElementById('note-id').value = '';
        document.getElementById('noteModalTitle').textContent = 'Create Note';
    });

    // Filters
    const filterIds = ['filter-category', 'filter-sort', 'filter-pinned'];
    filterIds.forEach(id => {
        document.getElementById(id).addEventListener('change', () => {
            currentPage = 1;
            updateUrlParams();
            if (id === 'filter-sort') applyClientSideSorting();
            else loadNotes();
        });
    });

    // Search (Debounced)
    document.getElementById('filter-search').addEventListener('input', utils.debounce(() => {
        currentPage = 1;
        updateUrlParams();
        loadNotes();
    }, 500));

    // Clear
    document.getElementById('btn-clear-filters').addEventListener('click', () => {
        document.getElementById('filter-search').value = '';
        document.getElementById('filter-category').value = '';
        document.getElementById('filter-sort').value = 'date-desc';
        document.getElementById('filter-pinned').checked = false;
        
        updateUrlParams();
        currentPage = 1;
        loadNotes();
    });
}

function updateUrlParams() {
    const catId = document.getElementById('filter-category').value;
    const isPinned = document.getElementById('filter-pinned').checked;
    const search = document.getElementById('filter-search').value.trim();

    utils.setQueryParam('Category', catId || null);
    utils.setQueryParam('Pinned', isPinned ? 'true' : null);
    utils.setQueryParam('searchWord', search || null);
}

window.editNote = (id) => {
    const note = currentNotes.find(n => n.id == id);
    if (!note) return;

    document.getElementById('note-id').value = note.id;
    document.getElementById('note-title').value = note.title;
    document.getElementById('note-content').value = note.content;
    document.getElementById('note-category').value = note.categoryId;
    
    document.getElementById('noteModalTitle').textContent = 'Edit Note';
    noteModalInstance.show();
};

window.deleteNote = async (id) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
        await api.delete(`/notes/${id}`);
        ui.showToast('Note deleted');
        loadNotes();
    } catch (error) {
        ui.showError(error);
    }
};

window.togglePin = async (id) => {
    const note = currentNotes.find(n => n.id == id);
    if (!note) return;

    try {
        // Dedicated PATCH endpoint
        await api.patch(`/notes/${id}/pin`, {});
        note.isPinned = !note.isPinned;
        applyClientSideSorting();
    } catch (error) {
        ui.showError(error);
    }
};

window.exportNotes = () => {
    if (currentNotes.length === 0) {
        ui.showToast('No notes to export', 'warning');
        return;
    }
    
    const exportData = currentNotes.map(n => ({
        id: n.id,
        title: n.title,
        content: n.content,
        category: categories.find(c => c.id === n.categoryId)?.categoryName || '',
        isPinned: n.isPinned,
        createdDate: n.createdDate || n.createdAt
    }));
    
    utils.downloadJson(exportData, `linkvault_notes_${new Date().toISOString().split('T')[0]}.json`);
};

// Drag & Drop for Notes
function setupDragAndDrop() {
    const grid = document.getElementById('notes-grid');
    if (!grid) return;

    let draggedCard = null;

    grid.querySelectorAll('.draggable-item').forEach(card => {
        card.addEventListener('dragstart', function(e) {
            draggedCard = this.parentElement; // the col div
            e.dataTransfer.effectAllowed = 'move';
            this.style.opacity = '0.5';
        });

        card.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            this.classList.add('drag-over');
        });

        card.addEventListener('dragleave', function(e) {
            this.classList.remove('drag-over');
        });

        card.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('drag-over');
            
            const targetCol = this.parentElement;
            if (draggedCard !== targetCol) {
                const allCols = [...grid.children];
                const draggedIndex = allCols.indexOf(draggedCard);
                const targetIndex = allCols.indexOf(targetCol);

                if (draggedIndex < targetIndex) {
                    targetCol.after(draggedCard);
                } else {
                    targetCol.before(draggedCard);
                }
            }
        });

        card.addEventListener('dragend', function() {
            this.style.opacity = '1';
            grid.querySelectorAll('.draggable-item').forEach(c => c.classList.remove('drag-over'));
        });
    });
}
