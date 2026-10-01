# VentroPos

> *POS Cerdas untuk Cafe Nusantara*

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Status](https://img.shields.io/badge/status-Development-yellow)
![License](https://img.shields.io/badge/license-MIT-green)

## 🎯 Overview

VentroPos adalah sistem Point of Sale (POS) berbasis cloud untuk cafe dan restoran kecil-menengah di Indonesia. Arsitektur multi-tenant memungkinkan satu deployment melayani multiple outlet dengan isolasi data ketat menggunakan PostgreSQL Row-Level Security (RLS).

## ✨ Features

### Core Features
- 🛒 **Shopping Cart** - Proses order cepat
- 💳 **Multi-Payment** - Cash, QRIS, Debit/Credit, Split Bill
- 📦 **Inventory Management** - Stock tracking real-time
- 📊 **Reporting Dashboard** - Sales, produk, staff performance
- 🖨️ **Hardware Integration** - Receipt printer, barcode scanner, cash drawer

### Technical Features
- 📱 **PWA** - Berjalan di Tablet, Mobile, Desktop
- 🔒 **Offline-Capable** - Tetap berfungsi tanpa internet
- 🔐 **Multi-Tenant Security** - PostgreSQL Row-Level Security
- 🚀 **Scalable Architecture** - Dari 1 cafe hingga 100+ outlets

## 📊 Development Progress

```
PHASE 1 ████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░  ✅ ~95%
Foundation (Backend + DB + Auth)

PHASE 2 ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ⬜ 0%
Core POS (Cart + Checkout)

PHASE 3 ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ⬜ 0%
Inventory Module

PHASE 4 ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ⬜ 0%
Reporting & Dashboard

PHASE 5 ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ⬜ 0%
Hardware Integration

PHASE 6 ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ⬜ 0%
Polish & Launch
```

**Lihat detail progress:** [docs/roadmap/PROGRESS.md](./docs/roadmap/PROGRESS.md)

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, TailwindCSS, PWA |
| Backend | Node.js 20+, Fastify, TypeScript |
| Database | PostgreSQL 15+ (RLS) |
| Auth | JWT + Refresh Tokens |
| Deployment | Docker, VPS |

## 🚀 Quick Start

```bash
# Clone & install backend
cd src/backend && npm install

# Setup .env
cp .env.example .env

# Start
npm run dev
```

**Backend API:** http://localhost:3000  
**API Docs:** http://localhost:3000/docs (Swagger)

## 📁 Project Structure

```
VentroPos/
├── src/
│   └── backend/          # Fastify API server
├── docs/
│   ├── prd/             # Product Requirements
│   └── roadmap/          # Phase roadmaps
├── CHANGELOG.md          # Version history
├── README.md             # This file
└── CLAUDE.md            # Developer guide
```

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [PROGRESS.md](./docs/roadmap/PROGRESS.md) | Development progress tracker |
| [CHANGELOG.md](./CHANGELOG.md) | Version history |
| [CLAUDE.md](./CLAUDE.md) | Developer instructions |

## 🔒 Security

- **Multi-Tenant Isolation:** PostgreSQL Row-Level Security (RLS)
- **Authentication:** JWT with refresh token rotation
- **Password:** bcrypt hashing (cost factor 12)
- **Input Validation:** Zod schemas on all endpoints

## 📄 License

MIT License - lihat [LICENSE](LICENSE)

---

Built with ☕ for the Indonesian cafe community
