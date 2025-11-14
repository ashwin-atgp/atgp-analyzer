import puppeteer from 'puppeteer';
import UserAgent from 'user-agents';
import { logger } from '../server.js';
import { detectAdTech } from './detectors/adTechDetector.js';
import { analyzePerformance } from './analyzers/performanceAnalyzer.js';
import { analyzeViewability } from './analyzers/viewabilityAnalyzer.js';
import { generateRecommendations } from './recommendations/recommendationEngine.js';

class AdAnalyzer {
  constructor() {
    this.browser = null;
    this.page = null;
    this.consoleLogs = [];
    this.networkRequests = [];
  }

  async initialize() {
    try {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
          '--enable-webgl',
          '--window-size=1920,1080'
        ]
      });
      
      this.page = await this.browser.newPage();
      
      // Set user agent
      const userAgent = new UserAgent();
      await this.page.setUserAgent(userAgent.toString());
      
      // Set viewport
      await this.page.setViewport({ width: 1920, height: 1080 });
      
      // Enable console log capture
      this.page.on('console', msg => {
        this.consoleLogs.push({
          type: msg.type(),
          text: msg.text(),
          location: msg.location()
        });
      });
      
      // Enable request interception
      await this.page.setRequestInterception(true);
      
      this.page.on('request', request => {
        this.networkRequests.push({
          url: request.url(),
          method: request.method(),
          resourceType: request.resourceType(),
          timestamp: Date.now()
        });
        request.continue();
      });
      
      this.page.on('response', response => {
        const request = this.networkRequests.find(r => r.url === response.url());
        if (request) {
          request.status = response.status();
          request.statusText = response.statusText();
        }
      });
      
    } catch (error) {
      logger.error('Failed to initialize browser:', error);
      throw error;
    }
  }

  async analyze(url) {
    try {
      if (!this.browser || !this.page) {
        await this.initialize();
      }

      logger.info(`Starting analysis for: ${url}`);
      
      // Reset logs
      this.consoleLogs = [];
      this.networkRequests = [];
      
      // Navigate to URL
      await this.page.goto(url, {
        waitUntil: ['networkidle0', 'domcontentloaded'],
        timeout: 30000
      });
      
      // Wait for potential ad loads
      await this.page.waitForTimeout(5000);
      
      // Scroll to trigger lazy-loaded ads
      await this.autoScroll(this.page);
      
      // Perform comprehensive analysis
      const analysisResults = await this.performAnalysis();
      
      return {
        url,
        timestamp: new Date().toISOString(),
        success: true,
        ...analysisResults
      };
      
    } catch (error) {
      logger.error(`Analysis failed for ${url}:`, error);
      return {
        url,
        timestamp: new Date().toISOString(),
        success: false,
        error: error.message
      };
    }
  }

  async performAnalysis() {
    const results = {};
    
    // Detect ad technologies
    const adTechData = await detectAdTech(this.page);
    results.adTechnology = adTechData;
    
    // Analyze ad slots
    results.adSlots = await this.analyzeAdSlots();
    
    // Check console errors
    results.consoleAnalysis = this.analyzeConsoleLogs();
    
    // Analyze network requests
    results.networkAnalysis = this.analyzeNetworkRequests();
    
    // Calculate ad density
    results.adDensity = await this.calculateAdDensity();
    
    // Check viewability
    results.viewability = await analyzeViewability(this.page);
    
    // Get performance metrics
    results.performance = await analyzePerformance(this.page);
    
    // Generate recommendations
    results.recommendations = generateRecommendations(results);
    
    // Calculate overall score
    results.overallScore = this.calculateScore(results);
    
    return results;
  }

  async analyzeAdSlots() {
    return await this.page.evaluate(() => {
      const slots = [];
      
      // Find all potential ad containers
      const adSelectors = [
        '[id*="ad"]', '[id*="Ad"]', '[id*="AD"]',
        '[class*="ad"]', '[class*="Ad"]', '[class*="AD"]',
        '[data-ad]', '[data-google-query-id]',
        'ins.adsbygoogle', 'amp-ad', 'div[id^="div-gpt-ad"]',
        'iframe[id*="google_ads"]', 'iframe[src*="doubleclick.net"]'
      ];
      
      const adElements = new Set();
      adSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => adElements.add(el));
      });
      
      adElements.forEach(element => {
        const rect = element.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(element);
        
        // Skip hidden elements
        if (computedStyle.display === 'none' || 
            computedStyle.visibility === 'hidden' || 
            rect.width === 0 || rect.height === 0) {
          return;
        }
        
        const slot = {
          id: element.id,
          className: element.className,
          tagName: element.tagName.toLowerCase(),
          size: { width: rect.width, height: rect.height },
          position: {
            top: rect.top + window.scrollY,
            left: rect.left + window.scrollX
          },
          viewport: {
            inViewport: rect.top < window.innerHeight && rect.bottom > 0,
            viewportPercentage: Math.max(0, Math.min(100, 
              ((Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0)) / 
              rect.height) * 100))
          },
          filled: !!(element.querySelector('iframe') || element.innerHTML.trim().length > 100),
          type: 'unknown'
        };
        
        // Determine ad type
        if (element.id && element.id.includes('div-gpt-ad')) {
          slot.type = 'GPT';
        } else if (element.classList.contains('adsbygoogle')) {
          slot.type = 'AdSense';
        } else if (element.tagName === 'amp-ad') {
          slot.type = 'AMP';
        }
        
        slots.push(slot);
      });
      
      return {
        totalSlots: slots.length,
        filledSlots: slots.filter(s => s.filled).length,
        fillRate: slots.length > 0 ? 
          (slots.filter(s => s.filled).length / slots.length * 100).toFixed(2) + '%' : '0%',
        slotDetails: slots
      };
    });
  }

  analyzeConsoleLogs() {
    const adRelatedErrors = this.consoleLogs.filter(log => {
      const text = log.text.toLowerCase();
      const adKeywords = ['gpt', 'googletag', 'adsense', 'prebid', 'pbjs', 'ad', 'dfp'];
      return log.type === 'error' && adKeywords.some(keyword => text.includes(keyword));
    });
    
    const warnings = this.consoleLogs.filter(log => {
      const text = log.text.toLowerCase();
      const adKeywords = ['gpt', 'googletag', 'adsense', 'prebid'];
      return log.type === 'warning' && adKeywords.some(keyword => text.includes(keyword));
    });
    
    return {
      errors: adRelatedErrors,
      warnings: warnings,
      errorCount: adRelatedErrors.length,
      warningCount: warnings.length,
      hasIssues: adRelatedErrors.length > 0 || warnings.length > 0
    };
  }

  analyzeNetworkRequests() {
    const adNetworks = {
      'doubleclick.net': 'Google DFP/AdSense',
      'googlesyndication.com': 'Google AdSense',
      'googletagservices.com': 'Google Publisher Tag',
      'amazon-adsystem.com': 'Amazon APS',
      'criteo.com': 'Criteo',
      'pubmatic.com': 'PubMatic',
      'appnexus.com': 'AppNexus'
    };
    
    const detectedNetworks = new Set();
    let totalAdRequests = 0;
    const failedRequests = [];
    
    this.networkRequests.forEach(request => {
      Object.keys(adNetworks).forEach(domain => {
        if (request.url.includes(domain)) {
          detectedNetworks.add(adNetworks[domain]);
          totalAdRequests++;
          
          if (request.status && request.status >= 400) {
            failedRequests.push({
              url: request.url,
              status: request.status,
              network: adNetworks[domain]
            });
          }
        }
      });
    });
    
    return {
      detectedNetworks: Array.from(detectedNetworks),
      totalAdRequests,
      failedRequests,
      hasFailures: failedRequests.length > 0
    };
  }

  async calculateAdDensity() {
    return await this.page.evaluate(() => {
      const pageHeight = document.body.scrollHeight;
      const viewportHeight = window.innerHeight;
      const pageWidth = document.body.scrollWidth;
      
      let totalAdArea = 0;
      const adElements = document.querySelectorAll('[id*="ad"], [class*="ad"], ins.adsbygoogle');
      
      adElements.forEach(element => {
        const rect = element.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(element);
        
        if (computedStyle.display !== 'none' && 
            computedStyle.visibility !== 'hidden' && 
            rect.width > 0 && rect.height > 0) {
          totalAdArea += (rect.width * rect.height);
        }
      });
      
      const totalPageArea = pageHeight * pageWidth;
      const visiblePageArea = viewportHeight * pageWidth;
      
      return {
        totalAdArea,
        totalPageArea,
        adDensityTotal: ((totalAdArea / totalPageArea) * 100).toFixed(2) + '%',
        adDensityViewport: ((totalAdArea / visiblePageArea) * 100).toFixed(2) + '%',
        isOptimal: (totalAdArea / visiblePageArea) <= 0.3
      };
    });
  }

  calculateScore(results) {
    let score = 100;
    const issues = [];
    
    // Deduct points for errors
    if (results.consoleAnalysis.errorCount > 0) {
      score -= results.consoleAnalysis.errorCount * 5;
      issues.push(`${results.consoleAnalysis.errorCount} console errors`);
    }
    
    // Deduct points for failed network requests
    if (results.networkAnalysis.failedRequests.length > 0) {
      score -= results.networkAnalysis.failedRequests.length * 3;
      issues.push(`${results.networkAnalysis.failedRequests.length} failed ad requests`);
    }
    
    // Deduct points for poor fill rate
    const fillRate = parseFloat(results.adSlots.fillRate);
    if (fillRate < 70) {
      score -= (70 - fillRate) * 0.5;
      issues.push(`Low fill rate: ${fillRate}%`);
    }
    
    // Deduct points for high ad density
    if (!results.adDensity.isOptimal) {
      score -= 10;
      issues.push('High ad density');
    }
    
    // Deduct points for poor viewability
    if (!results.viewability.mrcCompliant) {
      score -= 15;
      issues.push('Not MRC compliant');
    }
    
    return {
      score: Math.max(0, Math.round(score)),
      grade: score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F',
      issues
    };
  }

  async autoScroll(page) {
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;
          
          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }
}

export default AdAnalyzer;
