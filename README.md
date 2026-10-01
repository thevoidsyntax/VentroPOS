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
✅ Phase 2: Core POS       95%    (Cart, Checkout, Orders - DONE)
⬜ Phase 3: Inventory     0%     (Stock Management)
⬜ Phase 4: Reporting     0%     (Dashboard & Reports)
⬜ Phase 5: Hardware     0%     (Printer, Scanner, EDC)
⬜ Phase 6: Launch        0%     (Polish & Deploy)
```

### Phase 1 Status: ✅ DONE
- PostgreSQL database dengan RLS
- JWT authentication dengan refresh tokens
- CRUD API untuk Users, Products, Categories, Tables
- Security audit passed

### Phase 2 Status: ✅ DONE
- Shopping cart & order creation dengan modifiers
- Checkout flow dengan multiple payment methods (cash, QRIS, debit, credit)
- Split bill support
- Idempotency key untuk prevent duplicate checkout
- Order status management (pending → paid/voided/held)
- Stock deduction on checkout
- Modifier CRUD API (size, extras, topping, custom)
- Unit tests (59 passing)

### Next: Phase 3 - Inventory
- Stock management & restock

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

### Phase 2: Core POS - Completed
- **Order item modifiers storage** - Modifiers now persist to `order_item_modifiers` table
- **Transaction splits storage** - Split bill payments persist to `transaction_splits` table
- **Idempotency key** - Checkout prevents duplicate on network retry
- **Modifier CRUD API** - `/api/v1/modifiers/groups` and `/api/v1/modifiers/groups/:id/modifiers`
- **Unit tests** - 59 tests passing (25 new tests added)

### [Security] - Latest
- Fix SQL injection in tenant context
- CORS wildcard rejection in production
- JWT secret weak pattern validation
- Stock validation at order creation

### [Tests]
- 59 unit tests passing (up from 34)
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
