'use client';

import { useEffect, useState, useCallback } from 'react';
import { App, Button, Space, Table, Tag, Modal } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

// 서버 액션들 (이미 points.ts 에 있음)
import { fetchPendingPoints, verifyPoint } from '@/app/actions';

type PendingPoint = {
  id: number;
  // ✅ 날짜/시간 필드는 전부 Date | string 으로
  created_at: Date | string;
  given_at: Date | string;
  giver_id: string | null;
  reason: string | null;
  receiver_id: string;
  rejected_at: Date | string | null;
  rejected_reason: string | null;
  value: number;
  verified_at: Date | string | null;
  commander_role: string | null;
};


export default function ApprovePointsPage() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PendingPoint[]>([]);

  // ✅ 목록 불러오기
  const load = useCallback(async () => {
    try {
      setLoading(true);
      const result = await fetchPendingPoints();
      // result 가 any[] 라고 가정
      setData(result as PendingPoint[]);
    } catch (e) {
      message.error('상벌점 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    load();
  }, [load]);

  // ✅ 승인 처리
  const handleApprove = useCallback(
    async (record: PendingPoint) => {
      const { message: err } = await verifyPoint(record.id, true);
      if (err) {
        message.error(err);
        return;
      }
      message.success('상벌점을 승인했습니다.');
      load();
    },
    [message, load],
  );

  // ✅ 반려 처리
  const handleReject = useCallback(
    async (record: PendingPoint) => {
      const result = await Modal.confirm({
        title: '상벌점 반려',
        content: '반려 사유를 입력해주세요.',
        icon: null,
        okText: '반려',
        cancelText: '취소',
        centered: true,
        // antd confirm 에서는 입력창이 기본으로 없어서
        // 간단하게 window.prompt 를 쓸게요.
        // (추후에 별도 Modal + Input 으로 바꿀 수 있음)
        onOk: () => {},
      });

      // 위 confirm 구조가 살짝 복잡하니
      // 정말 간단하게 prompt 로 구현할 수도 있습니다.
    },
    [],
  );

  // 🔁 위 onReject 부분은 조금 복잡하니,
  // 간단한 버전으로 다시 구현하겠습니다.

  const handleRejectSimple = useCallback(
    async (record: PendingPoint) => {
      const reason = window.prompt('반려 사유를 입력해주세요.');
      if (!reason) {
        return;
      }
      const { message: err } = await verifyPoint(record.id, false, reason);
      if (err) {
        message.error(err);
        return;
      }
      message.success('상벌점을 반려했습니다.');
      load();
    },
    [message, load],
  );

  const columns: ColumnsType<PendingPoint> = [
    {
      title: '요청일',
      dataIndex: 'created_at',
      render: (value) => dayjs(value).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '받은 날짜',
      dataIndex: 'given_at',
      render: (value) => dayjs(value).format('YYYY-MM-DD'),
    },
    {
      title: '수여자(군번)',
      dataIndex: 'giver_id',
    },
    {
      title: '수령자(군번)',
      dataIndex: 'receiver_id',
    },
    {
      title: '점수',
      dataIndex: 'value',
      render: (value) =>
        value > 0 ? (
          <Tag color="blue">+{value}</Tag>
        ) : (
          <Tag color="red">{value}</Tag>
        ),
    },
    {
      title: '사유',
      dataIndex: 'reason',
    },
    {
      title: '승인 대상 중대장',
      dataIndex: 'commander_role',
      render: (role: string | null) => {
        if (!role) return '-';
        if (role === 'AmmoCommander') return '탄약 중대장';
        if (role === 'GuardCommander') return '경비 중대장';
        if (role === 'HqCommander') return '본부 중대장';
        return role;
      },
    },
    {
      title: '처리',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="primary" size="small" onClick={() => handleApprove(record)}>
            승인
          </Button>
          <Button danger size="small" onClick={() => handleRejectSimple(record)}>
            반려
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">상벌점 승인</h1>
      <Table
        rowKey="id"
        loading={loading}
        dataSource={data}
        columns={columns}
        pagination={{ pageSize: 20 }}
      />
    </div>
  );
}
