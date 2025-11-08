// src/app/actions/kysely.ts
import { Kysely, PostgresDialect } from 'kysely';
import type { DB } from 'kysely-codegen';
import { Pool } from 'pg';

export const kysely = new Kysely<DB>({
  dialect: new PostgresDialect({
    pool: new Pool({
      // Vercel과 Railway 둘 다 DATABASE_URL 사용
      connectionString: process.env.DATABASE_URL,
      // production 환경에서 SSL 적용
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
    }),
  }),
});
