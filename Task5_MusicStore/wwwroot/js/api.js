const PAGE_SIZE = 20;

export function getParams() {
    return {
        locale: document.getElementById('locale').value,
        seed: document.getElementById('seed').value,
        likes: document.getElementById('likes').value,
    };
}

export async function fetchSongs(page) {
    const p = getParams();
    const url = `/api/songs?locale=${p.locale}&seed=${p.seed}&page=${page}&pageSize=${PAGE_SIZE}&likes=${p.likes}`;
    const res = await fetch(url);
    return await res.json();
}

export async function fetchAudio(index, genre) {
    const p = getParams();
    const res = await fetch(`/api/audio?seed=${p.seed}&locale=${p.locale}&index=${index}&genre=${encodeURIComponent(genre)}`);
    return await res.json();
}

export { PAGE_SIZE };