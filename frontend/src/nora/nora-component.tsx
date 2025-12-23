'use client';

import { Nora } from '@teamwise/nora-sdk';
import { noraClient } from '@/nora/nora-client';
import { noraUser, noraTheme, noraConfig } from '@/nora/nora-config';

const NoraComponent = () => {
  return (
    <Nora
      client={noraClient}
      user={noraUser}
      theme={noraTheme}
      config={noraConfig}
      injectGlobalStyles={false}
    />
  );
};

export default NoraComponent;
