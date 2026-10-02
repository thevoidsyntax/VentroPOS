// Database Migration Runner
// Usage: node scripts/migrate.js [up|down] [migration-number]

import pg from 'pg';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));

// Get database URL from environment or use default
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://ventropos:ventropos123@localhost:5432/ventropos';

async function runMigration(direction = 'up', migrationNumber = null) {
  const pool = new Pool({ connectionString: DATABASE_URL });

  try {
    // Get list of migration files - migrations are in src/infrastructure/database/migrations
    // scripts folder is at src/backend/scripts, so we need to go up and into infrastructure
    const migrationsDir = resolve(__dirname, '../src/infrastructure/database/migrations');
    const { existsSync } = await import('fs');

    if (!existsSync(migrationsDir)) {
      console.log(`Migrations directory not found: ${migrationsDir}`);
      return;
    }

    console.log(`Migrations directory: ${migrationsDir}`);
    const migrationFiles = await getMigrationFiles(migrationsDir, migrationNumber);

    if (migrationFiles.length === 0) {
      console.log('No migration files found.');
      return;
    }

    for (const file of migrationFiles) {
      const content = readFileSync(file, 'utf-8');
      const { up, down } = parseMigration(content);

      if (direction === 'up' && up) {
        console.log(`Running UP migration: ${file}`);
        await pool.query(up);
        await markMigration(pool, file);
        console.log(`✓ Migration applied: ${file}`);
      } else if (direction === 'down' && down) {
        console.log(`Running DOWN migration: ${file}`);
        await pool.query(down);
        await unmarkMigration(pool, file);
        console.log(`✓ Rollback applied: ${file}`);
      }
    }
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

async function getMigrationFiles(dir, number) {
  try {
    const { readdirSync } = await import('fs');
    const files = readdirSync(dir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    if (number) {
      const targetFile = files.find(f => f.startsWith(`${String(number).padStart(3, '0')}_`));
      return targetFile ? [resolve(dir, targetFile)] : [];
    }

    return files.map(f => resolve(dir, f));
  } catch {
    return [];
  }
}

function parseMigration(content) {
  const upMatch = content.match(/--\s*UP\s*Migration\s*([\s\S]*?)(?:--\s*DOWN|--\s*Down|$)/i);
  const downMatch = content.match(/--\s*DOWN\s*Migration\s*([\s\S]*?)$/i);

  return {
    up: upMatch ? upMatch[1].trim() : null,
    down: downMatch ? downMatch[1].trim() : null,
  };
}

async function markMigration(pool, file) {
  const name = file.split(/[/\\]/).pop().replace('.sql', '');
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query('INSERT INTO _migrations (name) VALUES ($1) ON CONFLICT DO NOTHING', [name]);
  } catch {
    // Table might already exist
  }
}

async function unmarkMigration(pool, file) {
  const name = file.split(/[/\\]/).pop().replace('.sql', '');
  await pool.query('DELETE FROM _migrations WHERE name = $1', [name]);
}

// Parse command line arguments
const args = process.argv.slice(2);
const direction = args[0] === 'down' ? 'down' : 'up';
const migrationNumber = args[1] ? parseInt(args[1]) : null;

runMigration(direction, migrationNumber);
