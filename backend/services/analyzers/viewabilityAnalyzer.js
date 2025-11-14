export async function analyzeViewability(page) {
  return await page.evaluate(() => {
    const viewabilityData = {
      mrcCompliant: false,
      viewableSlots: [],
      nonViewableSlots: [],
      partiallyViewableSlots: [],
      viewabilityProviders: [],
      intersectionObserverUsed: false,
      activeViewEnabled: false,
      overallViewability: 0
    };
    
    // Check for viewability providers
    if (typeof moat !== 'undefined') {
      viewabilityData.viewabilityProviders.push('MOAT');
      viewabilityData.mrcCompliant = true;
    }
    
    if (typeof IAS !== 'undefined' || document.querySelector('script[src*="adsafeprotected"]')) {
      viewabilityData.viewabilityProviders.push('IAS (Integral Ad Science)');
      viewabilityData.mrcCompliant = true;
    }
    
    if (document.querySelector('script[src*="doubleverify"]')) {
      viewabilityData.viewabilityProviders.push('DoubleVerify');
      viewabilityData.mrcCompliant = true;
    }
    
    // Check for Google ActiveView
    const scripts = Array.from(document.querySelectorAll('script'));
    if (scripts.some(s => s.src && s.src.includes('activeview'))) {
      viewabilityData.activeViewEnabled = true;
      viewabilityData.viewabilityProviders.push('Google ActiveView');
      viewabilityData.mrcCompliant = true;
    }
    
    // Check if Intersection Observer is being used
    viewabilityData.intersectionObserverUsed = typeof IntersectionObserver !== 'undefined';
    
    // Analyze viewability for each ad slot
    const adElements = document.querySelectorAll('[id*="ad"], [class*="ad"], ins.adsbygoogle, div[id^="div-gpt-ad"]');
    let totalViewableArea = 0;
    let totalAdArea = 0;
    
    adElements.forEach(element => {
      const rect = element.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(element);
      
      // Skip hidden elements
      if (computedStyle.display === 'none' || 
          computedStyle.visibility === 'hidden' || 
          rect.width === 0 || rect.height === 0) {
        return;
      }
      
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      
      // Calculate viewability percentage
      const visibleHeight = Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0);
      const visibleWidth = Math.min(rect.right, viewportWidth) - Math.max(rect.left, 0);
      const visibleArea = Math.max(0, visibleHeight) * Math.max(0, visibleWidth);
      const totalArea = rect.width * rect.height;
      const viewablePercentage = totalArea > 0 ? (visibleArea / totalArea) * 100 : 0;
      
      totalAdArea += totalArea;
      totalViewableArea += visibleArea;
      
      const slotInfo = {
        id: element.id || element.className.toString().substring(0, 50),
        viewablePercentage: viewablePercentage.toFixed(2),
        size: `${Math.round(rect.width)}x${Math.round(rect.height)}`,
        position: {
          top: Math.round(rect.top),
          left: Math.round(rect.left)
        },
        isMRCCompliant: viewablePercentage >= 50
      };
      
      // MRC standard: 50% viewable for 1 second (display)
      if (viewablePercentage >= 50) {
        viewabilityData.viewableSlots.push(slotInfo);
      } else if (viewablePercentage > 0) {
        viewabilityData.partiallyViewableSlots.push(slotInfo);
      } else {
        viewabilityData.nonViewableSlots.push(slotInfo);
      }
    });
    
    // Calculate overall viewability
    if (totalAdArea > 0) {
      viewabilityData.overallViewability = ((totalViewableArea / totalAdArea) * 100).toFixed(2);
    }
    
    // Add summary statistics
    viewabilityData.summary = {
      totalSlots: viewabilityData.viewableSlots.length + 
                  viewabilityData.partiallyViewableSlots.length + 
                  viewabilityData.nonViewableSlots.length,
      viewableCount: viewabilityData.viewableSlots.length,
      partiallyViewableCount: viewabilityData.partiallyViewableSlots.length,
      nonViewableCount: viewabilityData.nonViewableSlots.length,
      viewabilityRate: viewabilityData.viewableSlots.length > 0 ? 
        ((viewabilityData.viewableSlots.length / 
          (viewabilityData.viewableSlots.length + 
           viewabilityData.partiallyViewableSlots.length + 
           viewabilityData.nonViewableSlots.length)) * 100).toFixed(2) : 0
    };
    
    return viewabilityData;
  });
}
