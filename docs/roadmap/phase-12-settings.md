# Phase 12: Settings & Configuration

> **Version:** 1.0.0
> **Status:** ⬜ Todo
> **Priority:** P2
> **Dependencies:** Phase 7 (Frontend Setup)

---

## Overview

Phase 12 implements settings and configuration pages including table management, user management, and hardware configuration.

---

## Objectives

1. ⬜ Table layout management
2. ⬜ User management (CRUD)
3. ⬜ Role management
4. ⬜ Hardware device configuration
5. ⬜ Store settings (tax, name)
6. ⬜ Profile settings

---

## Pages

### Tables Page (`/tables`)

```
┌─────────────────────────────────────────────────────────────┐
│  Tables                              [+ Add Table]          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │
│  │   1     │ │   2     │ │   3     │ │   4     │        │
│  │  ○○○○   │ │  ○○○○   │ │ ●●●●    │ │  ○○○○   │        │
│  │ 4 seats │ │ 4 seats │ │ 4 seats │ │ 4 seats │        │
│  │ [Free]  │ │ [Free]  │ │[Occupied]│ │ [Free]  │        │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘        │
│  ┌─────────────────┐ ┌─────────────────┐                 │
│  │       5         │ │       6         │                 │
│  │      ○○○○○○○○    │ │      ○○○○○○○○    │                 │
│  │     8 seats     │ │     8 seats     │                 │
│  │     [Reserved]  │ │     [Free]      │                 │
│  └─────────────────┘ └─────────────────┘                 │
├─────────────────────────────────────────────────────────────┤
│  ● Occupied (1)   ○ Free (5)   ◐ Reserved (1)            │
└─────────────────────────────────────────────────────────────┘
```

### Users Page (`/users`)

```
┌─────────────────────────────────────────────────────────────┐
│  Users                               [+ Add User]           │
├─────────────────────────────────────────────────────────────┤
│  Name / Email         │ Role       │ Status   │ Actions  │
│  ─────────────────────────────────────────────────────────│
│  John Doe             │ kasir      │ Active   │ [Edit]  │
│  john@cafe.com        │            │          │ [Delete]│
│  ─────────────────────────────────────────────────────────│
│  Jane Smith           │ manager    │ Active   │ [Edit]  │
│  jane@cafe.com       │            │          │ [Delete]│
│  ─────────────────────────────────────────────────────────│
│  Bob Wilson           │ owner      │ Active   │ [Edit]  │
│  bob@cafe.com         │            │          │ [Delete]│
│  ─────────────────────────────────────────────────────────│
│  Alice Brown         │ kasir      │ Inactive │ [Edit]  │
│  alice@cafe.com      │            │          │ [Delete]│
└─────────────────────────────────────────────────────────────┘
```

### Hardware Settings (`/settings/hardware`)

```
┌─────────────────────────────────────────────────────────────┐
│  Hardware Devices                                         │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 🖨️ Receipt Printer (TM-T82)           [Edit] [Delete]│  │
│  │    TCP: 192.168.1.100:9100          [Test] [✓]      │  │
│  │    Default: Yes                                     │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 💳 EDC Terminal (Verifone V200c)      [Edit] [Delete]│  │
│  │    TCP: 192.168.1.101:8080           [Test] [✓]      │  │
│  │    Default: Yes                                     │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 📦 Cash Drawer                         [Edit] [Delete]│  │
│  │    Connected via: Receipt Printer      [Test] [✓]     │  │
│  └──────────────────────────────────────────────────────┘  │
│  [+ Register New Device]                                  │
└─────────────────────────────────────────────────────────────┘
```

### Store Settings (`/settings/store`)

```
┌─────────────────────────────────────────────────────────────┐
│  Store Settings                                           │
├─────────────────────────────────────────────────────────────┤
│  Store Name          [Cafe Nusantara                    ] │
│  Address             [Jl. Sudirman No. 123              ] │
│  Phone               [021-1234567                      ] │
│                                                             │
│  Tax Rate (%)       [11                                    ] │
│  Currency           [IDR - Indonesian Rupiah ▼           ] │
│  Timezone           [Asia/Jakarta ▼                     ] │
│                                                             │
│  [Cancel]                              [Save Settings]      │
└─────────────────────────────────────────────────────────────┘
```

---

## Roles & Permissions

| Role | POS | Orders | Products | Stock | Reports | Users | Settings |
|------|-----|--------|----------|-------|---------|-------|----------|
| owner | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| manager | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| kasir | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| kitchen | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |

---

## API Integration

| Endpoint | Method | Use |
|----------|--------|-----|
| `/tables` | GET/POST | List/Create tables |
| `/tables/:id` | GET/PUT/DELETE | Table CRUD |
| `/users` | GET/POST | List/Create users |
| `/users/:id` | GET/PUT/DELETE | User CRUD |
| `/users/:id/password` | PUT | Change password |
| `/hardware/devices` | GET/POST | List/Create devices |
| `/hardware/devices/:id` | GET/PUT/DELETE | Device CRUD |
| `/hardware/devices/:id/test` | POST | Test device |
| `/settings` | GET/PUT | Store settings |

---

## Components

### TableCard
- Table number/name
- Capacity indicator
- Status (free/occupied/reserved)
- Tap to view/assign order

### UserRow
- Name and email
- Role badge
- Status (active/inactive)
- Action buttons

### RoleBadge
| Role | Color |
|------|-------|
| owner | Purple |
| manager | Blue |
| kasir | Green |
| kitchen | Orange |

### DeviceCard
- Device icon (printer/edc/drawer/scanner)
- Device name
- Connection info
- Status indicator
- Test button
- Edit/Delete actions

---

## Deliverables Checklist

- [ ] Tables page (`/tables`)
- [ ] Table visual grid
- [ ] Add/edit table modal
- [ ] User management page (`/users`)
- [ ] Add/edit user modal
- [ ] Role assignment
- [ ] Password change
- [ ] Hardware settings (`/settings/hardware`)
- [ ] Register device
- [ ] Test device connection
- [ ] Store settings (`/settings/store`)
- [ ] Profile settings

---

➡️ **[Back to Roadmap](../README.md)**
➡️ **[Next: Phase 13 - PWA Polish](./phase-13-pwa.md)**

---

*Document maintained by: thevoidsyntax*
