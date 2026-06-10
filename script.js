document.addEventListener('mousemove', function (event) {
    const star = document.createElement('span');
    star.classList.add('star');
    star.innerText = '💜';
    star.style.left = event.clientX + 'px';
    star.style.top = event.clientY + 'px';
    document.body.appendChild(star);

    setTimeout(() => {
        star.remove();
    }, 800);
});

const appName = "Maloney";
let apiHost = "https://discoveryprovider.audius.co";
let activeTracksList = [];
let currentTrackIndex = -1;
let likedTracks = JSON.parse(localStorage.getItem('likedTracks')) || [];

const audio = document.getElementById('audio-player');
const tracksListContainer = document.getElementById('tracks-list');
const listTitle = document.getElementById('list-title');
const searchInput = document.getElementById('search-input');
const heroBanner = document.getElementById('hero-banner');
const heroTitle = document.getElementById('hero-title');
const heroDesc = document.getElementById('hero-desc');

function initAudius() {
    fetch("https://api.audius.co")
        .then(response => response.json())
        .then(result => {
            if (result.data && result.data.length > 0) {
                apiHost = result.data[0];
            }

            document.getElementById("host-name").innerText = apiHost.replace("https://", "");
            loadTopTracks();
        });
}

function setActiveMenu(activeButtonId) {
    document.querySelectorAll('.menu-item').forEach(button => {
        button.classList.remove('active');
    });

    const activeButton = document.getElementById(activeButtonId);
    if (activeButton) {
        activeButton.classList.add('active');
    }
}

function saveLikedTracks() {
    localStorage.setItem('likedTracks', JSON.stringify(likedTracks));
}

function isTrackLiked(trackId) {
    return likedTracks.some(track => track.id === trackId);
}

function toggleLike(track, event) {
    event.stopPropagation();

    if (isTrackLiked(track.id)) {
        likedTracks = likedTracks.filter(likedTrack => likedTrack.id !== track.id);
    } else {
        likedTracks.unshift(track);
    }

    saveLikedTracks();

    if (document.getElementById('btn-my-tracks').classList.contains('active')) {
        showMyTracks();
    } else {
        displayTracks(activeTracksList);
    }
}

function loadTopTracks() {
    setActiveMenu('btn-home');
    listTitle.innerText = "Популярне зараз 📈";
    const url = apiHost + "/v1/tracks/trending?app_name=" + appName;

    fetch(url)
        .then(response => response.json())
        .then(result => {
            activeTracksList = result.data;
            displayTracks(result.data);
            updateHeroBanner(result.data);
        });
}

function updateHeroBanner(tracks) {
    if (tracks && tracks.length > 0) {
        const topTrack = tracks[0];
        const coverUrl = topTrack.artwork ? topTrack.artwork['480x480'] || topTrack.artwork['150x150'] : '';

        heroTitle.innerText = topTrack.title;
        heroDesc.innerText = "Найактуальніший хіт на платформі сьогодні від автора " + topTrack.user.name + ". Занурюйтесь у справжнє живе звучання!";

        if (coverUrl) {
            heroBanner.style.backgroundImage = "linear-gradient(rgba(27, 12, 43, 0.6), rgba(27, 12, 43, 0.95)), url('" + coverUrl + "')";
        }
    }
}

function searchMusic() {
    const query = searchInput.value.trim();
    if (query === "") return;

    setActiveMenu('btn-search');
    listTitle.innerText = "Результати пошуку для: " + query;
    const url = apiHost + "/v1/tracks/search?query=" + encodeURIComponent(query) + "&app_name=" + appName;

    fetch(url)
        .then(response => response.json())
        .then(result => {
            activeTracksList = result.data;
            displayTracks(result.data);
        });
}

function showMyTracks() {
    setActiveMenu('btn-my-tracks');
    activeTracksList = likedTracks;
    currentTrackIndex = -1;
    listTitle.innerText = "Улюблене";
    displayTracks(likedTracks, "Натисніть сердечко біля треку, і він з'явиться тут 💜");
}

function quickPlayKeyword(keyword) {
    searchInput.value = keyword;
    searchMusic();
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function displayTracks(tracks, emptyMessage = "Нічого не знайдено 😢") {
    tracksListContainer.innerHTML = "";

    if (tracks.length === 0) {
        tracksListContainer.innerHTML = "<li class='empty-tracks'>" + emptyMessage + "</li>";
        return;
    }

    for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i];
        const coverUrl = track.artwork ? track.artwork['150x150'] : '';
        const li = document.createElement("li");
        const likedClass = isTrackLiked(track.id) ? "liked" : "";
        const heartIcon = isTrackLiked(track.id) ? "favorite" : "favorite_border";

        li.className = "track-item";
        li.innerHTML = `
            <div class="track-details">
                <div class="track-pic">
                    ${coverUrl ? `<img src="${coverUrl}" alt="">` : `<span class="material-symbols-outlined" style="font-size: 18px; color: #dcbfc7;">music_note</span>`}
                </div>
                <div class="track-meta">
                    <div class="track-title">${escapeHtml(track.title)}</div>
                    <div class="track-artist">${escapeHtml(track.user.name)}</div>
                </div>
            </div>
            <div class="track-actions">
                <button class="btn-like ${likedClass}" title="Додати в улюблене">
                    <span class="material-symbols-outlined">${heartIcon}</span>
                </button>
                <span class="material-symbols-outlined" style="font-size: 20px; color: #ffb0cb;">play_circle</span>
            </div>
        `;

        li.querySelector('.btn-like').onclick = function (event) {
            toggleLike(track, event);
        };

        li.onclick = function () {
            currentTrackIndex = i;
            playSong(track);
        };

        tracksListContainer.appendChild(li);
    }
}

function playSong(track) {
    const streamUrl = apiHost + "/v1/tracks/" + track.id + "/stream?app_name=" + appName;
    const coverUrl = track.artwork ? track.artwork['150x150'] : '';

    document.getElementById("player-title").innerText = track.title;
    document.getElementById("player-artist").innerText = track.user.name;

    const coverImg = document.getElementById("player-cover");
    const coverPlaceholder = document.getElementById("player-placeholder-art");

    if (coverUrl) {
        coverImg.src = coverUrl;
        coverImg.style.display = "block";
        coverPlaceholder.style.display = "none";
    } else {
        coverImg.style.display = "none";
        coverPlaceholder.style.display = "flex";
    }

    audio.src = streamUrl;
    audio.play();
    document.getElementById("play-icon").innerText = "pause";
}

function playFeaturedSong() {
    if (activeTracksList.length > 0) {
        currentTrackIndex = 0;
        playSong(activeTracksList[0]);
    }
}

function togglePlay() {
    if (audio.paused) {
        audio.play();
        document.getElementById("play-icon").innerText = "pause";
    } else {
        audio.pause();
        document.getElementById("play-icon").innerText = "play_arrow";
    }
}

function playNext() {
    if (activeTracksList.length === 0) return;

    currentTrackIndex++;
    if (currentTrackIndex >= activeTracksList.length) {
        currentTrackIndex = 0;
    }

    playSong(activeTracksList[currentTrackIndex]);
}

function playPrev() {
    if (activeTracksList.length === 0) return;

    currentTrackIndex--;
    if (currentTrackIndex < 0) {
        currentTrackIndex = activeTracksList.length - 1;
    }

    playSong(activeTracksList[currentTrackIndex]);
}

audio.addEventListener('timeupdate', function () {
    if (isNaN(audio.duration)) return;

    document.getElementById("current-time").innerText = formatSeconds(audio.currentTime);
    document.getElementById("total-time").innerText = formatSeconds(audio.duration);

    const pct = (audio.currentTime / audio.duration) * 100;
    document.getElementById("progress-fill").style.width = pct + "%";
});

audio.addEventListener('ended', function () {
    playNext();
});

function seekAudio(event) {
    if (isNaN(audio.duration)) return;

    const bar = event.currentTarget;
    const clickX = event.clientX - bar.getBoundingClientRect().left;
    const percentage = clickX / bar.clientWidth;

    audio.currentTime = percentage * audio.duration;
}

function seekVolume(event) {
    const bar = event.currentTarget;
    const clickX = event.clientX - bar.getBoundingClientRect().left;
    let pct = clickX / bar.clientWidth;

    if (pct < 0) pct = 0;
    if (pct > 1) pct = 1;

    audio.volume = pct;
    document.getElementById("volume-fill").style.width = (pct * 100) + "%";
}

function formatSeconds(seconds) {
    if (isNaN(seconds)) return "0:00";

    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return m + ":" + s;
}

function focusSearch() {
    setActiveMenu('btn-search');
    searchInput.focus();
}

function copyCurrentLink() {
    if (currentTrackIndex === -1) return;

    const track = activeTracksList[currentTrackIndex];
    const streamUrl = apiHost + "/v1/tracks/" + track.id + "/stream?app_name=" + appName;

    const dummy = document.createElement('input');
    document.body.appendChild(dummy);
    dummy.value = streamUrl;
    dummy.select();
    document.execCommand('copy');
    document.body.removeChild(dummy);

    const toast = document.getElementById("toast-message");
    toast.style.display = "block";
    setTimeout(function () {
        toast.style.display = "none";
    }, 2500);
}

initAudius();
