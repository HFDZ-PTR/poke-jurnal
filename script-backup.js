/**
 * ===============================================
 * POKÉMON JURNAL - MAIN APPLICATION SCRIPT
 * ===============================================
 * Aplikasi interaktif untuk browsing dan mencari data Pokémon
 * menggunakan PokéAPI (https://pokeapi.co/)
 * 
 * Fitur Utama:
 * - Menampilkan daftar Pokémon dalam grid
 * - Filter berdasarkan tipe dan generasi
 * - Pencarian berdasarkan nama atau ID
 * - Tampilan detail lengkap Pokémon (stats, moves, abilities)
 * - Hover popup dengan informasi singkat
 * - Tooltip interaktif untuk moves dan abilities
 */

// ==========================================
// KONSTANTA KONFIGURASI
// ==========================================

/** URL base API untuk mengakses data Pokémon */
const API_URL = 'https://pokeapi.co/api/v2';

/** 
 * Jumlah Pokémon yang dimuat per satu kali "Load More"
 * Gunakan nilai ini untuk mengontrol performa aplikasi
 */
const displayLimit = 50;

// ==========================================
// VARIABEL GLOBAL - STATE MANAGEMENT
// ==========================================

/** Array menyimpan semua data Pokémon yang sudah di-fetch dari API */
let allPokemon = [];

/** Counter untuk melacak berapa banyak Pokémon yang sudah ditampilkan di grid */
let displayedCount = 0;

/** Flag untuk mencegah multiple loading requests saat data sedang di-fetch */
let isLoading = false;

/** Array menyimpan tipe Pokémon yang user pilih untuk filter (misal: ['fire', 'water']) */
let selectedTypes = [];

/**
 * Daftar semua tipe Pokémon yang tersedia dalam aplikasi
 * Digunakan untuk membuat tombol filter tipe dinamis
 */
const pokemonTypes = [
    'normal', 'fire', 'water', 'grass', 'electric', 'ice', 'fighting', 'poison',
    'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'
];

// ==========================================
// REFERENSI ELEMEN DOM
// ==========================================

/** 
 * Elemen-elemen DOM yang digunakan dalam aplikasi
 * Referensi ini diambil sekali saat aplikasi dimulai untuk performa lebih baik
 */
const pokemonGrid = document.getElementById('pokemonGrid');          // Container grid untuk kartu Pokemon
const searchInput = document.getElementById('searchInput');          // Input field untuk pencarian
const loadMoreBtn = document.getElementById('loadMore');            // Tombol untuk load Pokemon lebih banyak
const typeFilter = document.getElementById('typeFilter');          // Container tombol filter tipe
const generationFilter = document.getElementById('generationFilter'); // Container tombol filter generasi
const mainPage = document.getElementById('mainPage');              // Halaman utama dengan grid
const detailPage = document.getElementById('detailPage');          // Halaman detail Pokemon
const backBtn = document.getElementById('backBtn');                // Tombol kembali dari detail
const hoverPopup = document.getElementById('hoverPopup');          // Popup info ketika hover kartu
const hoverContent = document.getElementById('hoverContent');      // Konten dalam hover popup
const detailContent = document.getElementById('detailContent');    // Konten detail Pokemon

/**
 * Elemen tooltip untuk menampilkan deskripsi move dan ability
 * Tooltip ini di-reuse untuk semua deskripsi agar efisien
 */
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

// ==========================================
// FLAG DAN STATE MANAGEMENT
// ==========================================

/** Flag untuk melacak apakah user sedang hover kartu Pokemon */
let isHoveringCard = false;

// ==========================================
// FILTER GENERASI - RANGE ID POKEMON PER GENERASI
// ==========================================

/** 
 * Array untuk menyimpan generasi yang dipilih user
 * Contoh: ['Generation I', 'Generation II']
 */
let selectedGenerations = [];

/**
 * Mapping range ID Pokémon untuk setiap generasi
 * Digunakan untuk filter Pokémon berdasarkan generasi
 * Struktur: { label: 'Nama Generasi', min: ID_min, max: ID_max }
 * 
 * Gen I (Kanto):     1-151   - Red/Blue/Yellow
 * Gen II (Johto):    152-251 - Gold/Silver/Crystal
 * Gen III (Hoenn):   252-386 - Ruby/Sapphire
 * Gen IV (Sinnoh):   387-493 - Diamond/Pearl
 * Gen V (Unova):     494-649 - Black/White
 * Gen VI (Kalos):    650-721 - X/Y
 * Gen VII (Alola):   722-809 - Sun/Moon
 * Gen VIII (Galar):  810-898 - Sword/Shield
 * Gen IX (Paldea):   899-1010- Scarlet/Violet
 */
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

    // Tooltip untuk header kolom moves
    function bindHeaderTooltips() {
        const headerTips = [
            null,
            'Level Didapat: level saat Pokémon mempelajari move (level-up).',
            'Power: kekuatan dasar move (— untuk status atau tidak ada).',
            'Accuracy: peluang mengenai target dalam persen (— bila tidak berlaku).',
            'PP: jumlah penggunaan move sebelum dipulihkan.',
            'Type: elemen tipe move (fire, water, dll).',
            'Damage Class: physical/special/status — jenis dampak move.'
        ];
        const ths = detailContent.querySelectorAll('.move-table thead th');
        ths.forEach((th, idx) => {
            const tip = headerTips[idx];
            if (!tip) return;
            th.addEventListener('mouseenter', (evt) => showMoveTooltip(tip, evt.clientX, evt.clientY));
            th.addEventListener('mousemove', (evt) => showMoveTooltip(tip, evt.clientX, evt.clientY));
            th.addEventListener('mouseleave', hideMoveTooltip);
        });
    }

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

        // Event delegation untuk tooltip kolom lain: level, power, accuracy, pp, type, damage class
        const describeDamageClass = (val) => {
            const v = String(val || '').toLowerCase();
            if (v === 'physical') return 'Physical: memakai Attack vs Defense.';
            if (v === 'special') return 'Special: memakai Sp. Atk vs Sp. Def.';
            if (v === 'status') return 'Status: tidak memberi damage langsung; memberi efek.';
            return 'Damage Class move.';
        };
        const getCellTooltip = (colIndex, text) => {
            const t = text === undefined || text === null ? '—' : String(text);
            switch (colIndex) {
                case 1: return t === '—' ? 'Tidak dipelajari lewat level-up pada versi tertentu.' : `Dipelajari pada level ${t}.`;
                case 2: return t === '—' ? 'Tidak memiliki power dasar (biasanya move status).' : `Power dasar: ${t}.`;
                case 3: return t === '—' ? 'Akurasi tidak berlaku/selalu mengenai.' : `Akurasi: ${t}%.`;
                case 4: return t === '—' ? 'PP tidak tersedia.' : `PP: dapat digunakan ${t} kali.`;
                case 5: return t === '—' ? 'Tipe move tidak diketahui.' : `Tipe move: ${t}.`;
                case 6: return describeDamageClass(t);
                default: return '';
            }
        };

        // Hapus listener sebelumnya (dengan mengganti node reference)
        const newTbody = tbody;
        // Pasang listeners delegasi
        const onMouseOver = (evt) => {
            const td = evt.target.closest('td');
            if (!td || !newTbody.contains(td)) return;
            // Abaikan kolom nama move (di-handle sendiri)
            if (td.querySelector('.move-name')) return;
            const col = td.cellIndex;
            if (col >= 1 && col <= 6) {
                const text = td.textContent.trim();
                const message = getCellTooltip(col, text);
                if (message) showMoveTooltip(message, evt.clientX, evt.clientY);
            }
        };
        const onMouseMove = (evt) => {
            const td = evt.target.closest('td');
            if (!td || !newTbody.contains(td)) return;
            if (td.querySelector('.move-name')) return;
            const col = td.cellIndex;
            if (col >= 1 && col <= 6) {
                const text = td.textContent.trim();
                const message = getCellTooltip(col, text);
                if (message) showMoveTooltip(message, evt.clientX, evt.clientY);
            }
        };
        const onMouseLeave = () => hideMoveTooltip();

        // Untuk mencegah multiple binding saat render ulang, reset dulu (dengan cloneNode)
        const parent = newTbody.parentNode;
        const cloned = newTbody.cloneNode(true);
        parent.replaceChild(cloned, newTbody);

        // Pasang ulang binding move-name pada cloned tbody
        const moveNameEls2 = cloned.querySelectorAll('.move-name');
        moveNameEls2.forEach(el => {
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

        // Delegasi untuk kolom lainnya
        cloned.addEventListener('mouseover', onMouseOver);
        cloned.addEventListener('mousemove', onMouseMove);
        cloned.addEventListener('mouseleave', onMouseLeave);
    }

    // Render awal (cap 30)
    await renderMoves();

    // Header tooltips
    bindHeaderTooltips();

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
