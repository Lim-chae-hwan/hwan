'use server';

import { sql } from 'kysely';
import { kysely } from './kysely';
import { currentSoldier, fetchSoldier } from './soldiers';
import { checkIfSoldierHasPermission, hasPermission } from './utils';
import type { Permission } from '@/interfaces';

export async function fetchPoint(pointId: number) {
  return kysely
    .selectFrom('points')
    .where('id', '=', pointId)
    .leftJoin('soldiers as g', 'g.sn', 'points.giver_id')
    .leftJoin('soldiers as r', 'r.sn', 'points.receiver_id')
    .selectAll(['points'])
    .select(['r.name as receiver', 'g.name as giver'])
    .executeTakeFirst();
}

export async function listPoints(sn: string, page: number = 0) {
  const { type } = await kysely
    .selectFrom('soldiers')
    .where('sn', '=', sn)
    .select('type')
    .executeTakeFirstOrThrow();
  const query = kysely
    .selectFrom('points')
    .where(type === 'enlisted' ? 'receiver_id' : 'giver_id', '=', sn);

  const [data, { count }, usedPoints] = await Promise.all([
    query
      .orderBy('created_at desc')
      .select(['id'])
      .limit(20)
      .offset(Math.min(0, page) * 20)
      .execute(),
    query
      .select((eb) => eb.fn.count<string>('id').as('count'))
      .executeTakeFirstOrThrow(),
    type === 'enlisted' &&
      kysely
        .selectFrom('used_points')
        .where('user_id', '=', sn)
        .leftJoin('soldiers', 'soldiers.sn', 'used_points.recorded_by')
        .select('soldiers.name as recorded_by')
        .selectAll(['used_points'])
        .execute(),
  ]);
  return { data, count: parseInt(count, 10), usedPoints: usedPoints || null };
}

export async function fetchPendingPoints() {
  const current = await currentSoldier();

  // 공통: 아직 승인/반려 안 된 상벌점
  let query = kysely
    .selectFrom('points')
    .where('verified_at', 'is', null)
    .where('rejected_at', 'is', null);

  // ✅ 0) Admin 은 전체 미승인 상벌점 다 볼 수 있게
  const isAdmin = current.permissions.includes('Admin');
  if (isAdmin) {
    return query.selectAll().execute();
  }

  // ✅ 1) 중대장 권한 이름들
  const commanderPerms: Permission[] = [
    'AmmoCommander',
    'GuardCommander',
    'HqCommander',
  ];

  // ✅ 2) 내가 가진 중대장 권한만 추림
  const myCommanderPerms = commanderPerms.filter((perm) =>
    current.permissions.includes(perm),
  );

  if (myCommanderPerms.length > 0) {
    // ✅ 3) 중대장인 경우: 본인 역할(commander_role)에 해당하는 것만
    return query
      .where('commander_role', 'in', myCommanderPerms as readonly string[])
      .selectAll()
      .execute();
  }

  // ✅ 4) 중대장이 아닌 간부: 병사가 "나한테" 요청한 것만
  // (설계상 soldier가 요청할 때 수여자 군번을 giver_id 로 넣는 구조라면 OK)
  return query
    .where('giver_id', '=', current.sn!)
    .where('commander_role', 'is', null)
    .selectAll()
    .execute();
}


export async function deletePoint(pointId: number) {
  const { type, sn } = await currentSoldier();
  if (type === 'nco') {
    return { message: '간부는 상벌점을 지울 수 없습니다' };
  }
  const data = await fetchPoint(pointId);
  if (data == null) {
    return { message: '상벌점이 존재하지 않습니다' };
  }
  if (data.receiver_id !== sn) {
    return { message: '본인 상벌점만 삭제 할 수 있습니다' };
  }
  if (data.verified_at || data.rejected_at || data.rejected_reason) {
    return { message: '이미 수락, 반려, 사용한 상벌점은 지울 수 없습니다' };
  }
  try {
    await kysely
      .deleteFrom('points')
      .where('id', '=', pointId)
      .executeTakeFirstOrThrow();
  } catch (e) {
    return { message: '알 수 없는 오류가 발생했습니다' };
  }
  return { message: null };
}

export async function verifyPoint(
  pointId: number,
  value: boolean,
  rejectReason?: string,
) {
  const [point, current] = await Promise.all([
    fetchPoint(pointId),
    currentSoldier(),
  ]);

  if (point == null) {
    return { message: '본 상벌점이 존재하지 않습니다' };
  }

  if (current.type === 'enlisted') {
    return { message: '용사는 상벌점을 승인/반려 할 수 없습니다' };
  }

  if (!value && rejectReason == null) {
    return { message: '반려 사유를 입력해주세요' };
  }

  // ✅ commander_role 이 있으면 = 중대장 승인 단계
  const isCommanderApproval = point.commander_role != null;

  if (isCommanderApproval) {
    // 간부가 입력했고, 중대장이 최종 승인해야 하는 상벌점
    const commanderRole = point.commander_role as Permission;

    // 현재 사용자가 해당 중대장 권한을 가지고 있어야 승인 가능
    if (!hasPermission(current.permissions, [commanderRole])) {
      return { message: '해당 상벌점을 승인할 권한이 없습니다' };
    }

    // 점수 한도는 간부가 올릴 때(createPoint) 이미 체크했으니 여기선 안 해도 됨
  } else {
    // ✅ 병사가 요청한 상벌점: 기존 구조 유지
    if (point.giver_id !== current.sn) {
      return { message: '본인한테 요청된 상벌점만 승인/반려 할 수 있습니다' };
    }

    if (value) {
      const { message } = checkIfSoldierHasPermission(
        point.value,
        current.permissions,
      );
      if (message) {
        return { message };
      }
    }
  }

  try {
    await kysely
      .updateTable('points')
      .where('id', '=', pointId)
      .set({
        verified_at: value ? new Date() : null,
        rejected_at: !value ? new Date() : null,
        rejected_reason: rejectReason,
      })
      .executeTakeFirstOrThrow();
    return { message: null };
  } catch (e) {
    return { message: '승인/반려에 실패하였습니다' };
  }
}

export async function fetchPointSummary(sn: string) {
  const pointsQuery = kysely.selectFrom('points').where('receiver_id', '=', sn);
  const usedPointsQuery = kysely
    .selectFrom('used_points')
    .where('user_id', '=', sn);
  const [meritData, demeritData, usedMeritData] = await Promise.all([
    pointsQuery
      .where('value', '>', 0)
      .where('verified_at', 'is not', null) // verified_at이 null이 아닌 경우
      .select((eb) => eb.fn.sum<string>('value').as('value'))
      .executeTakeFirst(),
    pointsQuery
      .where('value', '<', 0)
      .where('verified_at', 'is not', null) // 승인된 상벌점만 가져오도록 수정
      .select((eb) => eb.fn.sum<string>('value').as('value'))
      .executeTakeFirst(),
    usedPointsQuery
      .where('value', '>', 0)
      .select((eb) => eb.fn.sum<string>('value').as('value'))
      .executeTakeFirst(),
  ]);
  return {
    merit: parseInt(meritData?.value ?? '0', 10),
    demerit: parseInt(demeritData?.value ?? '0', 10),
    usedMerit: parseInt(usedMeritData?.value ?? '0', 10),
  };
}


export async function createPoint({
  value,
  giverId,
  receiverId,
  reason,
  givenAt,
  commanderRole,
}: {
  value: number;
  giverId?: string | null;
  receiverId?: string | null;
  reason: string;
  givenAt: Date;
  // 중대장 승인 대상 역할 (탄약/경비/본부 중대장)
  commanderRole?: string | null;
}) {
  if (reason.trim() === '') {
    return { message: '상벌점 수여 이유를 작성해주세요' };
  }
  if (value !== Math.round(value)) {
    return { message: '상벌점은 정수여야 합니다' };
  }
  if (value === 0) {
    return { message: '1점 이상이거나 -1점 미만이어야합니다' };
  }

  const { type, sn, permissions } = await currentSoldier();
  if (
    (type === 'enlisted' && giverId == null) ||
    (type === 'nco' && receiverId == null)
  ) {
    return { message: '대상을 입력해주세요' };
  }

  const target = await fetchSoldier(
    type === 'enlisted' ? giverId! : receiverId!,
  );
  if (target == null) {
    return { message: '대상이 존재하지 않습니다' };
  }

  // ✅ 용사가 요청하는 경우 → 기존 로직 그대로 (간부 승인 대기)
  if (type === 'enlisted') {
    if (giverId === sn) {
      return { message: '스스로에게 수여할 수 없습니다' };
    }
    try {
      await kysely
        .insertInto('points')
        .values({
          given_at: givenAt,
          receiver_id: sn!,
          reason,
          giver_id: giverId!,
          value,
          verified_at: null,
        })
        .executeTakeFirstOrThrow();
      return { message: null };
    } catch (e) {
      return { message: '알 수 없는 오류가 발생했습니다' };
    }
  }

  // ✅ 간부가 상벌점을 부여하는 경우 (중대장 승인 대기)
  const { message } = checkIfSoldierHasPermission(value, permissions);
  if (message) {
    return { message };
  }

  // 어떤 중대장이 승인할지 반드시 선택해야 함
  if (!commanderRole) {
    return { message: '승인받을 중대장을 선택해주세요' };
  }

  try {
    await kysely
      .insertInto('points')
      .values({
        receiver_id: receiverId!,
        reason,
        giver_id: sn!, // 실제 상점을 입력한 간부
        given_at: givenAt,
        value,
        // 중대장 승인 전이므로 아직 최종 승인 X
        verified_at: null,
        rejected_at: null,
        rejected_reason: null,
        // 어느 중대장(역할)이 승인해야 하는지 저장
        commander_role: commanderRole,
      })
      .executeTakeFirstOrThrow();
    return { message: null };
  } catch (e) {
    return { message: '알 수 없는 오류가 발생했습니다' };
  }
}

export async function redeemPoint({
  value,
  userId,
  reason,
}: {
  value: number;
  userId: string;
  reason: string;
}) {
  if (reason.trim() === '') {
    return { message: '상벌점 사용 이유를 작성해주세요' };
  }
  if (value !== Math.round(value)) {
    return { message: '상벌점은 정수여야 합니다' };
  }
  if (value <= 0) {
    return { message: '1점 이상이어야합니다' };
  }
  const { type, sn, permissions } = await currentSoldier();
  if (sn == null) {
    return { message: '로그아웃후 재시도해 주세요' };
  }
  if (type === 'enlisted') {
    return { message: '용사는 상점을 사용할 수 없습니다' };
  }
  if (userId == null) {
    return { message: '대상을 입력해주세요' };
  }
  const target = await fetchSoldier(userId);
  if (target == null) {
    return { message: '대상이 존재하지 않습니다' };
  }
  if (!hasPermission(permissions, ['Admin', 'PointAdmin', 'UsePoint'])) {
    return { message: '권한이 없습니다' };
  }
  try {
    const [{ total }, { used_points }] = await Promise.all([
      kysely
        .selectFrom('points')
        .where('receiver_id', '=', userId)
        .select(({ fn }) =>
          fn
            .coalesce(fn.sum<string>('points.value'), sql<string>`0`)
            .as('total'),
        )
        .executeTakeFirstOrThrow(),
      kysely
        .selectFrom('used_points')
        .where('user_id', '=', userId)
        .select(({ fn }) =>
          fn
            .coalesce(fn.sum<string>('used_points.value'), sql<string>`0`)
            .as('used_points'),
        )
        .executeTakeFirstOrThrow(),
    ]);
    if (parseInt(total, 10) - parseInt(used_points, 10) < value) {
      return { message: '상점이 부족합니다' };
    }
    await kysely
      .insertInto('used_points')
      .values({
        user_id: userId,
        recorded_by: sn,
        reason,
        value,
      })
      .executeTakeFirstOrThrow();
    return { message: null };
  } catch (e) {
    return { message: '알 수 없는 오류가 발생했습니다' };
  }
}

export async function fetchPointTemplates() {
  return kysely.selectFrom('point_templates').selectAll().execute();
}
