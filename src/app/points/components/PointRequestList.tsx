import { fetchPendingPoints } from '@/app/actions';
import { PointRequestCard } from '.';
import { PointRequestListInner } from './PointRequestListInner';

export async function PointRequestList() {
  const data = await fetchPendingPoints();

  // ❗ 여기서는 데이터만 가져오고,
  // 화면 렌더링은 클라이언트 컴포넌트(PointRequestListInner)가 담당합니다.
  return <PointRequestListInner data={data} />;
}
