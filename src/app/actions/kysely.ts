import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import type { DB } from 'kysely-codegen';

export const kysely = new Kysely<DB>({
  dialect: new PostgresDialect({
    pool: new Pool({
      // Vercel에서는 DATABASE_URL, 로컬/Railway 개발환경에서는 POSTGRES_URL 사용
      connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
      // Vercel(프로덕션)에서 SSL 필요(공용 PG)
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
    }),
  }),
});
