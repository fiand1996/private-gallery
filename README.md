# Private Gallery

**Private Gallery** is a lightning-fast, self-hosted local photo and media gallery server built with **Next.js 16 (App Router)**, **React 19**, **TypeScript**, **Tailwind CSS v4**, **SQLite**, and **Drizzle ORM**.

Designed for media enthusiasts, creators, and privacy advocates, Private Gallery scans your existing local directories on disk, indexes them into SQLite for instant timeline dates, albums, and folder browsing, and streams high-performance WebP thumbnails using `sharp`—all without moving or modifying your original media files.

---

## ✨ Key Features

- **📂 Media-First Directory Indexing**: Photos remain in their original folder structure on disk. SQLite indexes them for lightning-fast search, timeline dates, and album views.
- **⚡ High-Performance WebP Caching**: Automatically generates server-side WebP thumbnails (down from ~15MB raw to ~15KB WebP, a 99% reduction) using `sharp`. Supports HTTP `304 Not Modified` caching via ETag.
- **🔍 Advanced Search & Metadata**: Extracts EXIF, GPS, camera, lens, and IPTC/XMP metadata on-demand with automatic EXIF orientation correction. Global search with multi-filter support.
- **📁 Rich Gallery Views**: Seamlessly navigate between Photos view with horizontal justified grid (Immich / Google Photos style), Custom & Folder-backed Albums with infinite scroll, hierarchical Folder browser, and Explore hub.
- **🛡️ Atomic File Operations**: Perform file operations (`delete`, `move`, `copy`) directly from the web interface with instant physical disk and SQLite database synchronization.
- **🔒 Self-Hosted & Private**: Fully self-contained with authentication (`NextAuth.js`), secure path traversal resolution, and zero external telemetry.
- **🌙 Sleek Dark Media Theme**: Dark media interface starting with the `dark` class on `<html>` using a neutral zinc/slate palette (`#090b10` / `zinc-950`).

---

## 🏛️ Tech Stack

- **Framework:** Next.js 16 (App Router) + React 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 + Lucide Icons
- **Database & ORM:** SQLite (`better-sqlite3`) + Drizzle ORM
- **Image Processing:** `sharp` (WebP thumbnails) + `exifr` (EXIF metadata)
- **Authentication:** NextAuth.js (`next-auth`)
- **Package Manager:** `pnpm`

---

## 🚀 Getting Started & Deployment

### Option 1: Docker (Recommended)

Run Private Gallery instantly with Docker Compose:

```yaml
version: "3.8"

services:
  private-gallery:
    image: ghcr.io/fiand1996/private-gallery:latest
    container_name: private-gallery
    ports:
      - "3000:3000"
    environment:
      - AUTH_SECRET=your-secure-random-secret-key
    volumes:
      - ./data:/app/data
      - /path/to/your/photos:/media/photos
    restart: unless-stopped
```

Start the container:

```bash
docker compose up -d
```

### Option 2: Local Development

#### Prerequisites

- **Node.js** (v20+ recommended)
- **pnpm** (`npm install -g pnpm`)

#### Installation & Setup

1. **Clone the repository:**

   ```bash
   git clone https://github.com/fiand1996/private-gallery.git
   cd private-gallery
   ```

2. **Install dependencies:**

   ```bash
   pnpm install
   ```

3. **Configure environment variables:**
   Create a `.env` file in the root directory:

   ```env
   AUTH_SECRET="super-secret-key-change-in-production"
   ```

4. **Run database migrations:**

   ```bash
   pnpm db:migrate
   ```

5. **Start the development server:**
   ```bash
   pnpm dev
   ```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📚 Documentation Index

Explore the detailed documentation in the `docs/` directory:

- [System Architecture (`docs/architecture.md`)](./docs/architecture.md)
- [Running & Environment Variables (`docs/running-and-env.md`)](./docs/running-and-env.md)

---

## 🛡️ License

Distributed under the **MIT License**. See `LICENSE` for more information.
