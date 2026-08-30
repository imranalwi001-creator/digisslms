---
name: lms-interactive-content-and-coding-sandbox
description: In-browser interactive coding playgrounds, WebAssembly Python sandbox, live HTML/CSS/JS execution, algorithm visualizers, and rich multimedia labs for modern computer science & informatics education (Codecademy & LeetCode standard).
---

# LMS Interactive Content & Coding Sandbox

Gunakan keahlian ini untuk membangun lingkungan belajar komputer & informatika yang interaktif, di mana siswa dapat langsung menulis, menjalankan (*run*), dan menguji kode program secara langsung di dalam peramban web (*browser*).

---

## 1. Lingkungan Eksekusi Kode di Browser (Client-Side Sandboxing)
- **Live Web Runner (HTML / CSS / JavaScript)**:
  - Editor kode dengan *syntax highlighting* dan panel *live preview iframe* dengan isolasi keamanan (*sandboxed iframe*).
  - Konsol log visual untuk menampilkan output `console.log()` dan pesan error secara bersahabat bagi pemula.
- **In-Browser Python Execution (Pyodide / WASM)**:
  - Eksekutor kode Python murni di sisi klien menggunakan WebAssembly tanpa membebani server backend.
  - Dukungan interaktif untuk input/output konsol (`input()` dan `print()`).

---

## 2. Visualisasi Algoritma & Struktur Data
- **Interactive Step-by-Step Execution**:
  - Visualisasi alur *flowchart*, eksekusi percabangan (*if-else*), dan simulasi perulangan (*loop*) secara visual untuk memperkuat konsep Berpikir Komputasional.
- **Auto-Judge & Automated Code Testing**:
  - Pengecekan otomatis *test cases* (input sample vs expected output) untuk latihan pemrograman mandiri siswa.
