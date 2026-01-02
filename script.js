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
const mainPage = document.getElementById('mainPage');
const detailPage = document.getElementById('detailPage');
const backBtn = document.getElementById('backBtn');
const hoverPopup = document.getElementById('hoverPopup');
const hoverContent = document.getElementById('hoverContent');
const detailContent = document.getElementById('detailContent');

// Flag untuk menandai apakah sedang hover pada kartu Pokemon
let isHoveringCard = false;

// ==========================================
// INISIALISASI APLIKASI
// ==========================================

// Inisialisasi aplikasi: memuat data Pokemon, mengatur filter tipe, dan routing
loadAndDisplayPokemon();
initializeTypeFilters();
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
    
    if (selectedTypes.length > 0) {
        pokemonToDisplay = allPokemon.filter(pokemon => {
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

// ==========================================
// FUNGSI HALAMAN DETAIL POKEMON
// ==========================================

// Fungsi untuk menampilkan halaman detail Pokemon
function showDetailPage(pokemon) {
    const imageUrl = pokemon.sprites.other['official-artwork'].front_default || 
                     pokemon.sprites.front_default;
    
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
                    ${pokemon.abilities.map(a => `<h4>${a.ability.name}</h4>`).join('')}
                </div>
            </div>

            <div class="detail-section">
                <h3>Moves</h3>
                <div class="detail-moves">
                    ${pokemon.moves
                    .filter(m => m.version_group_details.some(v => v.move_learn_method.name === 'level-up'))
                    .slice(0, 20).map(m => `<h4>${m.move.name}</h4>`).join('')}
                </div>
            </div>
        </div>
    `;
    
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
