class AudioEngine {
    constructor() {
        this.sampler = null;
        this.part = null;
        this.drumPart = null;
        this.kick = null;
        this.snare = null;
        this.reverb = null;
        this.currentTrackData = null;
        this.samplerCache = {};
        this.onStop = null;
        this.onTick = null;
        this.onPause = null;
        this.onResume = null;
        this.tickInterval = null;
    }

    async load(audioData) {
        this.stop();
        this.currentTrackData = audioData;

        if (!this.reverb) {
            this.reverb = new Tone.Reverb({ decay: 2.0, wet: 0.25 }).toDestination();
            await this.reverb.ready;
        }

        const isPiano = audioData.samplerType !== 'guitar';
        this.sampler = await this._getSampler(isPiano);
        return this;
    }

    play() {
        if (!this.currentTrackData || !this.sampler) return;

        const data = this.currentTrackData;
        Tone.Transport.bpm.value = data.bpm;

        this.part = new Tone.Part((time, note) => {
            try {
                this.sampler.triggerAttackRelease(note.note, note.duration, time);
            } catch(e) {}
        }, data.notes.map(n => [n.time, n]));

        this.part.start(0);

        if (data.hasDrums) {
            this._setupDrums(data);
        }

        Tone.Transport.start();
        this._startTick();
    }

    pause() {
        Tone.Transport.pause();
        this._stopTick();
        if (this.onPause) this.onPause();
    }

    resume() {
        Tone.Transport.start();
        this._startTick();
        if (this.onResume) this.onResume();
    }

    stop() {
        Tone.Transport.stop();
        Tone.Transport.cancel();

        if (this.part) { try { this.part.dispose(); } catch(e) {} this.part = null; }
        if (this.drumPart) { try { this.drumPart.dispose(); } catch(e) {} this.drumPart = null; }
        if (this.kick) { try { this.kick.dispose(); } catch(e) {} this.kick = null; }
        if (this.snare) { try { this.snare.dispose(); } catch(e) {} this.snare = null; }

        this._stopTick();
        if (this.onStop) this.onStop();
    }

    seek(seconds) {
        Tone.Transport.seconds = Math.max(0, Math.min(seconds, this.duration));
        if (this.onTick) this.onTick(Tone.Transport.seconds, this.duration);
    }

    get duration() {
        if (!this.currentTrackData) return 0;
        return Math.max(...this.currentTrackData.notes.map(n => n.time + n.duration));
    }

    get currentTime() {
        return Tone.Transport.seconds;
    }

    get isStarted() {
        return Tone.Transport.state === 'started';
    }

    get isPaused() {
        return Tone.Transport.state === 'paused';
    }

    _setupDrums(data) {
        this.kick = new Tone.MembraneSynth({
            pitchDecay: 0.05,
            octaves: 6,
            envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.1 }
        }).toDestination();
        this.kick.volume.value = -6;

        this.snare = new Tone.NoiseSynth({
            noise: { type: 'white' },
            envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.05 }
        }).toDestination();
        this.snare.volume.value = -12;

        const beatDur = 60 / data.bpm;
        const drumEvents = [];

        for (let i = 0; i * beatDur < this.duration; i++) {
            const t = i * beatDur;
            if (i % 4 === 0 || i % 4 === 2) drumEvents.push([t, { type: 'kick' }]);
            if (i % 4 === 1 || i % 4 === 3) drumEvents.push([t + 0.001, { type: 'snare' }]);
        }

        this.drumPart = new Tone.Part((time, event) => {
            try {
                if (event.type === 'kick') this.kick.triggerAttackRelease('C1', '8n', time);
                else this.snare.triggerAttackRelease('8n', time);
            } catch(e) {}
        }, drumEvents);

        this.drumPart.start(0);
    }

    _startTick() {
        this._stopTick();
        this.tickInterval = setInterval(() => {
            const t = Tone.Transport.seconds;
            const dur = this.duration;
            if (this.onTick) this.onTick(t, dur);
            if (t >= dur) this.stop();
        }, 100);
    }

    _stopTick() {
        if (this.tickInterval) {
            clearInterval(this.tickInterval);
            this.tickInterval = null;
        }
    }

    async _getSampler(isPiano) {
        const key = isPiano ? 'piano' : 'guitar';
        if (this.samplerCache[key]) {
            this.samplerCache[key].connect(this.reverb);
            return this.samplerCache[key];
        }

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

        const urls = isPiano ? pianoUrls : guitarUrls;
        const baseUrl = isPiano
            ? "https://tonejs.github.io/audio/salamander/"
            : "https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/acoustic_guitar_nylon-mp3/";

        return new Promise((resolve) => {
            const sampler = new Tone.Sampler({
                urls, baseUrl,
                onload: () => {
                    this.samplerCache[key] = sampler;
                    resolve(sampler);
                }
            }).connect(this.reverb);
        });
    }
}

export const audioEngine = new AudioEngine();