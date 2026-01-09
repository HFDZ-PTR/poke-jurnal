// KONSTANTA DAN VARIABEL GLOBAL

const API_URL = 'https://pokeapi.co/api/v2';
// Batas jumlah Pokemon yang ditampilkan per batch
const displayLimit = 50;
// Array untuk menyimpan semua data Pokemon yang telah dimuat
let allPokemon = [];
// Jumlah Pokemon yang sudah ditampilkan di grid
let displayedCount = 0;
// Flag untuk menandai apakah sedang loading data
let isLoading = false;
// Array untuk menyimpan tipe-tipe Pokemon yang dipilih untuk filter
let selectedTypes = [];
// Daftar semua tipe Pokemon yang tersedia
const pokemonTypes = [
    'normal', 'fire', 'water', 'grass', 'electric', 'ice', 'fighting', 'poison',
    'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'
];

// ==========================================
// REFERENSI ELEMEN DOM
// ==========================================

// Elemen-elemen DOM yang digunakan dalam aplikasi
const pokemonGrid = document.getElementById('pokemonGrid');
const searchInput = document.getElementById('searchInput');
const loadMoreBtn = document.getElementById('loadMore');
const typeFilter = document.getElementById('typeFilter');
const generationFilter = document.getElementById('generationFilter');
const mainPage = document.getElementById('mainPage');
const detailPage = document.getElementById('detailPage');
const backBtn = document.getElementById('backBtn');
const hoverPopup = document.getElementById('hoverPopup');
const hoverContent = document.getElementById('hoverContent');
const detailContent = document.getElementById('detailContent');

// Tooltip untuk efek move
const moveTooltip = document.createElement('div');
moveTooltip.id = 'moveTooltip';
moveTooltip.className = 'move-tooltip';
moveTooltip.style.position = 'fixed';
moveTooltip.style.pointerEvents = 'none';
moveTooltip.style.padding = '8px 10px';
moveTooltip.style.background = 'rgba(0, 0, 0, 0.8)';
moveTooltip.style.color = '#fff';
moveTooltip.style.borderRadius = '6px';
moveTooltip.style.fontSize = '12px';
moveTooltip.style.maxWidth = '260px';
moveTooltip.style.display = 'none';
document.body.appendChild(moveTooltip);

// Flag untuk menandai apakah sedang hover pada kartu Pokemon
let isHoveringCard = false;

// Filter generasi
let selectedGenerations = [];
const generationRanges = [
    { label: 'Generation I', min: 1, max: 151 },
    { label: 'Generation II', min: 152, max: 251 },
    { label: 'Generation III', min: 252, max: 386 },
    { label: 'Generation IV', min: 387, max: 493 },
    { label: 'Generation V', min: 494, max: 649 },
    { label: 'Generation VI', min: 650, max: 721 },
    { label: 'Generation VII', min: 722, max: 809 },
    { label: 'Generation VIII', min: 810, max: 898 },
    { label: 'Generation IX', min: 899, max: 1010 }
];

// ==========================================
// INISIALISASI APLIKASI
// ==========================================

// Inisialisasi aplikasi: memuat data Pokemon, mengatur filter tipe, dan routing
loadAndDisplayPokemon();
initializeTypeFilters();
initializeGenerationFilters();
setupRouting();

// ==========================================
// EVENT LISTENERS
// ==========================================

// Event listener untuk pencarian Pokemon
searchInput.addEventListener('input', handleSearch);
// Event listener untuk tombol load more
loadMoreBtn.addEventListener('click', loadMoreDisplay);

// Event listener untuk tombol kembali ke halaman utama
backBtn.addEventListener('click', () => {
    mainPage.style.display = 'block';
    detailPage.style.display = 'none';
    window.history.pushState(null, '', window.location.origin + window.location.pathname.split('/pokemon')[0]);

    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Event listener untuk menggerakkan popup hover mengikuti mouse
document.addEventListener('mousemove', (e) => {
    if (isHoveringCard) {
        hoverPopup.style.left = (e.clientX + 15) + 'px';
        hoverPopup.style.top = (e.clientY - 150) + 'px';
    }
});

// Event listener untuk menangani navigasi browser (back/forward)
window.addEventListener('popstate', setupRouting);

// ==========================================
// FUNGSI ROUTING
// ==========================================

function setupRouting() {
    const path = window.location.pathname;
    const searchParams = new window.URLSearchParams(window.location.search);
    const pokemonPath = searchParams.get('/'); // Untuk handle redirect dari 404.html
    
    if (pokemonPath && pokemonPath.startsWith('pokemon/')) {
        const pokemonName = decodeURIComponent(pokemonPath.split('/')[1]);
        const pokemon = allPokemon.find(p => p.name.toLowerCase() === pokemonName.toLowerCase());
        if (pokemon) {
            showDetailPage(pokemon);
        }
    } else {
        mainPage.style.display = 'block';
        detailPage.style.display = 'none';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// ==========================================
// FUNGSI FILTER TIPE POKEMON
// ==========================================

// Fungsi untuk membuat tombol filter berdasarkan tipe Pokemon
function initializeTypeFilters() {
    pokemonTypes.forEach(type => {
        const btn = document.createElement('button');
        btn.className = `filter-btn type-${type}`;
        btn.textContent = type;
        btn.addEventListener('click', () => toggleTypeFilter(type, btn));
        typeFilter.appendChild(btn);
    });
}

// Fungsi untuk membuat tombol filter berdasarkan generasi Pokemon
function initializeGenerationFilters() {
    generationRanges.forEach(range => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn generation-btn';
        btn.textContent = range.label;
        btn.addEventListener('click', () => toggleGenerationFilter(range.label, btn));
        generationFilter.appendChild(btn);
    });
}

// Fungsi untuk toggle filter tipe Pokemon
function toggleTypeFilter(type, btn) {
    if (selectedTypes.includes(type)) {
        selectedTypes = selectedTypes.filter(t => t !== type);
        btn.classList.remove('active');
    } else {
        selectedTypes.push(type);
        btn.classList.add('active');
    }
    
    pokemonGrid.innerHTML = '';
    displayedCount = 0;
    loadMoreDisplay();
}

// Fungsi untuk toggle filter generasi Pokemon
function toggleGenerationFilter(label, btn) {
    if (selectedGenerations.includes(label)) {
        selectedGenerations = selectedGenerations.filter(g => g !== label);
        btn.classList.remove('active');
    } else {
        selectedGenerations.push(label);
        btn.classList.add('active');
    }

    pokemonGrid.innerHTML = '';
    displayedCount = 0;
    loadMoreDisplay();
}

function isInSelectedGeneration(pokemonId) {
    if (selectedGenerations.length === 0) {
        return true;
    }

    const generation = generationRanges.find(range => pokemonId >= range.min && pokemonId <= range.max);
    return generation ? selectedGenerations.includes(generation.label) : false;
}

// ==========================================
// FUNGSI PEMUATAN DATA POKEMON
// ==========================================

// Fungsi untuk memuat semua data Pokemon dari API dan menampilkannya
async function loadAndDisplayPokemon() {
    isLoading = true;
    
    try {
        const countResponse = await fetch(`${API_URL}/pokemon?limit=1`);
        const countData = await countResponse.json();
        const totalCount = countData.count;
        
        const batchSize = 100;
        for (let offset = 0; offset < totalCount; offset += batchSize) {
            const response = await fetch(
                `${API_URL}/pokemon?offset=${offset}&limit=${batchSize}`
            );
            const data = await response.json();
            
            const pokemonPromises = data.results.map(pokemon => 
                fetch(pokemon.url).then(r => r.json())
            );
            
            const pokemonDetails = await Promise.all(pokemonPromises);
            allPokemon.push(...pokemonDetails);
            
            if (offset === 0) {
                loadMoreDisplay();
            }
        }
    } catch (error) {
        console.error('Error loading Pokémon:', error);
    } finally {
        isLoading = false;
    }
}

// ==========================================
// FUNGSI TAMPILAN GRID POKEMON
// ==========================================

// Fungsi untuk menampilkan batch berikutnya dari Pokemon yang sudah di filter
function loadMoreDisplay() {
    let pokemonToDisplay = allPokemon;

    if (selectedGenerations.length > 0) {
        pokemonToDisplay = pokemonToDisplay.filter(pokemon => isInSelectedGeneration(pokemon.id));
    }

    if (selectedTypes.length > 0) {
        pokemonToDisplay = pokemonToDisplay.filter(pokemon => {
            return selectedTypes.every(type =>
                pokemon.types.some(t => t.type.name === type)
            );
        });
    }

    const nextBatch = pokemonToDisplay.slice(displayedCount, displayedCount + displayLimit);
    
    if (nextBatch.length === 0) {
        loadMoreBtn.style.display = 'none';
        return;
    }
    
    nextBatch.forEach(pokemon => {
        const card = createPokemonCard(pokemon);
        pokemonGrid.appendChild(card);
    });
    
    displayedCount += displayLimit;
    
    // Tampilkan tombol load more jika masih ada Pokemon yang belum ditampilkan
    if (displayedCount < pokemonToDisplay.length) {
        loadMoreBtn.style.display = 'block';
    } else {
        loadMoreBtn.style.display = 'none';
    }
}

// Fungsi untuk membuat elemen kartu Pokemon
function createPokemonCard(pokemon) {
    const card = document.createElement('div');
    card.className = 'pokemon-card';
    
    const imageUrl = pokemon.sprites.other['official-artwork'].front_default || 
                     pokemon.sprites.front_default;
    
    card.innerHTML = `
        <img src="${imageUrl}" alt="${pokemon.name}">
        <h3>${pokemon.name}</h3>
        <div class="pokemon-id">#${String(pokemon.id).padStart(4, '0')}</div>
        <div class="types">
            ${pokemon.types.map(t => 
                `<span class="type-badge type-${t.type.name}">${t.type.name}</span>`
            ).join('')}
        </div>
    `;
    
    card.addEventListener('mouseenter', (e) => {
        isHoveringCard = true;
        showHoverPopup(pokemon, e);
    });
    card.addEventListener('mouseleave', () => {
        isHoveringCard = false;
        hideHoverPopup();
    });
    card.addEventListener('click', () => showDetailPage(pokemon));
    
    return card;
}

// ==========================================
// FUNGSI HOVER POPUP
// ==========================================

// Fungsi untuk menampilkan popup hover dengan informasi Pokemon
function showHoverPopup(pokemon, event) {
    const imageUrl = pokemon.sprites.other['official-artwork'].front_default || 
                     pokemon.sprites.front_default;
    
    hoverContent.innerHTML = `
        <div class="popup-header">
            <h2>${pokemon.name}</h2>
            <p>#${String(pokemon.id).padStart(4, '0')}</p>
            <img src="${imageUrl}" alt="${pokemon.name}" class="popup-image">
        </div>
        <div class="popup-types">
            <h3>Types</h3>
            <div class="types">
                ${pokemon.types.map(t => 
                    `<span class="type-badge type-${t.type.name}">${t.type.name}</span>`
                ).join('')}
            </div>
        </div>
        <div class="popup-stats">
            <h3>Base Stats</h3>
            ${pokemon.stats.map(stat => `
                <div class="popup-stat">
                    <span class="popup-stat-name">${stat.stat.name}</span>
                    <span class="popup-stat-value">${stat.base_stat}</span>
                </div>
            `).join('')}
        </div>
    `;
    
    hoverPopup.classList.add('show');
    hoverPopup.style.left = (event.clientX + 15) + 'px';
    hoverPopup.style.top = (event.clientY + 15) + 'px';
}

// Fungsi untuk menyembunyikan popup hover
function hideHoverPopup() {
    hoverPopup.classList.remove('show');
}

// Tooltip untuk efek move
function showMoveTooltip(text, x, y) {
    moveTooltip.textContent = text;
    moveTooltip.style.left = (x + 12) + 'px';
    moveTooltip.style.top = (y - 20) + 'px';
    moveTooltip.style.display = 'block';
}

function hideMoveTooltip() {
    moveTooltip.style.display = 'none';
}

// ==========================================
// FUNGSI HALAMAN DETAIL POKEMON
// ==========================================

// Fungsi untuk menampilkan halaman detail Pokemon
async function showDetailPage(pokemon) {
    const imageUrl = pokemon.sprites.other['official-artwork'].front_default || 
                     pokemon.sprites.front_default;

    // Ambil daftar move yang dipelajari lewat level-up, urutkan ascending berdasarkan level
    const levelUpMovesSorted = pokemon.moves
        .filter(m => m.version_group_details.some(v => v.move_learn_method.name === 'level-up'))
        .map(m => {
            const levels = m.version_group_details
                .map(v => v.level_learned_at)
                .filter(l => l > 0);
            const minLevel = levels.length ? Math.min(...levels) : Infinity;
            return { ...m, _level: minLevel };
        })
        .sort((a, b) => {
            if (a._level === b._level) return a.move.name.localeCompare(b.move.name);
            return a._level - b._level;
        });

    // State & cache untuk moves
    const movesLimit = 30;
    const moveDetailsCache = new Map(); // key: move.url, value: json

    // Ambil detail ability untuk tooltip
    const abilityDetails = await Promise.all(pokemon.abilities.map(async (ab) => {
        try {
            const res = await fetch(ab.ability.url);
            return await res.json();
        } catch (e) {
            console.error('Error fetching ability detail:', e);
            return null;
        }
    }));

    const abilitiesHtml = pokemon.abilities.map((ab, idx) => {
        const abData = abilityDetails[idx];
        const name = abData?.name || ab.ability.name;
        const effectEntry = abData?.effect_entries?.find(entry => entry.language.name === 'en');
        const effectText = effectEntry ? effectEntry.short_effect : 'No effect text available.';
        const hiddenMark = ab.is_hidden ? ' <span class="ability-hidden">(hidden)</span>' : '';
        return `<h4><span class="ability-name" data-effect="${(effectText || '').replace(/"/g, '&quot;')}">${name}</span>${hiddenMark}</h4>`;
    }).join('');
    
    detailContent.innerHTML = `
        <div class="detail-page-content">
            <div class="detail-header">
                <h1>${pokemon.name}</h1>
                <div class="detail-id">#${String(pokemon.id).padStart(4, '0')}</div>
                <img src="${imageUrl}" alt="${pokemon.name}" class="detail-image">
            </div>

            <div class="detail-section">
                <h3>Types</h3>
                <div class="types">
                    ${pokemon.types.map(t => 
                        `<span class="type-badge type-${t.type.name}">${t.type.name}</span>`
                    ).join('')}
                </div>
            </div>

            <div class="detail-section">
                <h3>Base Stats</h3>
                ${pokemon.stats.map(stat => `
                    <div class="popup-stat">
                        <span class="popup-stat-name">${stat.stat.name}</span>
                        <span class="popup-stat-value">${stat.base_stat}</span>
                    </div>
                `).join('')}
            </div>

            <div class="detail-section">
                <h3>Height & Weight</h3>
                <p><strong>Height:</strong> ${(pokemon.height / 10).toFixed(1)} m</p>
                <p><strong>Weight:</strong> ${(pokemon.weight / 10).toFixed(1)} kg</p>
            </div>

            <div class="detail-section">
                <h3>Abilities</h3>
                <div class="detail-abilities">
                    ${abilitiesHtml}
                </div>
            </div>

            <div class="detail-section">
                <h3>Moves</h3>
                <div class="detail-moves">
                    <table class="move-table">
                        <thead>
                            <tr>
                                <th>Nama Move</th>
                                <th class="num">Level Didapat</th>
                                <th class="num">Power</th>
                                <th class="num">Accuracy</th>
                                <th class="num">PP</th>
                                <th>Type</th>
                                <th>Damage Class</th>
                            </tr>
                        </thead>
                        <tbody id="movesTbody">
                            <tr><td colspan="7">Loading moves…</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    // Render helper untuk moves
    async function renderMoves() {
        const tbody = document.getElementById('movesTbody');
        const list = levelUpMovesSorted.slice(0, movesLimit);

        // Fetch details bila belum ada di cache
        const missing = list.filter(m => !moveDetailsCache.has(m.move.url));
        if (missing.length) {
            const fetched = await Promise.all(missing.map(async m => {
                try {
                    const res = await fetch(m.move.url);
                    const json = await res.json();
                    return [m.move.url, json];
                } catch (e) {
                    console.error('Error fetching move detail:', e);
                    return [m.move.url, null];
                }
            }));
            fetched.forEach(([url, json]) => moveDetailsCache.set(url, json));
        }

        const rowsHtml = list.map(moveInfo => {
            const moveData = moveDetailsCache.get(moveInfo.move.url);
            const levelLearn = Number.isFinite(moveInfo._level) ? moveInfo._level : '—';
            const moveName = moveData?.name || moveInfo.move.name;
            const power = moveData?.power ?? '—';
            const accuracy = moveData?.accuracy ?? '—';
            const pp = moveData?.pp ?? '—';
            const type = moveData?.type?.name ?? '—';
            const damageClass = moveData?.damage_class?.name ?? '—';
            const effectEntry = moveData?.effect_entries?.find(entry => entry.language.name === 'en');
            const effectText = effectEntry ? effectEntry.short_effect : 'No effect text available.';

            return `
                <tr>
                    <td><span class="move-name" data-effect="${(effectText || '').replace(/"/g, '&quot;')}">${moveName}</span></td>
                    <td class="num">${levelLearn}</td>
                    <td class="num">${power}</td>
                    <td class="num">${accuracy}</td>
                    <td class="num">${pp}</td>
                    <td>${type}</td>
                    <td>${damageClass}</td>
                </tr>
            `;
        }).join('');
        tbody.innerHTML = rowsHtml || '<tr><td colspan="7">No moves available.</td></tr>';

        // Bind tooltip untuk move names (dibuat ulang setiap render)
        const moveNameEls = tbody.querySelectorAll('.move-name');
        moveNameEls.forEach(el => {
            el.addEventListener('mouseenter', (evt) => {
                const effect = el.getAttribute('data-effect') || 'No effect text available.';
                showMoveTooltip(effect, evt.clientX, evt.clientY);
            });
            el.addEventListener('mousemove', (evt) => {
                const effect = el.getAttribute('data-effect') || 'No effect text available.';
                showMoveTooltip(effect, evt.clientX, evt.clientY);
            });
            el.addEventListener('mouseleave', hideMoveTooltip);
        });
    }

    // Render awal (cap 30)
    await renderMoves();

    // Tooltip untuk abilities
    const abilityEls = detailContent.querySelectorAll('.ability-name');
    abilityEls.forEach(el => {
        el.addEventListener('mouseenter', (evt) => {
            const effect = el.getAttribute('data-effect') || 'No effect text available.';
            showMoveTooltip(effect, evt.clientX, evt.clientY);
        });
        el.addEventListener('mousemove', (evt) => {
            const effect = el.getAttribute('data-effect') || 'No effect text available.';
            showMoveTooltip(effect, evt.clientX, evt.clientY);
        });
        el.addEventListener('mouseleave', hideMoveTooltip);
    });
    
    mainPage.style.display = 'none';
    detailPage.style.display = 'block';
    window.history.pushState(null, '', `/pokemon/${pokemon.name}`);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==========================================
// FUNGSI PENCARIAN POKEMON
// Pencarian nama: ketik nama Pokemon (contoh: "pikachu")
// Pencarian ID: gunakan simbol # diikuti angka (contoh: "#25" untuk Pikachu)
// Ketik hanya "#" untuk melihat semua Pokemon tanpa filter ID
// ==========================================

// Fungsi untuk menangani pencarian Pokemon berdasarkan nama atau ID
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    pokemonGrid.innerHTML = '';
    
    let filtered = allPokemon;

    if (selectedGenerations.length > 0) {
        filtered = filtered.filter(pokemon => isInSelectedGeneration(pokemon.id));
    }

    if (selectedTypes.length > 0) {
        filtered = filtered.filter(pokemon =>
            selectedTypes.every(type =>
                pokemon.types.some(t => t.type.name === type)
            )
        );
    }
    
    if (searchTerm !== '') {
        if (searchTerm === '#') {
        } else if (searchTerm.startsWith('#')) {
            // Pencarian berdasarkan ID Pokemon (angka setelah #)
            const idTerm = searchTerm.substring(1);
            const searchId = parseInt(idTerm);
            
            if (!isNaN(searchId)) {
                filtered = filtered.filter(pokemon => 
                    pokemon.id === searchId
                );
            } else {
                // Jika bukan angka valid setelah #, tidak ada hasil
                filtered = [];
            }
        } else {
            // Pencarian berdasarkan nama Pokemon
            filtered = filtered.filter(pokemon => 
                pokemon.name.toLowerCase().includes(searchTerm)
            );
        }
    }
    
    filtered.forEach(pokemon => {
        const card = createPokemonCard(pokemon);
        pokemonGrid.appendChild(card);
    });
    
    loadMoreBtn.style.display = 'none';
}
