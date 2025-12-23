import { NoraClient } from '@teamwise/nora-sdk';

const API_KEY = process.env.NEXT_PUBLIC_NORA_SECRET_KEY ?? '';

export const noraClient = new NoraClient(API_KEY);
