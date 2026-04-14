import { fetchSongs } from './api.js';
import { getParams } from './api.js';

let galleryPage = 1;
let galleryLoading = false;
let galleryExhausted = false;

export async function loadGallery(reset = false) {
    if (reset) {
        galleryPage = 1;
        galleryExhausted = false;
        document.getElementById('galleryGrid').innerHTML = '';
    }
    if (galleryLoading || galleryExhausted) return;
    galleryLoading = true;
    document.getElementById('galleryLoader').classList.remove('d-none');

    const data = await fetchSongs(galleryPage);
    renderGalleryCards(data.songs);

    if (data.songs.length < 20) galleryExhausted = true;
    galleryPage++;
    galleryLoading = false;
    document.getElementById('galleryLoader').classList.add('d-none');
}

function renderGalleryCards(songs) {
    const grid = document.getElementById('galleryGrid');
    const p = getParams();
    songs.forEach(song => {
        const col = document.createElement('div');
        col.className = 'col';
        col.innerHTML = `
            <div class="card h-100">
                <img src="/api/cover?seed=${p.seed}&locale=${p.locale}&index=${song.index}"
                     class="card-img-top" style="height:160px;object-fit:cover"/>
                <div class="card-body p-2">
                    <h6 class="card-title mb-0">${song.title}</h6>
                    <small class="text-muted">${song.artist}</small><br/>
                    <small class="text-muted">${song.genre}</small><br/>
                    <small>${'♥'.repeat(song.likes)}</small>
                </div>
            </div>
        `;
        grid.appendChild(col);
    });
}

export function initInfiniteScroll() {
    const observer = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) loadGallery();
    }, { threshold: 0.1 });
    observer.observe(document.getElementById('galleryLoader'));
}