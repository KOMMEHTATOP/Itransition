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
                    <button class="btn btn-sm btn-success mb-2" onclick="playAudio(${song.index}, '${song.genre}', this)">▶ Play</button>
                    <div class="audio-progress mt-1 d-none" id="progress-${song.index}">
                        <div class="d-flex align-items-center gap-2">
                            <span id="timer-${song.index}" class="text-muted small">0:00</span>
                            <div class="progress flex-grow-1" style="height:4px; cursor:pointer">
                                <div class="progress-bar bg-success" id="bar-${song.index}" style="width:0%"></div>
                            </div>
                            <span id="duration-${song.index}" class="text-muted small">0:00</span>
                        </div>
                    </div>
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

async function playAudio(index, genre, btn) {
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
    const res = await fetch(`/api/audio?seed=${p.seed}&locale=${p.locale}&index=${index}&genre=${encodeURIComponent(genre)}`);
    const audioData = await res.json();
    await playNotes(audioData, btn);
}

async function playNotes(audioData, btn) {
    await Tone.start();
    btn.textContent = '⏳ Loading...';

    const reverb = new Tone.Reverb({ decay: 2.0, wet: 0.25 }).toDestination();

    const pianoUrls = {
        "C2": "C2.mp3", "D#2": "Ds2.mp3", "F#2": "Fs2.mp3", "A2": "A2.mp3",
        "C3": "C3.mp3", "D#3": "Ds3.mp3", "F#3": "Fs3.mp3", "A3": "A3.mp3",
        "C4": "C4.mp3", "D#4": "Ds4.mp3", "F#4": "Fs4.mp3", "A4": "A4.mp3",
        "C5": "C5.mp3", "D#5": "Ds5.mp3", "F#5": "Fs5.mp3", "A5": "A5.mp3",
    };

    const guitarUrls = {
        "E2": "E2.mp3", "A2": "A2.mp3", "D3": "D3.mp3", "G3": "G3.mp3",
        "B3": "B3.mp3", "E4": "E4.mp3", "A4": "A4.mp3", "B4": "B4.mp3",
        "E5": "E5.mp3"
    };

    const isPiano = audioData.samplerType !== 'guitar';
    const urls = isPiano ? pianoUrls : guitarUrls;
    const baseUrl = isPiano
        ? "https://tonejs.github.io/audio/salamander/"
        : "https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/acoustic_guitar_nylon-mp3/";

    await new Promise((resolve) => {
        const sampler = new Tone.Sampler({
            urls,
            baseUrl,
            onload: () => resolve(sampler)
        }).connect(reverb);

        activeSynth = {
            dispose: () => {
                sampler.dispose();
                reverb.dispose();
            }
        };
    }).then((sampler) => {
        btn.textContent = '⏹ Stop';

        const now = Tone.now() + 0.1;
        const totalDuration = Math.max(...audioData.notes.map(n => n.time + n.duration));

        // ── DRUMS ──
        if (audioData.hasDrums) {
            const kick = new Tone.MembraneSynth({
                pitchDecay: 0.05,
                octaves: 6,
                envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.1 }
            }).toDestination();
            kick.volume.value = -6;

            const snare = new Tone.NoiseSynth({
                noise: { type: 'white' },
                envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.05 }
            }).toDestination();
            snare.volume.value = -12;

            const prevDispose = activeSynth.dispose;
            activeSynth.dispose = () => {
                prevDispose();
                try { kick.dispose(); } catch(e) {}
                try { snare.dispose(); } catch(e) {}
            };

            const beatDur = 60 / audioData.bpm;
            const totalBeats = Math.floor(totalDuration / beatDur);

            for (let i = 0; i < totalBeats; i++) {
                const t = now + i * beatDur;
                if (i % 4 === 0 || i % 4 === 2) {
                    kick.triggerAttackRelease('C1', '8n', t);
                }
                if (i % 4 === 1 || i % 4 === 3) {
                    snare.triggerAttackRelease('8n', t + 0.001);
                }
            }
        }

        audioData.notes.forEach(n => {
            try {
                sampler.triggerAttackRelease(n.note, n.duration, now + n.time);
            } catch(e) {}
        });

        const progressEl = document.getElementById(`progress-${audioData.index}`);
        const barEl = document.getElementById(`bar-${audioData.index}`);
        const timerEl = document.getElementById(`timer-${audioData.index}`);
        const durationEl = document.getElementById(`duration-${audioData.index}`);

        if (progressEl) {
            progressEl.classList.remove('d-none');
            const fmt = s => `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
            durationEl.textContent = fmt(totalDuration);
            const interval = setInterval(() => {
                if (!activeSynth) { clearInterval(interval); return; }
                const elapsed = Tone.now() - now;
                const pct = Math.min(100, (elapsed / totalDuration) * 100);
                barEl.style.width = pct + '%';
                timerEl.textContent = fmt(Math.min(elapsed, totalDuration));
            }, 200);
        }

        activeTimeout = setTimeout(() => {
            if (activeSynth) {
                const synth = activeSynth;
                activeSynth = null;
                try { synth.dispose(); } catch(e) {}
            }
            btn.textContent = '▶ Play';
            btn.dataset.playing = '';
        }, (totalDuration + 1) * 1000);
    });
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