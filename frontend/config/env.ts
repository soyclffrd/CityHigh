// Environment configuration
const ENV = {
  dev: {
    API_URL: 'http://localhost:3001/api',
    // Add other development environment variables here
  },
  'local-network': {
    API_URL: 'http://192.168.0.100:3001/api', // Your local network IP
  },
  prod: {
    API_URL: 'http://your-production-domain.com/api',
    // Add other production environment variables here
  },
  // Add more environments as needed
};

// Get the current environment
const getEnvVars = () => {
  // Try to get environment from localStorage first (for web)
  if (typeof window !== 'undefined') {
    const storedEnv = localStorage.getItem('APP_ENV');
    if (storedEnv && ENV[storedEnv as keyof typeof ENV]) {
      return ENV[storedEnv as keyof typeof ENV];
    }
  }

  // Fallback to NODE_ENV or default to dev
  const env = process.env.NODE_ENV || 'dev';
  return ENV[env as keyof typeof ENV] || ENV.dev;
};

// Export the environment variables
export const env = getEnvVars();

// Export a function to change environment (useful for development)
export const setEnvironment = (envName: keyof typeof ENV) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('APP_ENV', envName);
  }
  return ENV[envName];
}; 