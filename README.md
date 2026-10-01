# VentroPos

> *POS Cerdas untuk Cafe Nusantara*

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Status](https://img.shields.io/badge/status-Development-yellow)
![License](https://img.shields.io/badge/license-MIT-green)

## 🎯 Overview

VentroPos adalah sistem Point of Sale (POS) berbasis cloud untuk cafe dan restoran kecil-menengah di Indonesia. Arsitektur multi-tenant memungkinkan satu deployment melayani multiple outlet dengan isolasi data ketat menggunakan PostgreSQL Row-Level Security (RLS).

## ✨ Features

- 🛒 **Shopping Cart** - Proses order cepat
- 💳 **Multi-Payment** - Cash, QRIS, Debit/Credit, Split Bill
- 📦 **Inventory Management** - Stock tracking real-time
- 📊 **Reporting Dashboard** - Sales, produk, staff performance
- 🖨️ **Hardware Integration** - Receipt printer, barcode scanner, cash drawer
- 📱 **PWA** - Berjalan di Tablet, Mobile, Desktop

## 📊 Progress Tracker

```
✅ Phase 1: Foundation     ~95%   (Backend, DB, Auth - DONE)
⬜ Phase 2: Core POS     0%     (Cart, Checkout, Orders - NEXT)
⬜ Phase 3: Inventory     0%     (Stock Management)
⬜ Phase 4: Reporting     0%     (Dashboard & Reports)
⬜ Phase 5: Hardware     0%     (Printer, Scanner, EDC)
⬜ Phase 6: Launch        0%     (Polish & Deploy)
```

### Phase 1 Status: ✅ DONE
- PostgreSQL database dengan RLS
- JWT authentication dengan refresh tokens
- CRUD API untuk Users, Products, Categories, Tables
- Unit tests (34 passing)
- Security audit passed

### Next: Phase 2 - Core POS
- Shopping cart functionality
- Checkout flow
- Multiple payment methods
- Order management

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Node.js 20+, Fastify, TypeScript |
| Database | PostgreSQL 15+ (RLS) |
| Auth | JWT + Refresh Tokens |
| Frontend | React 18 (future) |

## 🚀 Quick Start

```bash
# Backend
cd src/backend
npm install
cp .env.example .env
npm run dev

# API: http://localhost:3000
# Docs: http://localhost:3000/docs
```

## 📁 Structure

```
VentroPos/
├── src/backend/         # Fastify API
├── docs/               # Documentation
├── README.md           # Project info
└── CLAUDE.md          # Developer instructions
```

## 📝 Recent Changes

### [Security] - Latest
- Fix SQL injection in tenant context
- CORS wildcard rejection in production
- JWT secret weak pattern validation
- Stock validation at order creation

### [Fixed]
- Missing requireManager import
- Missing table input types
- TypeScript compilation errors
- ESLint peer dependency conflicts

### [Tests]
- 34 unit tests passing
- Type coverage >80%

## 🔒 Security

- PostgreSQL Row-Level Security (RLS)
- JWT with refresh token rotation
- bcrypt password hashing (cost 12)
- Zod input validation

## 📄 License

MIT License

---

Built with ☕ for the Indonesian cafe community
