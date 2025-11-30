import { PointRequestList } from '../components/PointRequestList';

export default function ApprovePointsPage() {
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">상벌점 승인</h1>

      {/* 카드형 승인 UI 그대로 사용 */}
      <PointRequestList />
    </div>
  );
}
