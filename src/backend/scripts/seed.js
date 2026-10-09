// Database Seed Script
// Usage: node scripts/seed.js

import pg from 'pg';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { config as dotenv } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Load .env file explicitly
dotenv({ path: resolve(dirname(fileURLToPath(import.meta.url)), '.env' });

const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/ventropos';
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12');

async function seed() {
  const pool = new Pool({ connectionString: DATABASE_URL });

  try {
    console.log('🌱 Seeding database...');

    // Check if already seeded
    const existingTenant = await pool.query('SELECT id FROM tenants LIMIT 1');
    if (existingTenant.rows.length > 0) {
      console.log('⚠️  Database already seeded. Skipping...');
      return;
    }

    const tenantId = randomUUID();
    const ownerId = randomUUID();
    const managerId = randomUUID();
    const categoryId = randomUUID();
    const productId = randomUUID();

    // Create tenant
    await pool.query(`
      INSERT INTO tenants (id, name, plan, is_active, settings)
      VALUES ($1, 'Demo Cafe', 'premium', true, '{}')
    `, [tenantId]);
    console.log('✓ Created tenant');

    // Create owner user
    const ownerPassword = await bcrypt.hash('owner123', BCRYPT_ROUNDS);
    await pool.query(`
      INSERT INTO users (id, tenant_id, email, password_hash, name, role, is_active)
      VALUES ($1, $2, 'owner@demo.com', $3, 'Demo Owner', 'owner', true)
    `, [ownerId, tenantId, ownerPassword]);
    console.log('✓ Created owner user (owner@demo.com / owner123)');

    // Create manager user
    const managerPassword = await bcrypt.hash('manager123', BCRYPT_ROUNDS);
    await pool.query(`
      INSERT INTO users (id, tenant_id, email, password_hash, name, role, is_active)
      VALUES ($1, $2, 'manager@demo.com', $3, 'Demo Manager', 'manager', true)
    `, [managerId, tenantId, managerPassword]);
    console.log('✓ Created manager user (manager@demo.com / manager123)');

    // Create category
    await pool.query(`
      INSERT INTO categories (id, tenant_id, name, sort_order, is_active)
      VALUES ($1, $2, 'Beverages', 1, true)
    `, [categoryId, tenantId]);
    console.log('✓ Created category: Beverages');

    // Create products
    await pool.query(`
      INSERT INTO products (id, tenant_id, name, sku, category_id, price, cost, stock_quantity, low_stock_threshold, is_active, is_serialized)
      VALUES ($1, $2, 'Espresso', 'ESP001', $3, 18000, 8000, 100, 20, true, false)
    `, [productId, tenantId, categoryId]);

    await pool.query(`
      INSERT INTO products (id, tenant_id, name, sku, category_id, price, cost, stock_quantity, low_stock_threshold, is_active, is_serialized)
      VALUES ($1, $2, 'Cappuccino', 'CAP001', $3, 25000, 10000, 80, 15, true, false)
    `, [randomUUID(), tenantId, categoryId]);

    await pool.query(`
      INSERT INTO products (id, tenant_id, name, sku, category_id, price, cost, stock_quantity, low_stock_threshold, is_active, is_serialized)
      VALUES ($1, $2, 'Latte', 'LAT001', $3, 22000, 9000, 90, 18, true, false)
    `, [randomUUID(), tenantId, categoryId]);
    console.log('✓ Created 3 products');

    // Create tables
    for (let i = 1; i <= 5; i++) {
      await pool.query(`
        INSERT INTO restaurant_tables (id, tenant_id, table_number, capacity, status)
        VALUES ($1, $2, $3, 4, 'available')
      `, [randomUUID(), tenantId, String(i).padStart(2, '0')]);
    }
    console.log('✓ Created 5 tables');

    console.log('\n🎉 Database seeded successfully!');
    console.log('\nLogin credentials:');
    console.log('  Owner:   owner@demo.com / owner123');
    console.log('  Manager: manager@demo.com / manager123');

  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
