## 44. Browser Compatibility & Environmental Matrices

This section documents the verified system environments, browser engines, tested operating systems, and runtime requirements.

---

### 44.1 Supported Browser Matrices
The frontend is tested on major evergreen browsers using Chromium, Gecko, and WebKit rendering engines:

- **Google Chrome**: Version 115 or higher (full drag-to-scroll, grid layout, and canvas printing support).
- **Mozilla Firefox**: Version 118 or higher (scrollbar styling overrides, flex-grow support, and sticky column borders).
- **Apple Safari**: Version 16 or higher (touch gestures, horizontal swipe scrolling, and flex-basis alignments).
- **Microsoft Edge**: Version 115 or higher (Chromium engine layouts).

---

### 44.2 Tested Operating Systems
- **Windows**: Windows 10 and Windows 11 (tested using Powershell 7, CMD, and Chromium-based tools).
- **macOS**: macOS 13 (Ventura) and macOS 14 (Sonoma) (verified horizontal touch trackpad navigation).
- **Linux**: Ubuntu 22.04 LTS (tested build compilation and server-side page data rendering).

---

### 44.3 Node.js & Database Runtimes
- **Node.js**: Recommended Node.js LTS v18 or v20.
- **npm**: npm v9 or v10.
- **PostgreSQL**: PostgreSQL 15.x (hosted on Supabase infrastructure).
- **Supabase CLI**: Verified CLI version 1.150 or higher for local migration pushes.
