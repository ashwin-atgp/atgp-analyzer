export function generateRecommendations(analysisResults) {
  const recommendations = {
    critical: [],
    high: [],
    medium: [],
    low: [],
    optimizations: []
  };
  
  // Console Errors Analysis
  if (analysisResults.consoleAnalysis && analysisResults.consoleAnalysis.errorCount > 0) {
    recommendations.critical.push({
      issue: 'Console Errors Detected',
      count: analysisResults.consoleAnalysis.errorCount,
      impact: 'High',
      solution: 'Review and fix JavaScript errors related to ad implementation. These errors can prevent ads from loading correctly.',
      details: analysisResults.consoleAnalysis.errors.slice(0, 3)
    });
  }
  
  // Fill Rate Analysis
  if (analysisResults.adSlots) {
    const fillRate = parseFloat(analysisResults.adSlots.fillRate);
    if (fillRate < 50) {
      recommendations.critical.push({
        issue: 'Very Low Fill Rate',
        value: `${fillRate}%`,
        impact: 'Critical',
        solution: 'Investigate ad server configuration, check demand sources, and ensure proper ad unit mapping.'
      });
    } else if (fillRate < 70) {
      recommendations.high.push({
        issue: 'Low Fill Rate',
        value: `${fillRate}%`,
        impact: 'High',
        solution: 'Consider adding more demand sources, implementing header bidding, or optimizing floor prices.'
      });
    }
  }
  
  // GPT Implementation
  if (analysisResults.adTechnology && analysisResults.adTechnology.gpt) {
    const gpt = analysisResults.adTechnology.gpt;
    
    if (gpt.present && !gpt.lazyLoad) {
      recommendations.medium.push({
        issue: 'Lazy Loading Not Enabled',
        impact: 'Medium',
        solution: 'Enable lazy loading for below-the-fold ad units to improve page performance and user experience.'
      });
    }
    
    if (gpt.present && !gpt.singleRequest) {
      recommendations.low.push({
        issue: 'Not Using Single Request Architecture',
        impact: 'Low',
        solution: 'Consider implementing Single Request Architecture (SRA) for better performance and competitive separation.'
      });
    }
  }
  
  // AdSense Implementation
  if (analysisResults.adTechnology && analysisResults.adTechnology.adsense) {
    const adsense = analysisResults.adTechnology.adsense;
    
    if (adsense.present && adsense.implementation === 'Synchronous') {
      recommendations.high.push({
        issue: 'Synchronous AdSense Implementation',
        impact: 'High',
        solution: 'Switch to asynchronous AdSense tags to prevent render-blocking and improve page load speed.'
      });
    }
    
    if (adsense.present && !adsense.autoAds && adsense.displayAds.length < 3) {
      recommendations.low.push({
        issue: 'Limited AdSense Coverage',
        impact: 'Low',
        solution: 'Consider enabling Auto Ads to maximize revenue potential with optimal ad placement.'
      });
    }
  }
  
  // Header Bidding
  if (analysisResults.adTechnology && analysisResults.adTechnology.headerBidding) {
    const hb = analysisResults.adTechnology.headerBidding;
    
    if (hb.prebid.present) {
      if (hb.prebid.timeout && hb.prebid.timeout > 3000) {
        recommendations.medium.push({
          issue: 'High Prebid Timeout',
          value: `${hb.prebid.timeout}ms`,
          impact: 'Medium',
          solution: 'Consider reducing timeout to 1000-1500ms to balance revenue and user experience.'
        });
      }
      
      if (hb.prebid.bidders.length < 5) {
        recommendations.low.push({
          issue: 'Limited Header Bidding Partners',
          count: hb.prebid.bidders.length,
          impact: 'Low',
          solution: 'Add more header bidding partners to increase competition and potentially improve CPMs.'
        });
      }
    } else if (!hb.prebid.present && !hb.amazonAPS && !hb.openBidding) {
      recommendations.high.push({
        issue: 'No Header Bidding Detected',
        impact: 'High',
        solution: 'Implement header bidding (Prebid.js or Amazon TAM) to increase revenue through real-time bidding competition.'
      });
    }
  }
  
  // Ad Density
  if (analysisResults.adDensity) {
    const viewportDensity = parseFloat(analysisResults.adDensity.adDensityViewport);
    if (viewportDensity > 30) {
      recommendations.high.push({
        issue: 'High Ad Density',
        value: `${viewportDensity}%`,
        impact: 'High',
        solution: 'Reduce ad density to improve user experience and comply with Google policies (max 30% above the fold).'
      });
    }
  }
  
  // Viewability
  if (analysisResults.viewability) {
    if (!analysisResults.viewability.mrcCompliant) {
      recommendations.critical.push({
        issue: 'Not MRC Compliant',
        impact: 'Critical',
        solution: 'Implement MRC-accredited viewability measurement (IAS, MOAT, or ActiveView) for accurate metrics.'
      });
    }
    
    const viewabilityRate = parseFloat(analysisResults.viewability.summary?.viewabilityRate || 0);
    if (viewabilityRate < 50) {
      recommendations.high.push({
        issue: 'Low Viewability Rate',
        value: `${viewabilityRate}%`,
        impact: 'High',
        solution: 'Reposition ads to more viewable locations, implement sticky ads, or use lazy loading strategically.'
      });
    }
  }
  
  // Performance
  if (analysisResults.performance) {
    if (analysisResults.performance.largestContentfulPaint > 2500) {
      recommendations.medium.push({
        issue: 'Slow Largest Contentful Paint',
        value: `${(analysisResults.performance.largestContentfulPaint / 1000).toFixed(2)}s`,
        impact: 'Medium',
        solution: 'Optimize ad loading sequence, implement lazy loading, and reduce initial ad payload.'
      });
    }
    
    if (analysisResults.performance.cumulativeLayoutShift > 0.1) {
      recommendations.high.push({
        issue: 'High Cumulative Layout Shift',
        value: analysisResults.performance.cumulativeLayoutShift.toFixed(3),
        impact: 'High',
        solution: 'Reserve space for ad slots, avoid inserting ads above existing content, use min-height CSS.'
      });
    }
  }
  
  // Ad Refresh
  if (analysisResults.adTechnology && analysisResults.adTechnology.adRefresh) {
    const refresh = analysisResults.adTechnology.adRefresh;
    if (refresh.detected && refresh.interval) {
      const intervalSeconds = parseInt(refresh.interval);
      if (intervalSeconds < 30) {
        recommendations.high.push({
          issue: 'Aggressive Ad Refresh',
          value: refresh.interval,
          impact: 'High',
          solution: 'Increase refresh interval to minimum 30 seconds to comply with industry standards and improve user experience.'
        });
      }
    }
  }
  
  // Network Failures
  if (analysisResults.networkAnalysis && analysisResults.networkAnalysis.failedRequests.length > 0) {
    recommendations.high.push({
      issue: 'Failed Ad Requests',
      count: analysisResults.networkAnalysis.failedRequests.length,
      impact: 'High',
      solution: 'Investigate failed requests - check ad tags, network connectivity, and domain allowlisting.',
      details: analysisResults.networkAnalysis.failedRequests.slice(0, 3)
    });
  }
  
  // CMP/Privacy
  if (analysisResults.adTechnology && analysisResults.adTechnology.cmp) {
    if (!analysisResults.adTechnology.cmp.detected) {
      recommendations.medium.push({
        issue: 'No Consent Management Platform',
        impact: 'Medium',
        solution: 'Implement a CMP for GDPR/CCPA compliance to avoid regulatory issues and maintain user trust.'
      });
    }
  }
  
  // Add optimization suggestions
  recommendations.optimizations = generateOptimizationTips(analysisResults);
  
  return recommendations;
}

function generateOptimizationTips(results) {
  const tips = [];
  
  // Check if both GPT and AdSense are present
  if (results.adTechnology?.gpt?.present && results.adTechnology?.adsense?.present) {
    tips.push({
      tip: 'Unified Monetization',
      description: 'You\'re using both GPT and AdSense. Consider migrating fully to Google Ad Manager for better control and higher yields.'
    });
  }
  
  // Check for mobile optimization
  tips.push({
    tip: 'Mobile Optimization',
    description: 'Ensure ad units are responsive and optimized for mobile viewports where majority of traffic originates.'
  });
  
  // Core Web Vitals optimization
  if (results.performance?.cumulativeLayoutShift !== null) {
    tips.push({
      tip: 'Core Web Vitals',
      description: 'Monitor Core Web Vitals regularly as they directly impact search rankings and ad viewability.'
    });
  }
  
  // A/B testing suggestion
  tips.push({
    tip: 'A/B Testing',
    description: 'Implement A/B testing for ad placements, sizes, and densities to optimize revenue and user experience.'
  });
  
  return tips;
}
