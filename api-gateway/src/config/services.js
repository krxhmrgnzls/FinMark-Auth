const serviceConfig = {
  auth: {
    url: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    prefix: '/auth',
    timeout: 30000, // 30 seconds
    retry: 3,
    healthEndpoint: '/health',
    status: 'unknown',
    lastCheck: null
  },

  financial: {
    url: process.env.FINANCIAL_SERVICE_URL || 'http://localhost:3002',
    prefix: '/financial',
    timeout: 30000,
    retry: 3,
    healthEndpoint: '/health',
    status: 'unknown',
    lastCheck: null
  }
};

module.exports = {
  services: serviceConfig,
  getServiceStatus: () => {
    const status = {};
    Object.entries(serviceConfig).forEach(([name, service]) => {
      status[name] = {
        url: service.url,
        status: service.status,
        lastCheck: service.lastCheck
      };
    });
    return status;
  }
};