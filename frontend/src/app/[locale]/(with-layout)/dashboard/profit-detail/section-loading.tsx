'use client';

import Spinner from '@/ui/spinner';

const SectionLoading = ({ height }: { height: string }) => (
  <div className={`flex items-center justify-center ${height}`}>
    <Spinner />
  </div>
);

export default SectionLoading;
