/**
 * ===============================================
 * POKÉMON JURNAL - MAIN APPLICATION SCRIPT
 * ===============================================
 */

// ==========================================
// KONFIGURASI
// ==========================================

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
moveTooltip.style.zIndex = '2000';
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
    
    // Update URL di browser bar (tanpa reload)
    window.history.pushState(
        null, 
        '', 
        window.location.origin + window.location.pathname.split('/pokemon')[0]
    );

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
    // Ambil informasi URL
    const path = window.location.pathname;
    const searchParams = new window.URLSearchParams(window.location.search);
    
    // Handle redirect dari 404.html
    // Format: /?/pokemon/pikachu (diubah dari /pokemon/pikachu)
    const pokemonPath = searchParams.get('/');
    
    // Cek apakah user membuka halaman detail Pokemon
    if (pokemonPath && pokemonPath.startsWith('pokemon/')) {
        // Extract nama Pokemon dari URL
        const pokemonName = decodeURIComponent(pokemonPath.split('/')[1]);
        
        // Cari Pokemon di allPokemon array (case-insensitive)
        const pokemon = allPokemon.find(
            p => p.name.toLowerCase() === pokemonName.toLowerCase()
        );
        
        // Jika Pokemon ditemukan, tampilkan halaman detail
        if (pokemon) {
            showDetailPage(pokemon);
        } else {
            // Jika tidak ditemukan, tampilkan grid (fallback)
            mainPage.style.display = 'block';
            detailPage.style.display = 'none';
        }
    } else {
        // Tampilkan halaman grid (default)
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
    
    // Reset grid dan tampilkan Pokemon sesuai filter baru
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

    // Reset grid dan tampilkan Pokemon sesuai filter baru
    pokemonGrid.innerHTML = '';
    displayedCount = 0;
    loadMoreDisplay();
}

function isInSelectedGeneration(pokemonId) {
    // Jika tidak ada filter generasi, tampilkan semua Pokemon
    if (selectedGenerations.length === 0) {
        return true;
    }

    // Cari generasi yang mencakup pokemonId
    const generation = generationRanges.find(
        range => pokemonId >= range.min && pokemonId <= range.max
    );
    
    // Return true jika generasi ditemukan dan ada di filter terpilih
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
            // Fetch listing Pokemon (hanya basic info)
            const response = await fetch(
                `${API_URL}/pokemon?offset=${offset}&limit=${batchSize}`
            );
            const data = await response.json();
            
            // setiap Pokemon di listing, fetch detail lengkapnya
            // Promise.all() menjalankan semua fetch secara parallel
            const pokemonPromises = data.results.map(pokemon => 
                fetch(pokemon.url).then(r => r.json())
            );
            
            // Tunggu semua fetch selesai
            const pokemonDetails = await Promise.all(pokemonPromises);
            
            // Tambahkan ke allPokemon array
            allPokemon.push(...pokemonDetails);
            
            // Tampilkan batch pertama segera setelah selesai
            if (offset === 0) {
                loadMoreDisplay();
            }
        }
    } catch (error) {
        // Log error jika fetch gagal
        console.error('Error loading Pokémon:', error);
    } finally {
        // Selalu set isLoading = false (baik berhasil atau error)
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
        pokemonToDisplay = pokemonToDisplay.filter(pokemon => 
            isInSelectedGeneration(pokemon.id)
        );
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
    
    // Ambil gambar Pokemon (pilih official artwork, fallback ke sprite biasa)
    const imageUrl = pokemon.sprites.other['official-artwork'].front_default || 
                     pokemon.sprites.front_default;
    
    // Set HTML konten card
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
    
    // EVENT 1: Mouse enter (hover)
    card.addEventListener('mouseenter', (e) => {
        isHoveringCard = true;
        showHoverPopup(pokemon, e);
    });
    
    // EVENT 2: Mouse leave (hover out)
    card.addEventListener('mouseleave', () => {
        isHoveringCard = false;
        hideHoverPopup();
    });
    
    // EVENT 3: Click card
    card.addEventListener('click', () => showDetailPage(pokemon));
    
    return card;
}

// ==========================================
// FUNGSI HOVER POPUP
// ==========================================

// Fungsi untuk menampilkan popup hover dengan informasi Pokemon
function showHoverPopup(pokemon, event) {
    // Ambil gambar Pokemon
    const imageUrl = pokemon.sprites.other['official-artwork'].front_default || 
                     pokemon.sprites.front_default;
    
    // Generate HTML untuk popup
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
    
    // Tambah class 'show' (untuk visibility)
    hoverPopup.classList.add('show');
    
    // Set posisi popup relative terhadap cursor
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
    // Ambil gambar Pokemon
    const imageUrl = pokemon.sprites.other['official-artwork'].front_default || 
                     pokemon.sprites.front_default;

    // Ambil daftar move yang dipelajari lewat level-up, urutkan ascending berdasarkan level
    const levelUpMovesSorted = pokemon.moves
        .filter(m => m.version_group_details.some(v => v.move_learn_method.name === 'level-up'))
        .map(m => {
            // Extract level yang dipelajari dari berbagai game version
            const levels = m.version_group_details
                .map(v => v.level_learned_at)
                .filter(l => l > 0);
            // Cari level minimal (dalam hal ada perbedaan antar generation)
            const minLevel = levels.length ? Math.min(...levels) : Infinity;
            return { ...m, _level: minLevel };
        })
        // Sort berdasarkan level (ascending), jika level sama sort by nama
        .sort((a, b) => {
            if (a._level === b._level) return a.move.name.localeCompare(b.move.name);
            return a._level - b._level;
        });

    // STEP 2: Setup cache untuk detail move
    const movesLimit = 30; // Tampilkan max 30 moves
    const moveDetailsCache = new Map(); // key: move.url, value: move detail JSON

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

    // Generate HTML untuk abilities dengan tooltip
    const abilitiesHtml = pokemon.abilities.map((ab, idx) => {
        const abData = abilityDetails[idx];
        const name = abData?.name || ab.ability.name;
        // Cari effect description untuk tooltip
        const effectEntry = abData?.effect_entries?.find(entry => entry.language.name === 'en');
        const effectText = effectEntry ? effectEntry.short_effect : 'No effect text available.';
        // Mark hidden ability dengan special styling
        const hiddenMark = ab.is_hidden ? ' <span class="ability-hidden">(hidden)</span>' : '';
        return `<h4><span class="ability-name" data-effect="${(effectText || '').replace(/"/g, '&quot;')}">${name}</span>${hiddenMark}</h4>`;
    }).join('');
    
    // Generate HTML untuk detail page
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
                                <th class="num">Level</th>
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

    // STEP 6: Helper function untuk render moves
    async function renderMoves() {
        const tbody = document.getElementById('movesTbody');
        const list = levelUpMovesSorted.slice(0, movesLimit);

        // Fetch detail move yang belum ada di cache
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

        // Generate HTML untuk setiap move
        const rowsHtml = list.map(moveInfo => {
            const moveData = moveDetailsCache.get(moveInfo.move.url);
            const levelLearn = Number.isFinite(moveInfo._level) ? moveInfo._level : '—';
            const moveName = moveData?.name || moveInfo.move.name;
            const power = moveData?.power ?? '—';
            const accuracy = moveData?.accuracy ?? '—';
            const pp = moveData?.pp ?? '—';
            const type = moveData?.type?.name ?? '—';
            const damageClass = moveData?.damage_class?.name ?? '—';
            // Cari effect description untuk move name tooltip
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

        // Helper untuk tooltip setiap kolom
        const getCellTooltip = (colIndex, text) => {
            const t = text === undefined || text === null ? '—' : String(text).trim();
            switch (colIndex) {
                case 1: // Level Didapat
                    return t === '—' ? 'Tidak dipelajari lewat level-up di versi ini.' : `Dipelajari pada level ${t}.`;
                case 2: // Power
                    return t === '—' ? 'Tidak ada power dasar (move status).' : `Power dasar: ${t}.`;
                case 3: // Accuracy
                    return t === '—' ? 'Akurasi tidak berlaku / selalu mengenai.' : `Akurasi: ${t}%.`;
                case 4: // PP
                    return t === '—' ? 'PP tidak tersedia.' : `Dapat digunakan ${t} kali sebelum perlu dipulihkan.`;
                case 5: // Type
                    return t === '—' ? 'Tipe move tidak diketahui.' : `Tipe move: ${t}.`;
                case 6: // Damage Class
                    return describeDamageClass(t);
                default:
                    return '';
            }
        };

        // Event delegation untuk tooltip kolom lain
        const onMouseOver = (evt) => {
            const td = evt.target.closest('td');
            if (!td || !tbody.contains(td)) return;
            if (td.querySelector('.move-name')) return; // Skip kolom move name (sudah di-handle)
            const col = td.cellIndex;
            if (col >= 1 && col <= 6) {
                const text = td.textContent.trim();
                const message = getCellTooltip(col, text);
                if (message) showMoveTooltip(message, evt.clientX, evt.clientY);
            }
        };

        const onMouseMove = (evt) => {
            const td = evt.target.closest('td');
            if (!td || !tbody.contains(td)) return;
            if (td.querySelector('.move-name')) return;
            const col = td.cellIndex;
            if (col >= 1 && col <= 6) {
                const text = td.textContent.trim();
                const message = getCellTooltip(col, text);
                if (message) showMoveTooltip(message, evt.clientX, evt.clientY);
            }
        };

        const onMouseLeave = () => hideMoveTooltip();

        // Prevent multiple bindings dengan cloneNode
        const parent = tbody.parentNode;
        const cloned = tbody.cloneNode(true);
        parent.replaceChild(cloned, tbody);

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

        // Delegasi untuk kolom lain
        cloned.addEventListener('mouseover', onMouseOver);
        cloned.addEventListener('mousemove', onMouseMove);
        cloned.addEventListener('mouseleave', onMouseLeave);
    }

    // Render awal (cap 30)
    await renderMoves();

    // Bind tooltip untuk header kolom moves
    function bindHeaderTooltips() {
        const headerTips = [
            null,
            'Level: level saat Pokémon mempelajari move (level-up).',
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

    // Update halaman (tampilkan detail, sembunyikan grid)
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
    // Ambil search term dan konversi ke lowercase
    const searchTerm = e.target.value.toLowerCase();
    
    // Reset grid
    pokemonGrid.innerHTML = '';
    
    // Mulai dari semua Pokemon
    let filtered = allPokemon;

    // Apply filter generasi (jika ada)
    if (selectedGenerations.length > 0) {
        filtered = filtered.filter(pokemon => isInSelectedGeneration(pokemon.id));
    }

    // Apply filter tipe (jika ada)
    if (selectedTypes.length > 0) {
        filtered = filtered.filter(pokemon =>
            selectedTypes.every(type =>
                pokemon.types.some(t => t.type.name === type)
            )
        );
    }
    
    // Apply search filter (jika ada search term)
    if (searchTerm !== '') {
        if (searchTerm === '#') {
            // Hanya "#" = list all (tanpa filter ID)
        } else if (searchTerm.startsWith('#')) {
            // Pencarian berdasarkan ID Pokemon (angka setelah #)
            const idTerm = searchTerm.substring(1);
            const searchId = parseInt(idTerm);
            
            if (!isNaN(searchId)) {
                // ID valid, filter by exact ID
                filtered = filtered.filter(pokemon => 
                    pokemon.id === searchId
                );
            } else {
                // ID tidak valid, return kosong
                filtered = [];
            }
        } else {
            // Pencarian berdasarkan nama Pokemon
            filtered = filtered.filter(pokemon => 
                pokemon.name.toLowerCase().includes(searchTerm)
            );
        }
    }
    
    // Tampilkan semua hasil (tanpa pagination)
    filtered.forEach(pokemon => {
        const card = createPokemonCard(pokemon);
        pokemonGrid.appendChild(card);
    });
    
    // Sembunyikan tombol Load More (hasil search sudah ditampilkan semuanya)
    loadMoreBtn.style.display = 'none';
}