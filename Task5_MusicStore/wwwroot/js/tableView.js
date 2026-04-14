import { fetchSongs, PAGE_SIZE } from './api.js';
import { getParams } from './api.js';
import { playAudio, stopAudio } from './audioPlayer.js';

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
                    <div class="d-flex gap-2 mb-2">
                        <button class="btn btn-sm btn-success" id="play-btn-${song.index}">▶ Play</button>
                        <button class="btn btn-sm btn-danger d-none" id="stop-btn-${song.index}">⏹ Stop</button>
                    </div>
                    <div class="audio-progress d-none" id="progress-${song.index}">
                        <div class="d-flex align-items-center gap-2">
                            <span id="timer-${song.index}" class="text-muted small">0:00</span>
                            <div class="progress flex-grow-1" style="height:6px; cursor:pointer" id="bar-container-${song.index}">
                                <div class="progress-bar bg-success" id="bar-${song.index}" style="width:0%"></div>
                            </div>
                            <span id="duration-${song.index}" class="text-muted small">0:00</span>
                        </div>
                    </div>
                    <p class="mt-2">${song.review}</p>
                </div>
            </div>
        </td>
    `;
    row.after(detail);

    document.getElementById(`play-btn-${song.index}`)
        .addEventListener('click', (e) => playAudio(song.index, song.genre, e.target));

    document.getElementById(`stop-btn-${song.index}`)
        .addEventListener('click', () => stopAudio(song.index));
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