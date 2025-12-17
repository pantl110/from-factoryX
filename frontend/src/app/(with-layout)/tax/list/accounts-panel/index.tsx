import React from 'react';
import { MiniBtn, Panel } from '@/ui';
import Project from './project';
import TaxDetail from './tax-detail';
import TableArea from './table-area';

interface AccountsPanelProps {
  onClose: () => void;
}

const AccountsPanel = ({ onClose }: AccountsPanelProps) => {
  return (
    <Panel
      title="매출채권 관리"
      onClose={onClose}
      headerButton={<MiniBtn text="저장하기" variant="primary" />}
    >
      <div className="flex flex-col gap-10">
        {/* 연결된 프로젝트 */}
        <Project />

        {/* 매출 세금계산서 */}
        <TaxDetail />

        {/* 매출채권 테이블 */}
        <TableArea />
      </div>
    </Panel>
  );
};

export default AccountsPanel;
