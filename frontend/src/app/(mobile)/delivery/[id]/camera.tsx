'use client';

import MoBarcodeScannerPage from '@/ui/barcode-scanner/mo-barcode-scanner-page';

interface CameraProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (result: string) => void;
}

const Camera = ({ isOpen, onClose, onScan }: CameraProps) => {
  return (
    <MoBarcodeScannerPage
      isOpen={isOpen}
      onClose={onClose}
      onScan={onScan}
      title="바코드 스캔"
    />
  );
};

export default Camera;
