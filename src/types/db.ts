import type { ColumnType } from "kysely";

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;

export type SoldiersType = "enlisted" | "nco";

export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export interface _PrismaMigrations {
  applied_steps_count: Generated<number>;
  checksum: string;
  finished_at: Timestamp | null;
  id: string;
  logs: string | null;
  migration_name: string;
  rolled_back_at: Timestamp | null;
  started_at: Generated<Timestamp>;
}

export interface Overtimes {
  created_at: Generated<Timestamp>;
  ended_at: Timestamp;
  giver_id: string;
  id: Generated<number>;
  reason: string | null;
  receiver_id: string;
  started_at: Timestamp;
  value: number;
  verified_at: Timestamp | null;
}

export interface Permissions {
  created_at: Generated<Timestamp>;
  id: Generated<number>;
  soldiers_id: string;
  value: string;
}

export interface Points {
  created_at: Generated<Timestamp>;
  given_at: Timestamp;
  giver_id: string;
  id: Generated<number>;
  reason: string | null;
  receiver_id: string;
  rejected_at: Timestamp | null;
  rejected_reason: string | null;
  value: number;
  verified_at: Timestamp | null;
}

export interface PointTemplates {
  demerit: number | null;
  id: Generated<number>;
  merit: number | null;
  reason: string;
  unit: string | null;
}

export interface Soldiers {
  created_at: Generated<Timestamp>;
  deleted_at: Timestamp | null;
  deleted_by: string | null;
  name: string;
  password: string;
  rejected_at: Timestamp | null;
  sn: string;
  type: SoldiersType;
  verified_at: Timestamp | null;
}

export interface UsedPoints {
  created_at: Generated<Timestamp>;
  id: Generated<number>;
  reason: string | null;
  recorded_by: string;
  user_id: string;
  value: number;
}

export interface DB {
  _prisma_migrations: _PrismaMigrations;
  overtimes: Overtimes;
  permissions: Permissions;
  point_templates: PointTemplates;
  points: Points;
  soldiers: Soldiers;
  used_points: UsedPoints;
}
