export const env = process.env.NODE_ENV || 'development';
export const API_BASE_URL =
  env === 'development'
    ? 'http://localhost:3001'
    : env === 'production'
    ? 'https://api4.services.joinfire.xyz'
    : 'https://staging.api.services.joinfire.xyz';

export const SIMULATOR_URL =
  env === 'development'
    ? 'http://localhost:3000'
    : env === 'production'
    ? 'https://app.joinfire.xyz/'
    : 'https://staging.app.joinfire.xyz/';
