let currentPage = 1;
let totalPages = 1;
let galleryPage = 1;
let galleryLoading = false;
let galleryExhausted = false;
let activeSynth = null;
let activeTimeout = null;
const PAGE_SIZE = 20;

function getParams() {
    return {
        locale: document.getElementById('locale').value,
        seed: document.getElementById('seed').value,
        likes: document.getElementById('likes').value,
    };
}

async function fetchSongs(page) {
    const p = getParams();
    const url = `/api/songs?locale=${p.locale}&seed=${p.seed}&page=${page}&pageSize=${PAGE_SIZE}&likes=${p.likes}`;
    const res = await fetch(url);
    return await res.json();
}

// ── TABLE VIEW ──

async function loadTable(page) {
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

    const detail = document.createElement('tr');
    detail.classList.add('detail-row');
    detail.innerHTML = `
        <td colspan="6">
            <div class="d-flex gap-4 p-3 bg-light rounded">
                <img src="/api/cover?seed=${document.getElementById('seed').value}&locale=${document.getElementById('locale').value}&index=${song.index}" 
                     width="160" height="160" style="border-radius:8px; object-fit:cover"/>
                <div>
                    <h5>${song.title}</h5>
                    <p class="text-muted mb-1">${song.artist} — ${song.album}</p>
                    <p class="text-muted mb-2"><em>${song.genre}</em></p>
                    <button class="btn btn-sm btn-success mb-2" onclick="playAudio(${song.index}, this)">▶ Play</button>
                    <p>${song.review}</p>
                </div>
            </div>
        </td>
    `;
    row.after(detail);
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

// ── GALLERY VIEW ──

async function loadGallery(reset = false) {
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

    if (data.songs.length < PAGE_SIZE) galleryExhausted = true;
    galleryPage++;
    galleryLoading = false;
    document.getElementById('galleryLoader').classList.add('d-none');
}

function renderGalleryCards(songs) {
    const grid = document.getElementById('galleryGrid');
    const seed = document.getElementById('seed').value;
    const locale = document.getElementById('locale').value;
    songs.forEach(song => {
        const col = document.createElement('div');
        col.className = 'col';
        col.innerHTML = `
            <div class="card h-100">
                <img src="/api/cover?seed=${seed}&locale=${locale}&index=${song.index}" class="card-img-top" style="height:160px;object-fit:cover"/>
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

// ── INFINITE SCROLL ──

const observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) loadGallery();
}, { threshold: 0.1 });

observer.observe(document.getElementById('galleryLoader'));

// ── AUDIO ──

async function playAudio(index, btn) {
    // Если уже играет — останавливаем
    if (activeSynth) {
        clearTimeout(activeTimeout);
        const synth = activeSynth;
        activeSynth = null;
        try { synth.dispose(); } catch(e) {}
        document.querySelectorAll('[data-playing="true"]').forEach(b => {
            b.textContent = '▶ Play';
            b.dataset.playing = '';
        });
        return; // всегда останавливаем, не перезапускаем
    }

    btn.textContent = '⏹ Stop';
    btn.dataset.playing = 'true';

    const p = getParams();
    const res = await fetch(`/api/audio?seed=${p.seed}&locale=${p.locale}&index=${index}`);
    const audioData = await res.json();
    await playNotes(audioData, btn);
}

async function playNotes(audioData, btn) {
    await Tone.start();

    const reverb = new Tone.Reverb({ decay: 2.5, wet: 0.3 }).toDestination();
    const delay = new Tone.FeedbackDelay("8n", 0.2).toDestination();

    const melody = new Tone.Synth({
        oscillator: { type: 'fmsine' },
        envelope: { attack: 0.04, decay: 0.2, sustain: 0.6, release: 1.2 }
    }).connect(reverb).connect(delay);
    melody.volume.value = -4;

    const chords = new Tone.Synth({
        oscillator: { type: 'amtriangle' },
        envelope: { attack: 0.08, decay: 0.3, sustain: 0.4, release: 2.0 }
    }).connect(reverb);
    chords.volume.value = -12;

    const bass = new Tone.Synth({
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.02, decay: 0.4, sustain: 0.5, release: 0.8 }
    }).toDestination();
    bass.volume.value = -8;

    const disposeAll = () => {
        try { melody.dispose(); } catch(e) {}
        try { chords.dispose(); } catch(e) {}
        try { bass.dispose(); } catch(e) {}
        try { reverb.dispose(); } catch(e) {}
        try { delay.dispose(); } catch(e) {}
    };

    activeSynth = { dispose: disposeAll };

    const now = Tone.now() + 0.1;

    audioData.notes.forEach(n => {
        try {
            if (n.instrument === 'melody') {
                melody.triggerAttackRelease(n.note, n.duration, now + n.time);
            } else if (n.instrument === 'chord') {
                chords.triggerAttackRelease(n.note, n.duration, now + n.time);
            } else if (n.instrument === 'bass') {
                bass.triggerAttackRelease(n.note, n.duration, now + n.time);
            }
        } catch (e) {}
    });

    const totalDuration = Math.max(...audioData.notes.map(n => n.time + n.duration));
    activeTimeout = setTimeout(() => {
        if (activeSynth) {
            const synth = activeSynth;
            activeSynth = null;
            try { synth.dispose(); } catch(e) {}
        }
        btn.textContent = '▶ Play';
        btn.dataset.playing = '';
    }, (totalDuration + 1) * 1000);
}

// ── CONTROLS ──

function resetAll() {
    loadTable(1);
    if (!document.getElementById('galleryView').classList.contains('d-none')) {
        loadGallery(true);
    }
}

document.getElementById('locale').addEventListener('change', resetAll);
document.getElementById('seed').addEventListener('input', resetAll);
document.getElementById('likes').addEventListener('input', () => {
    document.getElementById('likesValue').textContent = parseFloat(document.getElementById('likes').value).toFixed(1);
    loadTable(currentPage);
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
loadTable(1);