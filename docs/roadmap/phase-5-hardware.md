# Phase 5: Hardware Integration

> **Version:** 1.0.0
> **Status:** ✅ Completed
> **Completed:** 2026

---

## Overview

Phase 5 implements POS hardware integration including receipt printer (ESC/POS), EDC terminal for card payments, barcode scanner support, and cash drawer control.

---

## Objectives

1. ✅ Receipt printer integration (ESC/POS over TCP)
2. ✅ EDC terminal integration (Payment Gateway)
3. ✅ Barcode scanner support (USB HID / Web Serial)
4. ✅ Cash drawer control (POS Protocol via Relay)
5. ✅ Device management & logging

---

## Hardware Device Types

| Type | Protocol | Connection |
|------|----------|------------|
| `printer` | ESC/POS | TCP, USB |
| `edc` | TCP Socket | Ethernet |
| `scanner` | USB HID | USB |
| `drawer` | POS Protocol | USB, Parallel |

---

## New API Endpoints

### Device Management
```
GET    /hardware/devices           - List registered devices
POST   /hardware/devices           - Register new device
GET    /hardware/devices/:id       - Get device details
PUT    /hardware/devices/:id       - Update device config
DELETE /hardware/devices/:id       - Remove device
POST   /hardware/devices/:id/test  - Test device connection
```

### Print Operations
```
POST   /hardware/print             - Print receipt
POST   /hardware/print/kitchen     - Print kitchen ticket
POST   /hardware/print/invoice     - Print invoice
```

### EDC Operations
```
POST   /hardware/edc/payment        - Initiate EDC payment
POST   /hardware/edc/cancel        - Cancel EDC transaction
POST   /hardware/edc/settle        - Settlement (end of day)
GET    /hardware/edc/status/:id    - Check payment status
```

### Scanner & Drawer
```
POST   /hardware/scan              - Record barcode scan event
POST   /hardware/drawer/open       - Open cash drawer
```

### Logs
```
GET    /hardware/logs              - Hardware event logs
```

---

## Device Registration

### Printer Config
```json
{
  "deviceType": "printer",
  "name": "Receipt Printer TM-T82",
  "connectionType": "tcp",
  "config": {
    "ip": "192.168.1.100",
    "port": 9100,
    "paperWidth": 80
  },
  "isDefault": true
}
```

### EDC Config
```json
{
  "deviceType": "edc",
  "name": "EDC Verifone V200c",
  "connectionType": "tcp",
  "config": {
    "ip": "192.168.1.101",
    "port": 8080,
    "merchantId": "MERCHANT001",
    "terminalId": "TERM001"
  },
  "isDefault": true
}
```

---

## Print Operations

### Receipt Print
```json
POST /hardware/print
{
  "orderId": "uuid",
  "deviceId": "uuid",
  "type": "receipt",
  "options": {
    "showQrCode": true,
    "showBarcode": true,
    "copies": 1
  }
}
```

### Kitchen Ticket
```json
POST /hardware/print/kitchen
{
  "orderId": "uuid",
  "deviceId": "uuid",
  "priority": "rush",
  "items": [
    { "name": "Kopi Americano", "qty": 2, "notes": "Less sugar" }
  ]
}
```

---

## EDC Payment Flow

```
1. POST /hardware/edc/payment
   └─ Request: orderId, amount, paymentMethod (debit/credit)
   └─ Response: transactionId, status: pending

2. EDC Terminal shows payment request

3. Customer completes payment on EDC

4. Backend receives callback OR
   GET /hardware/edc/status/:id
   └─ Response: status: success|failed|timeout

5. If success:
   └─ Complete order checkout
   └─ Log transaction
```

### Settlement (End of Day)
```json
POST /hardware/edc/settle
{
  "deviceId": "uuid"
}
```
Settles all pending transactions and closes the EDC batch.

---

## Database Schema

### hardware_devices
```sql
CREATE TABLE hardware_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    device_type VARCHAR(20) NOT NULL CHECK (device_type IN ('printer', 'edc', 'scanner', 'drawer')),
    name VARCHAR(100) NOT NULL,
    connection_type VARCHAR(20) NOT NULL CHECK (connection_type IN ('usb', 'serial', 'tcp', 'bluetooth')),
    config JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### hardware_logs
```sql
CREATE TABLE hardware_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    device_id UUID REFERENCES hardware_devices(id),
    event_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
    request_data JSONB,
    response_data JSONB,
    error_message TEXT,
    duration_ms INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## Files Created/Modified

### Phase 5.1 - Device Foundation
```
src/domain/entities/hardware.ts
src/domain/repositories/hardware.ts
src/infrastructure/database/repositories/hardware.ts
src/application/hardware/index.ts
src/application/hardware/device.service.ts
src/api/routes/hardware.routes.ts
migrations/006_hardware_tables.sql
```

### Phase 5.2 - Receipt Printer
```
src/infrastructure/hardware/drivers/escpos.driver.ts
src/application/hardware/print.service.ts
src/api/routes/print.routes.ts
```

### Phase 5.3 - EDC Terminal
```
src/infrastructure/hardware/drivers/edc.driver.ts
src/application/hardware/edc.service.ts
src/api/routes/edc.routes.ts
```

### Phase 5.4 - Scanner & Drawer
```
src/application/hardware/scanner.service.ts
src/application/hardware/drawer.service.ts
src/api/routes/hardware-misc.routes.ts
```

### Tests
```
tests/unit/hardware.test.ts (17 tests)
```

---

## Test Coverage

```
✅ 17 tests passing (hardware.test.ts)
  - Device CRUD operations
  - Barcode validation (EAN-13, UPC, Code 128, QR)
  - EDC transaction status
  - Cash drawer operations
  - Kitchen ticket priority
```

---

## Acceptance Criteria

| ID | Criteria | Status |
|----|----------|--------|
| AC-01 | Can register printer device | ✅ |
| AC-02 | Can register EDC device | ✅ |
| AC-03 | Receipt prints correctly via TCP | ✅ |
| AC-04 | Kitchen ticket prints with priority | ✅ |
| AC-05 | EDC payment initiates correctly | ✅ |
| AC-06 | EDC settlement closes batch | ✅ |
| AC-07 | Cash drawer opens on command | ✅ |
| AC-08 | Barcode scan events logged | ✅ |
| AC-09 | Hardware logs stored correctly | ✅ |

---

➡️ **[Back to Roadmap](../README.md)**
➡️ **[Next: Phase 6 - Audit & Refactoring](./phase-6-audit.md)**

---

*Document maintained by: thevoidsyntax*
