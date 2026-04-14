import { fetchAudio } from './api.js';
import { audioEngine } from './AudioEngine.js';

let currentIndex = null;

export async function playAudio(index, genre, btn) {
    const playBtn = document.getElementById(`play-btn-${index}`);

    // Нажали на тот же трек
    if (currentIndex === index) {
        if (audioEngine.isStarted) {
            audioEngine.pause();
            if (playBtn) playBtn.textContent = '▶ Play';
        } else if (audioEngine.isPaused) {
            audioEngine.resume();
            if (playBtn) playBtn.textContent = '⏸ Pause';
        }
        return;
    }

    // Останавливаем предыдущий трек
    if (currentIndex !== null) {
        audioEngine.stop();
        _resetButtons(currentIndex);
        hideProgressBar(currentIndex);
    }

    currentIndex = index;
    if (playBtn) playBtn.textContent = '⏳ Loading...';

    const audioData = await fetchAudio(index, genre);
    await Tone.start();
    await audioEngine.load(audioData);

    audioEngine.onStop = () => {
        if (currentIndex === index) {
            _resetButtons(index);
            hideProgressBar(index);
            currentIndex = null;
        }
    };

    audioEngine.onTick = (current, total) => {
        updateProgressBar(index, current, total);
    };

    audioEngine.play();

    if (playBtn) playBtn.textContent = '⏸ Pause';

    const stopBtn = document.getElementById(`stop-btn-${index}`);
    if (stopBtn) stopBtn.classList.remove('d-none');

    showProgressBar(index, audioEngine.duration);
}

export function stopAudio(index) {
    audioEngine.stop();
    _resetButtons(index);
    hideProgressBar(index);
    currentIndex = null;
}

function _resetButtons(index) {
    const playBtn = document.getElementById(`play-btn-${index}`);
    const stopBtn = document.getElementById(`stop-btn-${index}`);
    if (playBtn) { playBtn.textContent = '▶ Play'; playBtn.dataset.playing = ''; }
    if (stopBtn) stopBtn.classList.add('d-none');
}

function showProgressBar(index, duration) {
    const progressEl = document.getElementById(`progress-${index}`);
    if (!progressEl) return;

    progressEl.classList.remove('d-none');
    const durationEl = document.getElementById(`duration-${index}`);
    if (durationEl) durationEl.textContent = fmt(duration);

    const barContainer = document.getElementById(`bar-container-${index}`);
    if (barContainer) {
        const newContainer = barContainer.cloneNode(true);
        barContainer.parentNode.replaceChild(newContainer, barContainer);
        newContainer.addEventListener('click', (e) => {
            const rect = newContainer.getBoundingClientRect();
            const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            audioEngine.seek(pct * audioEngine.duration);
        });
    }
}

function hideProgressBar(index) {
    const progressEl = document.getElementById(`progress-${index}`);
    if (progressEl) {
        progressEl.classList.add('d-none');
        const barEl = document.getElementById(`bar-${index}`);
        if (barEl) barEl.style.width = '0%';
        const timerEl = document.getElementById(`timer-${index}`);
        if (timerEl) timerEl.textContent = '0:00';
    }
}

function updateProgressBar(index, current, total) {
    const barEl = document.getElementById(`bar-${index}`);
    const timerEl = document.getElementById(`timer-${index}`);
    if (barEl) barEl.style.width = `${Math.min(100, (current / total) * 100)}%`;
    if (timerEl) timerEl.textContent = fmt(current);
}

const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;