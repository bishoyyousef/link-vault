let currentBookmarks = [];
let filteredBookmarks = [];
let categories = [];
let bookmarkModalInstance = null;
let currentPage = 1;
const itemsPerPage = 10;

document.addEventListener('DOMContentLoaded', async () => {
    bookmarkModalInstance = new bootstrap.Modal(document.getElementById('bookmarkModal'));
    
    // Load categories first for the dropdowns
    await loadCategories();
    
    // Parse URL params for initial filters
    initFiltersFromUrl();
    
    // Then load bookmarks
    await loadBookmarks();
    
    setupEventListeners();
});

async function loadCategories() {
    try {
        categories = await api.get('/categories');
        const filterSelect = document.getElementById('filter-category');
        const formSelect = document.getElementById('bm-category');
        
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
    const catId = utils.getQueryParam('CategoryId');
    if (catId) document.getElementById('filter-category').value = catId;
    
    const isFav = utils.getQueryParam('IsFavorite');
    if (isFav === 'true') document.getElementById('filter-favorite').checked = true;
    
    const isArch = utils.getQueryParam('IsArchived');
    if (isArch === 'true') document.getElementById('filter-archived').checked = true;
    
    const search = utils.getQueryParam('Search');
    if (search) document.getElementById('filter-search').value = search;
}

async function loadBookmarks() {
    const container = document.getElementById('bookmarks-container');
    container.innerHTML = ui.getSpinner();

    try {
        // Build query string based on API requirements
        const params = new URLSearchParams();
        
        const catId = document.getElementById('filter-category').value;
        if (catId) params.append('CategoryId', catId);
        
        const isFav = document.getElementById('filter-favorite').checked;
        if (isFav) params.append('IsFavorite', 'true');
        
        const isArch = document.getElementById('filter-archived').checked;
        if (isArch) params.append('IsArchived', 'true');
        
        const search = document.getElementById('filter-search').value.trim();
        if (search) params.append('Search', search);

        const qs = params.toString();
        currentBookmarks = await api.get(`/bookmarks${qs ? '?' + qs : ''}`);
        
        applyClientSideSorting();
    } catch (error) {
        ui.showError(error);
        container.innerHTML = `<div class="alert alert-danger">Failed to load bookmarks.</div>`;
    }
}

function applyClientSideSorting() {
    filteredBookmarks = [...currentBookmarks];
    const sortVal = document.getElementById('filter-sort').value;

    filteredBookmarks.sort((a, b) => {
        const dateA = new Date(a.createdDate || a.createdAt || 0).getTime();
        const dateB = new Date(b.createdDate || b.createdAt || 0).getTime();
        const titleA = (a.title || '').toLowerCase();
        const titleB = (b.title || '').toLowerCase();

        switch (sortVal) {
            case 'date-desc': return dateB - dateA;
            case 'date-asc': return dateA - dateB;
            case 'title-asc': return titleA.localeCompare(titleB);
            case 'title-desc': return titleB.localeCompare(titleA);
            case 'favorite': 
                if (a.isFavorite === b.isFavorite) return dateB - dateA;
                return a.isFavorite ? -1 : 1;
            default: return dateB - dateA;
        }
    });

    renderBookmarks();
}

window.changePage = (page) => {
    currentPage = page;
    renderBookmarks();
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

function renderBookmarks() {
    const container = document.getElementById('bookmarks-container');
    const paginationContainer = document.getElementById('pagination-container');
    
    if (!filteredBookmarks || filteredBookmarks.length === 0) {
        container.innerHTML = ui.getEmptyState('No Bookmarks Found', 'Try adjusting your filters or create a new bookmark.', 'bi-bookmark-x');
        paginationContainer.innerHTML = '';
        return;
    }

    // Pagination logic
    const totalItems = filteredBookmarks.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedItems = filteredBookmarks.slice(startIndex, startIndex + itemsPerPage);

    let html = `
        <div class="table-responsive">
            <table class="table align-middle">
                <thead>
                    <tr>
                        <th style="width: 5%"></th>
                        <th style="width: 40%">Bookmark</th>
                        <th style="width: 20%">Category</th>
                        <th style="width: 15%">Date</th>
                        <th style="width: 20%" class="text-end">Actions</th>
                    </tr>
                </thead>
                <tbody>
    `;

    paginatedItems.forEach(bm => {
        const id = bm.id;
        const title = utils.escapeHtml(bm.title || 'Untitled');
        const url = utils.escapeHtml(bm.url || '#');
        const catName = categories.find(c => c.id === bm.categoryId)?.categoryName || 'Unknown';
        const date = bm.createdDate || bm.createdAt ? utils.formatDate(bm.createdDate || bm.createdAt) : '';
        const isFav = bm.isFavorite;
        const isArch = bm.isArchived;

        html += `
            <tr class="${isArch ? 'opacity-50' : ''}">
                <td class="text-center">
                    <button class="icon-btn ${isFav ? 'active' : ''}" onclick="toggleFavorite(${id})" title="Toggle Favorite">
                        <i class="bi ${isFav ? 'bi-star-fill' : 'bi-star'}"></i>
                    </button>
                </td>
                <td>
                    <div class="fw-semibold text-truncate" style="max-width: 300px;">
                        <a href="${url}" target="_blank" rel="noopener noreferrer" class="text-decoration-none">
                            ${title}
                        </a>
                    </div>
                    <small class="text-muted text-truncate d-block" style="max-width: 300px;">
                        ${url}
                    </small>
                </td>
                <td><span class="badge badge-soft-primary">${utils.escapeHtml(catName)}</span></td>
                <td class="text-muted small">${date}</td>
                <td class="text-end">
                    <a href="bookmark-details.html?id=${id}" class="btn btn-sm btn-outline-info me-1" title="Details & Notes">
                        <i class="bi bi-info-circle"></i>
                    </a>
                    <button class="btn btn-sm btn-outline-secondary me-1" onclick="toggleArchive(${id})" title="${isArch ? 'Unarchive' : 'Archive'}">
                        <i class="bi ${isArch ? 'bi-box-arrow-up' : 'bi-archive'}"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="editBookmark(${id})" title="Edit">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteBookmark(${id})" title="Delete">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    html += `</tbody></table></div>`;
    container.innerHTML = html;
    
    // Render pagination controls
    paginationContainer.innerHTML = ui.renderPagination(totalItems, itemsPerPage, currentPage, 'changePage');
}

function setupEventListeners() {
    // Modal reset
    const modalEl = document.getElementById('bookmarkModal');
    modalEl.addEventListener('hidden.bs.modal', () => {
        document.getElementById('bookmark-form').reset();
        document.getElementById('bm-id').value = '';
        document.getElementById('bm-url').readOnly = false;
        document.getElementById('bm-url').classList.remove('bg-light');
        document.getElementById('bookmarkModalTitle').textContent = 'Create Bookmark';
    });

    // Form submit
    document.getElementById('bookmark-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        ui.setLoading('btn-save-bookmark', true);

        const id = document.getElementById('bm-id').value;
        const payload = {
            url: document.getElementById('bm-url').value,
            title: document.getElementById('bm-title').value,
            categoryId: parseInt(document.getElementById('bm-category').value)
        };

        try {
            if (id) {
                // For edit, we must include isFavorite and isArchived (API Rule)
                const existingBm = currentBookmarks.find(b => b.id == id);
                if (existingBm) {
                    payload.isFavorite = existingBm.isFavorite || false;
                    payload.isArchived = existingBm.isArchived || false;
                }
                
                await api.put(`/bookmarks/${id}`, payload);
                ui.showToast('Bookmark updated successfully');
            } else {
                await api.post('/bookmarks', payload);
                ui.showToast('Bookmark created successfully');
            }
            bookmarkModalInstance.hide();
            await loadBookmarks();
        } catch (error) {
            ui.showError(error);
        } finally {
            ui.setLoading('btn-save-bookmark', false, 'Save Bookmark');
        }
    });

    // Filter changes
    const filterIds = ['filter-category', 'filter-sort', 'filter-favorite', 'filter-archived'];
    filterIds.forEach(id => {
        document.getElementById(id).addEventListener('change', () => {
            currentPage = 1;
            updateUrlParams();
            loadBookmarks(); // Trigger API call for server-side filters, or just apply if client side
            // Actually, for Sort we just apply client side.
            if (id === 'filter-sort') {
                applyClientSideSorting();
            }
        });
    });

    // Search input (Debounced)
    const searchInput = document.getElementById('filter-search');
    searchInput.addEventListener('input', utils.debounce(() => {
        currentPage = 1;
        updateUrlParams();
        loadBookmarks();
    }, 500));

    // Clear filters
    document.getElementById('btn-clear-filters').addEventListener('click', () => {
        document.getElementById('filter-search').value = '';
        document.getElementById('filter-category').value = '';
        document.getElementById('filter-sort').value = 'date-desc';
        document.getElementById('filter-favorite').checked = false;
        document.getElementById('filter-archived').checked = false;
        
        updateUrlParams();
        currentPage = 1;
        loadBookmarks();
    });
}

function updateUrlParams() {
    const catId = document.getElementById('filter-category').value;
    const isFav = document.getElementById('filter-favorite').checked;
    const isArch = document.getElementById('filter-archived').checked;
    const search = document.getElementById('filter-search').value.trim();

    utils.setQueryParam('CategoryId', catId || null);
    utils.setQueryParam('IsFavorite', isFav ? 'true' : null);
    utils.setQueryParam('IsArchived', isArch ? 'true' : null);
    utils.setQueryParam('Search', search || null);
}

window.editBookmark = (id) => {
    const bm = currentBookmarks.find(b => b.id == id);
    if (!bm) return;

    document.getElementById('bm-id').value = bm.id;
    document.getElementById('bm-url').value = bm.url;
    document.getElementById('bm-title').value = bm.title;
    document.getElementById('bm-category').value = bm.categoryId;
    
    // URL MUST NOT BE EDITABLE ON UPDATE
    const urlInput = document.getElementById('bm-url');
    urlInput.readOnly = true;
    urlInput.classList.add('bg-light');
    
    document.getElementById('bookmarkModalTitle').textContent = 'Edit Bookmark';
    bookmarkModalInstance.show();
};

window.deleteBookmark = async (id) => {
    if (!confirm('Are you sure you want to delete this bookmark?')) return;

    try {
        await api.delete(`/bookmarks/${id}`);
        ui.showToast('Bookmark deleted successfully');
        loadBookmarks();
    } catch (error) {
        ui.showError(error);
    }
};

window.toggleFavorite = async (id) => {
    const bm = currentBookmarks.find(b => b.id == id);
    if (!bm) return;

    const payload = {
        categoryId: bm.categoryId,
        title: bm.title,
        url: bm.url,
        isFavorite: !bm.isFavorite,
        isArchived: bm.isArchived || false
    };

    try {
        await api.put(`/bookmarks/${id}`, payload);
        bm.isFavorite = !bm.isFavorite; // Optimistic UI update
        applyClientSideSorting(); // Re-render
    } catch (error) {
        ui.showError(error);
    }
};

window.toggleArchive = async (id) => {
    const bm = currentBookmarks.find(b => b.id == id);
    if (!bm) return;

    const payload = {
        categoryId: bm.categoryId,
        title: bm.title,
        url: bm.url,
        isFavorite: bm.isFavorite || false,
        isArchived: !bm.isArchived
    };

    try {
        await api.put(`/bookmarks/${id}`, payload);
        bm.isArchived = !bm.isArchived;
        applyClientSideSorting();
    } catch (error) {
        ui.showError(error);
    }
};

window.exportBookmarks = () => {
    if (currentBookmarks.length === 0) {
        ui.showToast('No bookmarks to export', 'warning');
        return;
    }
    
    // Map to clean structure
    const exportData = currentBookmarks.map(b => ({
        id: b.id,
        title: b.title,
        url: b.url,
        category: categories.find(c => c.id === b.categoryId)?.categoryName || '',
        isFavorite: b.isFavorite,
        isArchived: b.isArchived,
        createdDate: b.createdDate || b.createdAt
    }));
    
    utils.downloadJson(exportData, `linkvault_bookmarks_${new Date().toISOString().split('T')[0]}.json`);
};
