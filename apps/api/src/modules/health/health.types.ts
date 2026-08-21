export type StorageProbeStepStatus = {
  upload: boolean;
  publicAccess: boolean;
};

export type StorageProbeResult = {
  driver: 'r2';
  status: 'ok' | 'error';
  steps: StorageProbeStepStatus;
  sampleUrl?: string;
  message: string;
};

export type HealthSummary = {
  status: 'ok';
  database: 'connected' | 'disconnected';
  storage: {
    driver: 'r2';
  };
};
