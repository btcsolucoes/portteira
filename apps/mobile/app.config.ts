import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  // Only the Pages export sets a prefix. Expo Go and local development stay at /.
  const baseUrl = (process.env.PORTTEIRA_BASE_PATH ?? '').replace(/\/$/, '');
  if (baseUrl && !/^\/[a-zA-Z0-9_-][a-zA-Z0-9._-]*$/.test(baseUrl)) {
    throw new Error('PORTTEIRA_BASE_PATH must be empty or a repository path such as /portteira.');
  }

  return {
    ...config,
    name: config.name ?? 'Portteira',
    slug: config.slug ?? 'portteira',
    experiments: { ...config.experiments, baseUrl },
  };
};
