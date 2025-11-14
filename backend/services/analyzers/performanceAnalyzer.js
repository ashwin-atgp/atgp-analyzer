export async function analyzePerformance(page) {
  return await page.evaluate(() => {
    const metrics = {
      pageLoadTime: null,
      domContentLoaded: null,
      firstContentfulPaint: null,
      largestContentfulPaint: null,
      cumulativeLayoutShift: null,
      firstInputDelay: null,
      timeToInteractive: null,
      adLoadTimes: {},
      resourceTiming: {
        scripts: [],
        ads: []
      }
    };
    
    // Navigation timing
    if (performance.timing) {
      const timing = performance.timing;
      metrics.pageLoadTime = timing.loadEventEnd - timing.navigationStart;
      metrics.domContentLoaded = timing.domContentLoadedEventEnd - timing.navigationStart;
      metrics.timeToInteractive = timing.domInteractive - timing.navigationStart;
    }
    
    // Paint timing
    if (performance.getEntriesByType) {
      const paintEntries = performance.getEntriesByType('paint');
      paintEntries.forEach(entry => {
        if (entry.name === 'first-contentful-paint') {
          metrics.firstContentfulPaint = entry.startTime;
        }
      });
      
      // LCP
      try {
        const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
        if (lcpEntries.length > 0) {
          metrics.largestContentfulPaint = lcpEntries[lcpEntries.length - 1].startTime;
        }
      } catch (e) {}
      
      // Resource timing for ad-related resources
      const resources = performance.getEntriesByType('resource');
      const adDomains = ['doubleclick', 'googlesyndication', 'googletagservices', 
                        'amazon-adsystem', 'prebid', 'pubmatic', 'criteo'];
      
      resources.forEach(resource => {
        const isAdResource = adDomains.some(domain => resource.name.includes(domain));
        
        if (isAdResource) {
          metrics.resourceTiming.ads.push({
            url: resource.name,
            duration: resource.duration,
            size: resource.transferSize || 0,
            startTime: resource.startTime
          });
        } else if (resource.initiatorType === 'script') {
          metrics.resourceTiming.scripts.push({
            url: resource.name,
            duration: resource.duration,
            size: resource.transferSize || 0
          });
        }
      });
    }
    
    // Calculate CLS
    try {
      let cls = 0;
      const entries = performance.getEntriesByType('layout-shift');
      entries.forEach(entry => {
        if (!entry.hadRecentInput) {
          cls += entry.value;
        }
      });
      metrics.cumulativeLayoutShift = cls;
    } catch (e) {}
    
    // Calculate average ad load time
    if (metrics.resourceTiming.ads.length > 0) {
      const totalDuration = metrics.resourceTiming.ads.reduce((sum, ad) => sum + ad.duration, 0);
      metrics.adLoadTimes.average = totalDuration / metrics.resourceTiming.ads.length;
      metrics.adLoadTimes.total = totalDuration;
      metrics.adLoadTimes.count = metrics.resourceTiming.ads.length;
    }
    
    return metrics;
  });
}
