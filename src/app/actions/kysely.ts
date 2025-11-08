// src/app/actions/kysely.ts
import { Kysely, PostgresDialect } from 'kysely';
import type { DB } from '@/types/db';           // ✅ 방금 생성한 타입을 여기서 import
import { Pool } from 'pg';

export const kysely = new Kysely<DB>({
  dialect: new PostgresDialect({
    pool: new Pool({
      connectionString: process.env.DATABASE_URL, // ✅ Vercel/Railway 모두 DATABASE_URL로 통일
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
    }),
  }),
});
