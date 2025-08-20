// API Configuration for different environments

const getEnvironment = () => {
  // Check if we're running on ICP canister
  if (window.location.hostname.includes('.localhost') && window.location.port === '4943') {
    return 'icp-local';
  }
  
  // Check if we're running on ICP mainnet
  if (window.location.hostname.includes('.ic0.app') || window.location.hostname.includes('.icp0.io')) {
    return 'icp-mainnet';
  }
  
  // Check for Vite dev server
  if (window.location.port === '5173') {
    return 'vite-dev';
  }
  
  // Check for React dev server
  if (window.location.port === '3000') {
    return 'react-dev';
  }
  
  // Default to production
  return 'production';
};

const API_CONFIGS = {
  'vite-dev': {
    // FIXED: Remove /api from backend URL since we add it in the endpoints
    backend: 'http://localhost:5000',
    pqc: 'http://localhost:5001',
    frontend: 'http://localhost:5173'
  },
  'react-dev': {
    backend: 'http://localhost:5000',
    pqc: 'http://localhost:5001',
    frontend: 'http://localhost:3000'
  },
  'icp-local': {
    // FIXED: Remove /api from backend URL
    backend: 'http://localhost:5000',
    pqc: 'http://localhost:5001',
    frontend: window.location.origin
  },
  'icp-mainnet': {
    backend: 'https://your-backend-domain.com',
    pqc: 'https://your-pqc-service.com',
    frontend: window.location.origin
  },
  'production': {
    backend: 'https://your-backend-domain.com',
    pqc: 'https://your-pqc-service.com',
    frontend: window.location.origin
  }
};

const currentEnv = getEnvironment();
const config = API_CONFIGS[currentEnv] || API_CONFIGS['production'];

console.log(`🌍 Environment detected: ${currentEnv}`);
console.log(`🔗 API Config:`, config);
console.log(`🔗 Backend URL: ${config.backend}`);
console.log(`🔗 Frontend URL: ${config.frontend}`);

// FIXED: Now we properly add /api to construct the full API base URL
export const API_BASE_URL = `${config.backend}/api`;
export const PQC_SERVICE_URL = config.pqc;
export const FRONTEND_URL = config.frontend;
export const ENVIRONMENT = currentEnv;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    VERIFY: '/auth/verify'
  },
  POSTS: {
    CREATE: '/posts',
    GET_ALL: '/posts',
    GET_BY_ID: (id) => `/posts/${id}`,
    LIKE: (id) => `/posts/${id}/like`,
    SHARE: (id) => `/posts/${id}/share`,
    COMMENTS: (id) => `/posts/${id}/comments`,
    ADD_COMMENT: (id) => `/posts/${id}/comment`
  },
  USERS: {
    PROFILE: '/users/profile',
    UPDATE: '/users/update'
  },
  UPLOAD: {
    IMAGE: '/upload/image',
    BASE64: '/upload/base64',
    GET_IMAGE: (filename) => `/upload/image/${filename}`,
    DELETE_IMAGE: (filename) => `/upload/image/${filename}`
  },
};

export default config;