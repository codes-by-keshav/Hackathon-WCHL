// API Configuration for different environments

const getEnvironment = () => {
  const hostname = window.location.hostname;
  const port = window.location.port;
  
  console.log('🔍 Detecting environment - hostname:', hostname, 'port:', port);
  
  // Check if running on ICP local development (any subdomain of localhost:4943)
  if (hostname.includes('.localhost') && port === '4943') {
    console.log('✅ ICP Local environment detected');
    return 'icp-local';
  }
  
  // Check if running on actual IC mainnet
  if (hostname.includes('.ic0.app') || hostname.includes('.raw.ic0.app')) {
    console.log('✅ ICP Mainnet environment detected');
    return 'icp-mainnet';
  }
  
  // Check development environments
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    if (port === '5173') {
      console.log('✅ Vite dev environment detected');
      return 'vite-dev';
    }
    if (port === '3000') {
      console.log('✅ React dev environment detected');
      return 'react-dev';
    }
  }
  
  console.log('✅ Production environment detected');
  return 'production';
};

const API_CONFIGS = {
  'vite-dev': {
    backend: 'http://localhost:5000/api',
    pqc: 'http://localhost:5001',
    frontend: 'http://localhost:5173'
  },
  'react-dev': {
    backend: 'http://localhost:5000/api',
    pqc: 'http://localhost:5001',
    frontend: 'http://localhost:3000'
  },
  'icp-local': {
    backend: 'http://localhost:5000/api',
    pqc: 'http://localhost:5001',
    frontend: window.location.origin
  },
  'icp-mainnet': {
    backend: 'https://your-backend-domain.com/api', // Update with your deployed backend
    pqc: 'https://your-pqc-service.com', // Update with your deployed PQC service
    frontend: window.location.origin
  },
  'production': {
    backend: 'https://your-backend-domain.com/api',
    pqc: 'https://your-pqc-service.com',
    frontend: window.location.origin
  }
};

const currentEnv = getEnvironment();
const config = API_CONFIGS[currentEnv];

console.log(`🌍 Environment detected: ${currentEnv}`);
console.log(`🔗 API Config:`, config);
console.log(`🔗 Full URL: ${window.location.href}`);

export const API_BASE_URL = config.backend;
export const PQC_SERVICE_URL = config.pqc;
export const FRONTEND_URL = config.frontend;
export const ENVIRONMENT = currentEnv;

export default config;