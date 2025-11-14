# Ad Stack Analyzer - Enterprise Ad Technology Analysis Platform

A sophisticated, enterprise-grade web application for comprehensive analysis of website advertising implementations, performance metrics, and optimization opportunities.

## 🚀 Features

### Core Analysis Capabilities
- **Google Publisher Tags (GPT) Detection**: Version detection, slot analysis, implementation type (SRA/Multi-request), lazy loading status
- **AdSense Analysis**: Auto ads detection, display ad inventory, client ID extraction
- **Header Bidding Detection**: Prebid.js analysis, Amazon TAM detection, bidder identification, timeout configuration
- **Ad Slot Analysis**: Fill rate calculation, slot positioning, viewability metrics
- **Performance Metrics**: Core Web Vitals, page load times, ad load performance
- **Console Error Detection**: Ad-related JavaScript errors, implementation issues
- **Viewability Analysis**: MRC compliance, viewability providers (MOAT, IAS, DoubleVerify)
- **Ad Density Calculation**: Above/below fold density, optimal density recommendations
- **Ad Refresh Detection**: Timer-based, visibility-based, scroll-based refresh patterns
- **CMP Detection**: GDPR/CCPA compliance, consent management platforms

### Additional Features
- **Real-time Analysis**: Instant website crawling and analysis
- **Detailed Recommendations**: Prioritized issues (Critical/High/Medium/Low)
- **Visual Dashboard**: Beautiful, modern UI with responsive design
- **Historical Tracking**: Store and compare analyses over time
- **Export Capabilities**: JSON, CSV, and PDF report generation
- **Enterprise-Ready**: Production-grade error handling, logging, and performance

## 🛠 Tech Stack

### Backend
- **Node.js** with Express.js
- **Puppeteer** for browser automation
- **Winston** for logging
- **Sequelize** ORM with SQLite/PostgreSQL
- **Bull** for job queuing
- **Joi** for validation

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development
- **TailwindCSS** for styling
- **Framer Motion** for animations
- **React Query** for data fetching
- **Recharts** for data visualization
- **Lucide React** for icons

## 📋 Prerequisites

- Node.js 18+ and npm 9+
- Chrome/Chromium browser (for Puppeteer)
- Redis (optional, for job queuing)
- PostgreSQL (optional, for production database)

## 🔧 Installation & Setup

### 1. Clone the repository
```bash
cd /Users/ashwin/github/atgp-analyzer/ad-stack-analyzer
```

### 2. Install Backend Dependencies
```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

### 4. Environment Configuration

Create/update `.env` file in the backend directory:
```env
PORT=5001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
DATABASE_URL=sqlite://./database.sqlite
REDIS_URL=redis://localhost:6379
LOG_LEVEL=info
```

### 5. Install Puppeteer Browser
```bash
cd backend
npx puppeteer browsers install chrome
```

## 🚀 Running the Application

### Development Mode

**Terminal 1 - Start Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Start Frontend:**
```bash
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5001

### Production Mode

**Build Frontend:**
```bash
cd frontend
npm run build
```

**Start Backend in Production:**
```bash
cd backend
NODE_ENV=production npm start
```

## 📱 Usage Guide

1. **Open the Application**: Navigate to http://localhost:3000
2. **Enter URL**: Input the website URL you want to analyze
3. **Start Analysis**: Click "Analyze Website" 
4. **View Results**: 
   - Overall score and grade
   - Fill rate statistics
   - Ad density metrics
   - Viewability analysis
5. **Review Recommendations**: Categorized by priority level
6. **Export Results**: Download as JSON, CSV, or PDF

## 🔍 API Endpoints

### Analysis Endpoints
- `POST /api/analyze/url` - Queue website analysis
- `POST /api/analyze/url/sync` - Synchronous analysis
- `GET /api/analyze/status/:jobId` - Check analysis status
- `GET /api/analyze/history` - Get analysis history
- `POST /api/analyze/compare` - Compare two analyses
- `GET /api/analyze/export/:analysisId` - Export analysis

### Health Endpoints
- `GET /api/health` - Service health check
- `GET /api/health/ready` - Readiness probe

## 🐳 Docker Deployment (Optional)

Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
    volumes:
      - ./data:/app/data
  
  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend
  
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
```

## 🔐 Security Considerations

- Implements rate limiting
- Input validation with Joi
- XSS protection with Helmet
- CORS properly configured
- Environment variables for sensitive data

## 🎯 Accuracy & Reliability

- **Browser Automation**: Uses Puppeteer for accurate, real-browser analysis
- **Multiple Detection Methods**: Cross-validates findings using multiple approaches
- **Error Handling**: Comprehensive error catching and reporting
- **Timeout Management**: Configurable timeouts for different analysis phases
- **Retry Logic**: Automatic retries for transient failures

## 📊 Performance Optimization

- Lazy loading for below-fold content
- Efficient DOM queries
- Parallel processing where possible
- Result caching
- Optimized Puppeteer configuration

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is proprietary and confidential.

## 🚨 Troubleshooting

### Common Issues

**Puppeteer Installation Issues:**
```bash
sudo apt-get install -y chromium-browser
# or on macOS:
brew install chromium
```

**Port Already in Use:**
```bash
# Find and kill process using port 5000
lsof -i :5000
kill -9 <PID>
```

**Memory Issues with Puppeteer:**
Add to backend server startup:
```javascript
--max-old-space-size=4096
```

## 📞 Support

For enterprise support and custom features, please contact the development team.

---

**Note**: This is an enterprise-grade application designed for production use. Ensure proper testing before deploying to production environments.
