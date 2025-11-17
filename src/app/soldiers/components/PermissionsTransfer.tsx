import { Permission } from '@/interfaces';
import { Tree } from 'antd';
import { ALL_PERMISSIONS } from '../signup/constants';

export type PermissionsTransferProps = {
  permissions: Permission[];
  onChange?: (newPermissions: Permission[]) => void;
};

export function PermissionsTransfer({
  permissions,
  onChange,
}: PermissionsTransferProps) {
  return (
    <Tree
      className='my-2'
      defaultExpandAll
      checkedKeys={permissions}
      blockNode
      selectable={false}
      checkable
      onCheck={(checked) => {
        onChange?.(checked as Permission[]);
      }}
      treeData={[
        {
          // 최상위: Admin
          ...ALL_PERMISSIONS.Admin,
          key: 'Admin',
          children: [
            // 유저 관련 권한 묶음
            {
              ...ALL_PERMISSIONS.UserAdmin,
              children: Object.values(ALL_PERMISSIONS).filter(({ key }) =>
                key.endsWith('User'),
              ),
            },
            // 상벌점 관련 권한 묶음
            {
              ...ALL_PERMISSIONS.PointAdmin,
              children: Object.values(ALL_PERMISSIONS).filter(({ key }) =>
                key.endsWith('Point'),
              ),
            },
            // ✅ 여기 "중대장 권한" 묶음 추가
            {
              title: '중대장 권한',
              key: 'CommanderGroup', // 그룹용 가짜 key
              children: [
                ALL_PERMISSIONS.AmmoCommander,
                ALL_PERMISSIONS.GuardCommander,
                ALL_PERMISSIONS.HqCommander,
              ],
            },
          ],
        },
      ]}
    />
  );
}
