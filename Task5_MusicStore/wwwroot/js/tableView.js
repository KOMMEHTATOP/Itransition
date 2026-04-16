import { fetchSongs, PAGE_SIZE } from './api.js';
import { getParams } from './api.js';

let currentPage = 1;
let totalPages = 1;

export function getCurrentPage() { return currentPage; }

export async function loadTable(page) {
    currentPage = page;
    const data = await fetchSongs(page);
    totalPages = Math.ceil(500 / PAGE_SIZE);
    renderTable(data.songs);
    renderPagination();
}

function renderTable(songs) {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';
    songs.forEach(song => {
        const row = document.createElement('tr');
        row.style.cursor = 'pointer';
        row.innerHTML = `
            <td>${song.index}</td>
            <td>${song.title}</td>
            <td>${song.artist}</td>
            <td>${song.album}</td>
            <td>${song.genre}</td>
            <td>${'♥'.repeat(song.likes)}</td>
        `;
        row.addEventListener('click', () => toggleExpand(row, song));
        tbody.appendChild(row);
    });
}

function toggleExpand(row, song) {
    const existingDetail = row.nextElementSibling;
    if (existingDetail && existingDetail.classList.contains('detail-row')) {
        existingDetail.remove();
        return;
    }

    const p = getParams();
    const streamUrl = `/api/stream?seed=${p.seed}&locale=${p.locale}&index=${song.index}&genre=${encodeURIComponent(song.genre)}`;
    const downloadUrl = `/api/stream/download?seed=${p.seed}&locale=${p.locale}&index=${song.index}&genre=${encodeURIComponent(song.genre)}&title=${encodeURIComponent(song.title)}&artist=${encodeURIComponent(song.artist)}&album=${encodeURIComponent(song.album)}`;

    const detail = document.createElement('tr');
    detail.classList.add('detail-row');
    detail.innerHTML = `
        <td colspan="6">
            <div class="d-flex gap-4 p-3 bg-light rounded">
                <img src="/api/cover?seed=${p.seed}&locale=${p.locale}&index=${song.index}"
                     width="160" height="160" style="border-radius:8px; object-fit:cover"/>
                <div class="flex-grow-1">
                    <h5>${song.title}</h5>
                    <p class="text-muted mb-1">${song.artist} — ${song.album}</p>
                    <p class="text-muted mb-2"><em>${song.genre}</em></p>
                    <audio controls class="w-100 mb-2" id="audio-${song.index}">
                        <source src="${streamUrl}" type="audio/mpeg">
                    </audio>
                    <a href="${downloadUrl}" class="btn btn-sm btn-outline-secondary mb-2" download>
                        ⬇ Download MP3
                    </a>
                    <ul class="nav nav-tabs mt-2" id="tabs-${song.index}">
                        <li class="nav-item">
                            <a class="nav-link active" href="#" data-tab="review" data-index="${song.index}">Review</a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="#" data-tab="lyrics" data-index="${song.index}">Lyrics</a>
                        </li>
                    </ul>
                    <div id="tab-review-${song.index}" class="tab-content-panel mt-2">
                        <p>${song.review}</p>
                    </div>
                    <div id="tab-lyrics-${song.index}" class="tab-content-panel mt-2 d-none">
                        <div id="lyrics-container-${song.index}" class="lyrics-container">
                            <p class="text-muted">Press Play to load lyrics...</p>
                        </div>
                    </div>
                </div>
            </div>
        </td>
    `;
    row.after(detail);

    detail.querySelectorAll('[data-tab]').forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            const idx = tab.dataset.index;
            const tabName = tab.dataset.tab;

            detail.querySelectorAll('[data-tab]').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            detail.querySelectorAll('.tab-content-panel').forEach(p => p.classList.add('d-none'));
            document.getElementById(`tab-${tabName}-${idx}`).classList.remove('d-none');

            if (tabName === 'lyrics') {
                loadLyrics(song, detail);
            }
        });
    });

    const audio = document.getElementById(`audio-${song.index}`);
    audio.addEventListener('timeupdate', () => {
        updateLyrics(song.index, audio.currentTime);
    });
}

async function loadLyrics(song, detail) {
    const container = document.getElementById(`lyrics-container-${song.index}`);
    if (!container || container.dataset.loaded) return;

    const p = getParams();
    const res = await fetch(`/api/lyrics?seed=${p.seed}&index=${song.index}&locale=${p.locale}&duration=30`);
    const lines = await res.json();

    container.dataset.loaded = 'true';
    container.innerHTML = lines.map((line, i) =>
        `<p class="lyrics-line mb-1" id="lyric-${song.index}-${i}" data-start="${line.startTime}" data-end="${line.endTime}">${line.text}</p>`
    ).join('');
}

const activeLyricMap = {};

function updateLyrics(songIndex, currentTime) {
    const container = document.getElementById(`lyrics-container-${songIndex}`);
    if (!container || !container.dataset.loaded) return;

    const lines = container.querySelectorAll('.lyrics-line');
    let newActiveId = null;

    lines.forEach(line => {
        const start = parseFloat(line.dataset.start);
        const end = parseFloat(line.dataset.end);
        const isActive = currentTime >= start && currentTime < end;

        line.classList.toggle('active-lyric', isActive);
        line.style.fontWeight = isActive ? 'bold' : '';
        line.style.color = isActive ? '#0d6efd' : '';

        if (isActive) newActiveId = line.id;
    });

    if (newActiveId && activeLyricMap[songIndex] !== newActiveId) {
        activeLyricMap[songIndex] = newActiveId;
        const activeLine = document.getElementById(newActiveId);
        if (activeLine) {
            const containerRect = container.getBoundingClientRect();
            const lineRect = activeLine.getBoundingClientRect();
            const lineRelativeTop = lineRect.top - containerRect.top + container.scrollTop;
            const lineRelativeBottom = lineRelativeTop + activeLine.offsetHeight;
            const containerHeight = container.offsetHeight;

            if (lineRelativeTop < container.scrollTop || lineRelativeBottom > container.scrollTop + containerHeight) {
                container.scrollTop = lineRelativeTop - containerHeight / 2;
            }
        }
    }
}

function renderPagination() {
    const nav = document.getElementById('pagination');
    nav.innerHTML = '';

    const maxVisible = 5;
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);

    const addBtn = (label, page, disabled = false, active = false) => {
        const li = document.createElement('li');
        li.className = `page-item ${disabled ? 'disabled' : ''} ${active ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#">${label}</a>`;
        if (!disabled) li.addEventListener('click', e => { e.preventDefault(); loadTable(page); });
        nav.appendChild(li);
    };

    addBtn('«', 1, currentPage === 1);
    addBtn('‹', currentPage - 1, currentPage === 1);
    for (let i = start; i <= end; i++) addBtn(i, i, false, i === currentPage);
    addBtn('›', currentPage + 1, currentPage === totalPages);
    addBtn('»', totalPages, currentPage === totalPages);
}