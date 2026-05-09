let currentBookmark = null;
let currentNotes = [];
let bookmarkId = null;

document.addEventListener('DOMContentLoaded', async () => {
    bookmarkId = utils.getQueryParam('id');
    
    if (!bookmarkId) {
        window.location.href = 'bookmarks.html';
        return;
    }

    await loadDetails();
    await loadNotes();
    setupEventListeners();
});

async function loadDetails() {
    const container = document.getElementById('bm-details-container');
    try {
        currentBookmark = await api.get(`/bookmarks/${bookmarkId}`);
        renderDetails();
    } catch (error) {
        ui.showError(error);
        container.innerHTML = `<div class="alert alert-danger">Failed to load bookmark details.</div>`;
    }
}

function renderDetails() {
    if (!currentBookmark) return;

    const bm = currentBookmark;
    const container = document.getElementById('bm-details-container');
    const badgesContainer = document.getElementById('bm-badges');

    // Badges
    let badgesHtml = '';
    if (bm.isFavorite) {
        badgesHtml += `<span class="badge badge-soft-warning me-1"><i class="bi bi-star-fill"></i> Favorite</span>`;
    }
    if (bm.isArchived) {
        badgesHtml += `<span class="badge badge-soft-secondary"><i class="bi bi-archive"></i> Archived</span>`;
    }
    badgesContainer.innerHTML = badgesHtml;

    // Details
    const title = utils.escapeHtml(bm.title || 'Untitled');
    const url = utils.escapeHtml(bm.url || '#');
    // We might need to fetch the category name if the API only returns categoryId, 
    // but often GET /{id} includes navigation properties. We'll show ID or Name.
    const catName = bm.category ? bm.category.categoryName : (bm.categoryName || `Category #${bm.categoryId}`);

    container.innerHTML = `
        <h4 class="mb-3">${title}</h4>
        <div class="mb-3">
            <label class="text-muted small fw-bold text-uppercase">URL</label>
            <div class="text-break">
                <a href="${url}" target="_blank" rel="noopener noreferrer">${url} <i class="bi bi-box-arrow-up-right ms-1"></i></a>
            </div>
        </div>
        <div class="mb-3">
            <label class="text-muted small fw-bold text-uppercase">Category</label>
            <div><span class="badge badge-soft-primary">${utils.escapeHtml(catName)}</span></div>
        </div>
    `;

    document.getElementById('bm-created').textContent = utils.formatDate(bm.createdDate || bm.createdAt);
}

async function loadNotes() {
    const container = document.getElementById('notes-container');
    container.innerHTML = ui.getSpinner();

    try {
        currentNotes = await api.get(`/bookmarks/${bookmarkId}/notes`);
        renderNotes();
    } catch (error) {
        ui.showError(error);
        container.innerHTML = `<div class="alert alert-danger">Failed to load notes.</div>`;
    }
}

function renderNotes() {
    const container = document.getElementById('notes-container');
    
    // Update count
    document.getElementById('bm-note-count').textContent = currentNotes.length;

    if (!currentNotes || currentNotes.length === 0) {
        container.innerHTML = `
            <div class="text-center p-4 text-muted border border-lv rounded bg-surface">
                <i class="bi bi-journal-x fs-1 mb-2 d-block opacity-50"></i>
                <p class="mb-0">No notes attached yet.</p>
            </div>
        `;
        return;
    }

    let html = '<div class="list-group list-group-flush border-top-0">';
    
    currentNotes.forEach(note => {
        const date = utils.formatDate(note.createdDate || note.createdAt);
        html += `
            <div class="list-group-item bg-transparent px-0 py-3">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="pe-3 flex-grow-1" style="white-space: pre-wrap;">${utils.escapeHtml(note.content)}</div>
                    <button class="btn btn-sm text-danger btn-link p-0 text-decoration-none" onclick="deleteNote(${note.id})" title="Delete Note">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
                ${date ? `<div class="text-muted small mt-2">${date}</div>` : ''}
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

function setupEventListeners() {
    document.getElementById('note-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        ui.setLoading('btn-save-note', true, 'Add Note');

        const content = document.getElementById('note-content').value;

        try {
            await api.post(`/bookmarks/${bookmarkId}/notes`, { content });
            document.getElementById('note-content').value = '';
            ui.showToast('Note added');
            await loadNotes();
        } catch (error) {
            ui.showError(error);
        } finally {
            ui.setLoading('btn-save-note', false, 'Add Note');
        }
    });
}

window.deleteNote = async (id) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
        await api.delete(`/bookmarks/${bookmarkId}/notes/${id}`);
        ui.showToast('Note deleted');
        await loadNotes();
    } catch (error) {
        ui.showError(error);
    }
};
