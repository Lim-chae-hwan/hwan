// src/app/actions/kysely.ts
import { Kysely, PostgresDialect } from 'kysely';
import type { DB } from '@/types/db';
import { Pool } from 'pg';

// 🔑 POSTGRES_URL을 우선 사용, 없으면 DATABASE_URL 사용
const connectionString =
  process.env.POSTGRES_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('Database connection string is not set');
}

export const kysely = new Kysely<DB>({
  dialect: new PostgresDialect({
    pool: new Pool({
      connectionString,
      ssl:
        process.env.NODE_ENV === 'production'
          ? { rejectUnauthorized: false }
          : undefined,
    }),
  }),
});
