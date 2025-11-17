'use client';

import Empty from 'antd/es/empty';
import { PointRequestCard } from '.';

export type PointRequestListInnerProps = {
  data: { id: number }[];
};

export function PointRequestListInner({ data }: PointRequestListInnerProps) {
  if (data.length === 0) {
    return (
      <div className="py-5 my-5">
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={<p>요청된 상벌점이 없습니다</p>}
        />
      </div>
    );
  }

  return (
    <>
      {data.map(({ id }) => (
        <PointRequestCard key={id} pointId={id} />
      ))}
    </>
  );
}
