// Status Script - scripts/status.js

// Service configurations
const services = [
    {
        name: 'API Gateway',
        url: 'http://localhost:3000/health',
        cardId: 'gatewayCard',
        responseTimeId: 'gatewayResponseTime',
        statusCodeId: 'gatewayStatusCode'
    },
    {
        name: 'Authentication Service',
        url: 'http://localhost:3001/health',
        cardId: 'authCard',
        responseTimeId: 'authResponseTime',
        statusCodeId: 'authStatusCode'
    }
];

// Status history
let statusHistory = [];
let totalRequests = 0;
let responseTimes = [];

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    checkAllServices();
    
    // Set up auto-refresh
    setInterval(checkAllServices, 30000); // Every 30 seconds
    
    // Initialize response time chart
    initializeChart();
});

// Check all services
async function checkAllServices() {
    const results = await Promise.all(services.map(checkService));
    updateOverallStatus(results);
    updateHistory(results);
    updateMetrics();
}

// Check individual service
async function checkService(service) {
    const startTime = Date.now();
    const card = document.getElementById(service.cardId);
    const statusElement = card.querySelector('.service-status');
    
    // Update to loading state
    statusElement.className = 'service-status loading';
    statusElement.textContent = 'Checking...';
    
    try {
        const response = await fetch(service.url, {
            method: 'GET',
            mode: 'cors',
            cache: 'no-cache'
        });
        
        const responseTime = Date.now() - startTime;
        const data = await response.json();
        
        // Update UI
        updateServiceCard(service, {
            online: response.ok,
            responseTime,
            statusCode: response.status,
            data
        });
        
        // Track metrics
        totalRequests++;
        responseTimes.push(responseTime);
        if (responseTimes.length > 20) responseTimes.shift(); // Keep last 20
        
        return {
            service: service.name,
            online: response.ok,
            responseTime,
            statusCode: response.status
        };
    } catch (error) {
        console.error(`Error checking ${service.name}:`, error);
        
        // Update UI for offline service
        updateServiceCard(service, {
            online: false,
            responseTime: null,
            statusCode: null,
            error: error.message
        });
        
        return {
            service: service.name,
            online: false,
            error: error.message
        };
    }
}

// Update service card UI
function updateServiceCard(service, status) {
    const card = document.getElementById(service.cardId);
    const statusElement = card.querySelector('.service-status');
    
    // Update status badge
    statusElement.className = `service-status ${status.online ? 'online' : 'offline'}`;
    statusElement.textContent = status.online ? 'Online' : 'Offline';
    
    // Update response time
    if (service.responseTimeId) {
        const responseTimeElement = document.getElementById(service.responseTimeId);
        responseTimeElement.textContent = status.responseTime ? `${status.responseTime}ms` : '-';
    }
    
    // Update status code
    if (service.statusCodeId) {
        const statusCodeElement = document.getElementById(service.statusCodeId);
        statusCodeElement.textContent = status.statusCode || '-';
    }
    
    // Add animation
    card.classList.add('fade-in');
    setTimeout(() => card.classList.remove('fade-in'), 500);
}

// Update overall status
function updateOverallStatus(results) {
    const overallStatus = document.getElementById('overallStatus');
    const allOnline = results.every(r => r.online);
    const allOffline = results.every(r => !r.online);
    
    if (allOnline) {
        overallStatus.className = 'overall-status all-online';
        overallStatus.querySelector('.status-text').textContent = 'All Systems Operational';
    } else if (allOffline) {
        overallStatus.className = 'overall-status offline';
        overallStatus.querySelector('.status-text').textContent = 'System Outage';
    } else {
        overallStatus.className = 'overall-status partial';
        overallStatus.querySelector('.status-text').textContent = 'Partial Outage';
    }
}

// Update history
function updateHistory(results) {
    const historyTimeline = document.getElementById('historyTimeline');
    const allOnline = results.every(r => r.online);
    const timestamp = new Date().toLocaleTimeString();
    
    // Add to history
    statusHistory.unshift({
        time: timestamp,
        status: allOnline ? 'All systems operational' : 'Service disruption detected',
        online: allOnline
    });
    
    // Keep only last 10 entries
    if (statusHistory.length > 10) statusHistory.pop();
    
    // Update UI
    historyTimeline.innerHTML = statusHistory.map(entry => `
        <div class="history-item">
            <span class="history-time">${entry.time}</span>
            <span class="history-status ${entry.online ? 'online' : 'offline'}">${entry.status}</span>
        </div>
    `).join('');
}

// Update metrics
function updateMetrics() {
    // Update total requests
    document.getElementById('totalRequests').textContent = totalRequests;
    
    // Calculate average response time
    if (responseTimes.length > 0) {
        const avgResponseTime = Math.round(
            responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        );
        document.getElementById('avgResponseTime').textContent = `${avgResponseTime}ms`;
    }
    
    // Update chart if available
    updateChart();
}

// Initialize response time chart (simple implementation)
function initializeChart() {
    const canvas = document.getElementById('responseTimeChart');
    if (!canvas) return;
    
    // Simple bar chart visualization
    canvas.style.width = '100%';
    canvas.style.height = '100px';
    canvas.style.background = 'var(--bg-secondary)';
    canvas.style.borderRadius = 'var(--radius-md)';
}

// Update chart
function updateChart() {
    const canvas = document.getElementById('responseTimeChart');
    if (!canvas || responseTimes.length === 0) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw bars
    const barWidth = width / responseTimes.length;
    const maxTime = Math.max(...responseTimes);
    
    responseTimes.forEach((time, index) => {
        const barHeight = (time / maxTime) * height * 0.8;
        const x = index * barWidth;
        const y = height - barHeight;
        
        // Draw bar
        ctx.fillStyle = time < 1000 ? '#10B981' : time < 2000 ? '#F59E0B' : '#EF4444';
        ctx.fillRect(x + 2, y, barWidth - 4, barHeight);
    });
}

// Manual refresh
window.checkAllServices = checkAllServices;