# VentroPos

> *POS Cerdas untuk Cafe Nusantara*

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Status](https://img.shields.io/badge/status-Development-yellow)
![License](https://img.shields.io/badge/license-MIT-green)

## 🎯 Overview

VentroPos adalah sistem Point of Sale (POS) berbasis cloud yang dirancang khusus untuk cafe dan restoran kecil-menengah di Indonesia. Dengan arsitektur multi-tenant yang robust, satu deployment dapat melayani multiple outlet dengan isolasi data yang ketat.

## ✨ Features

### Core Features
- 🛒 **Shopping Cart** - Proses order cepat dengan drag & drop
- 💳 **Multi-Payment** - Cash, QRIS, Debit/Credit, Split Bill
- 📦 **Inventory Management** - Stock tracking real-time
- 📊 **Reporting Dashboard** - Sales, produk, staff performance
- 🖨️ **Hardware Integration** - Receipt printer, barcode scanner, cash drawer

### Technical Features
- 📱 **PWA** - Berjalan di Tablet, Mobile, Desktop
- 🔒 **Offline-Capable** - Tetap berfungsi tanpa internet
- 🔐 **Multi-Tenant Security** - PostgreSQL Row-Level Security
- 🚀 **Scalable Architecture** - Dari 1 cafe hingga 100+ outlets

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                    VENTROPOS                        │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌─────────────┐     ┌─────────────┐               │
│  │  Frontend   │────▶│   Backend   │               │
│  │   (React)   │◀────│  (Fastify)  │               │
│  └─────────────┘     └──────┬──────┘               │
│                              │                       │
│                              ▼                       │
│                        ┌───────────┐                 │
│                        │ PostgreSQL│                 │
│                        │   (RLS)   │                 │
│                        └───────────┘                 │
│                                                      │
└─────────────────────────────────────────────────────┘
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, TailwindCSS, PWA |
| Backend | Node.js, Fastify, TypeScript |
| Database | PostgreSQL 15+ |
| Auth | JWT + Refresh Tokens |
| Deployment | Docker, VPS |

## 📋 Project Status

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 1 | 🔴 Pending | Foundation (Backend, DB, Auth) |
| Phase 2 | ⬜ Pending | Core POS (Cart, Checkout) |
| Phase 3 | ⬜ Pending | Inventory Module |
| Phase 4 | ⬜ Pending | Reporting & Dashboard |
| Phase 5 | ⬜ Pending | Hardware Integration |
| Phase 6 | ⬜ Pending | Polish & Launch |

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 15+ (or use Docker)

### Installation

```bash
# Clone repository
git clone https://github.com/your-org/ventro-pos.git
cd ventro-pos

# Install backend dependencies
cd src/backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Setup environment
cp .env.example .env

# Run database migrations
cd ../backend
npm run db:migrate

# Start development servers
npm run dev
```

### Quick Start with Docker

```bash
# Start all services
docker-compose up -d

# Backend API: http://localhost:3000
# Frontend: http://localhost:5173
```

## 📁 Project Structure

```
ventro-pos/
├── docs/                      # Documentation
│   ├── prd/                   # Product Requirements
│   ├── roadmap/                # Phase roadmaps
│   └── adr/                   # Architecture Decisions
├── src/
│   ├── backend/               # API server
│   └── frontend/              # React PWA
├── docker/                    # Docker configs
├── CHANGELOG.md               # Version history
├── README.md                  # This file
└── CLAUDE.md                 # Developer guide
```

## 📚 Documentation

- [Product Requirements Document](./docs/prd/README.md)
- [Project Roadmap](./docs/roadmap/README.md)
- [Phase 1 Details](./docs/roadmap/phase-1-foundation.md)
- [Changelog](./CHANGELOG.md)

## 🔒 Security

- **Multi-Tenant Isolation:** PostgreSQL Row-Level Security
- **Authentication:** JWT with refresh token rotation
- **Password:** bcrypt hashing (cost factor 12)
- **Input Validation:** Zod schemas on all endpoints
- **HTTPS:** TLS 1.3 enforced

## 📈 Roadmap

See [Project Roadmap](./docs/roadmap/README.md) for detailed timeline.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Developer:** Solo Developer

## 🙏 Acknowledgments

- [Fastify](https://fastify.dev/) - Fast web framework
- [PostgreSQL](https://www.postgresql.org/) - Database
- [React](https://react.dev/) - Frontend framework
- [TailwindCSS](https://tailwindcss.com/) - Styling

---

Built with ☕ for the Indonesian cafe community
