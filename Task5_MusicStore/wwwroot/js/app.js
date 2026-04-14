import { loadTable, getCurrentPage } from './tableView.js';
import { loadGallery, initInfiniteScroll } from './galleryView.js';

function resetAll() {
    loadTable(1);
    if (!document.getElementById('galleryView').classList.contains('d-none')) {
        loadGallery(true);
    }
}

// ── CONTROLS ──

document.getElementById('locale').addEventListener('change', resetAll);
document.getElementById('seed').addEventListener('input', resetAll);

document.getElementById('likes').addEventListener('input', () => {
    document.getElementById('likesValue').textContent =
        parseFloat(document.getElementById('likes').value).toFixed(1);
    loadTable(getCurrentPage());
    if (!document.getElementById('galleryView').classList.contains('d-none')) {
        loadGallery(true);
    }
});

document.getElementById('randomSeed').addEventListener('click', () => {
    document.getElementById('seed').value = Math.floor(Math.random() * 999999999);
    resetAll();
});

document.getElementById('btnTable').addEventListener('click', () => {
    document.getElementById('tableView').classList.remove('d-none');
    document.getElementById('galleryView').classList.add('d-none');
    document.getElementById('btnTable').classList.add('btn-primary');
    document.getElementById('btnTable').classList.remove('btn-outline-primary');
    document.getElementById('btnGallery').classList.add('btn-outline-primary');
    document.getElementById('btnGallery').classList.remove('btn-primary');
});

document.getElementById('btnGallery').addEventListener('click', () => {
    document.getElementById('galleryView').classList.remove('d-none');
    document.getElementById('tableView').classList.add('d-none');
    document.getElementById('btnGallery').classList.add('btn-primary');
    document.getElementById('btnGallery').classList.remove('btn-outline-primary');
    document.getElementById('btnTable').classList.add('btn-outline-primary');
    document.getElementById('btnTable').classList.remove('btn-primary');
    loadGallery(true);
});

// ── INIT ──
initInfiniteScroll();
loadTable(1);