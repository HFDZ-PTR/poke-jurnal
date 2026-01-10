# Pokémon Jurnal

**Pokémon Jurnal** adalah website **Pokédex interaktif** yang menampilkan data Pokémon menggunakan **[PokéAPI](https://pokeapi.co/)**. Project ini dibuat sebagai tugas mata kuliah **Pemrograman Web**.

---

https://hfdz-ptr.github.io/poke-jurnal/

---

##  Fitur Utama

- **Browse Grid Pokémon** - Tampilan grid responsif dengan kartu Pokémon
- **Filter Berdasarkan Tipe** - Filter dengan mode AND/OR untuk kombinasi tipe
- **Filter Berdasarkan Generasi** - Tampilkan Pokémon dari generasi spesifik (Gen I-IX)
- **Pencarian Real-time** - Cari nama Pokémon atau ID dengan instant results
- **Detail Lengkap** - Lihat stats, abilities, moves, height, weight setiap Pokémon
- **Hover Popup** - Preview singkat saat hover kartu Pokémon
- **Tooltip Interaktif** - Deskripsi move, ability, dan kolom tabel saat hover
- **Responsive Design** - Bekerja dengan baik di desktop, tablet, dan mobile

---

Struktur kode:
1. **Konstanta & Konfigurasi**
2. **Variabel Global & State Management**
3. **Referensi Elemen DOM**
4. **Filter Generasi Mapping**
5. **Inisialisasi & Event Listeners**
6. **Fungsi Routing & Navigation**
7. **Fungsi Filter (Tipe & Generasi)**
8. **Fungsi Pemuatan Data Pokemon**
9. **Fungsi Tampilan Grid**
10. **Fungsi Hover Popup & Tooltip**
11. **Fungsi Detail Page**
12. **Fungsi Pencarian**

---

### API
Project menggunakan **[PokéAPI v2](https://pokeapi.co/api/v2/)**

Endpoints yang digunakan:
- `/pokemon` - List Pokémon (dengan pagination)
- `/pokemon/{id}` - Detail Pokémon spesifik
- `/pokemon-species/{id}` - Info spesies Pokémon
- `/move/{id}` - Detail move
- `/ability/{id}` - Detail ability
 