export const BASE_URL = __ENV.API_BASE_URL || 'http://host.docker.internal:3000';

export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
};

export const JWT_SECRET = __ENV.JWT_SECRET;
