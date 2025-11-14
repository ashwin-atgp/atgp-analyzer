export async function detectAdTech(page) {
  const results = {
    gpt: await detectGPT(page),
    adsense: await detectAdSense(page),
    headerBidding: await detectHeaderBidding(page),
    adRefresh: await detectAdRefresh(page),
    cmp: await detectCMP(page)
  };
  
  return results;
}

async function detectGPT(page) {
  return await page.evaluate(() => {
    const gptInfo = {
      present: false,
      version: null,
      slots: [],
      lazyLoad: false,
      singleRequest: false,
      refresh: false,
      targeting: {},
      implementation: 'Not found'
    };
    
    if (typeof googletag !== 'undefined' && googletag.pubads) {
      gptInfo.present = true;
      
      // Get GPT version
      if (googletag.getVersion) {
        gptInfo.version = googletag.getVersion();
      }
      
      // Get slot information
      const slots = googletag.pubads().getSlots();
      gptInfo.slots = slots.map(slot => ({
        adUnitPath: slot.getAdUnitPath(),
        elementId: slot.getSlotElementId(),
        sizes: slot.getSizes().map(size => 
          typeof size === 'object' ? [size.getWidth(), size.getHeight()] : size
        ),
        targeting: slot.getTargetingMap()
      }));
      
      // Check for lazy loading
      try {
        const config = googletag.pubads().getConfig();
        if (config && config.lazyLoad) {
          gptInfo.lazyLoad = true;
        }
      } catch (e) {}
      
      // Check implementation type
      if (googletag.pubads().isSingleRequestMode && googletag.pubads().isSingleRequestMode()) {
        gptInfo.implementation = 'Single Request Architecture (SRA)';
        gptInfo.singleRequest = true;
      } else {
        gptInfo.implementation = 'Multi Request Architecture';
      }
      
      // Check for refresh
      gptInfo.refresh = typeof googletag.pubads().refresh === 'function';
      
      // Get page-level targeting
      const targetingKeys = googletag.pubads().getTargetingKeys();
      targetingKeys.forEach(key => {
        gptInfo.targeting[key] = googletag.pubads().getTargeting(key);
      });
    }
    
    return gptInfo;
  });
}

async function detectAdSense(page) {
  return await page.evaluate(() => {
    const adsenseInfo = {
      present: false,
      autoAds: false,
      displayAds: [],
      clientId: null,
      implementation: 'Not found'
    };
    
    // Check for AdSense scripts
    const scripts = Array.from(document.querySelectorAll('script'));
    const adsenseScript = scripts.find(s => 
      s.src && s.src.includes('pagead2.googlesyndication.com/pagead/js/adsbygoogle.js')
    );
    
    if (adsenseScript) {
      adsenseInfo.present = true;
      
      // Extract client ID
      const clientMatch = adsenseScript.src.match(/client=(ca-pub-\d+)/);
      if (clientMatch) {
        adsenseInfo.clientId = clientMatch[1];
      }
      
      // Check if async or sync
      adsenseInfo.implementation = adsenseScript.async ? 'Asynchronous' : 'Synchronous';
    }
    
    // Check for auto ads
    const autoAdsScript = scripts.find(s => 
      s.innerHTML && s.innerHTML.includes('enable_page_level_ads')
    );
    
    if (autoAdsScript) {
      adsenseInfo.autoAds = true;
    }
    
    // Find AdSense ad units
    const adUnits = Array.from(document.querySelectorAll('ins.adsbygoogle'));
    adsenseInfo.displayAds = adUnits.map(unit => ({
      slot: unit.getAttribute('data-ad-slot'),
      format: unit.getAttribute('data-ad-format'),
      client: unit.getAttribute('data-ad-client'),
      responsive: unit.getAttribute('data-full-width-responsive') === 'true'
    }));
    
    return adsenseInfo;
  });
}

async function detectHeaderBidding(page) {
  return await page.evaluate(() => {
    const headerBiddingInfo = {
      prebid: {
        present: false,
        version: null,
        adUnits: [],
        bidders: [],
        timeout: null
      },
      amazonAPS: false,
      openBidding: false,
      otherSolutions: []
    };
    
    // Detect Prebid.js
    if (typeof pbjs !== 'undefined') {
      headerBiddingInfo.prebid.present = true;
      
      if (pbjs.version) {
        headerBiddingInfo.prebid.version = pbjs.version;
      }
      
      if (pbjs.adUnits) {
        headerBiddingInfo.prebid.adUnits = pbjs.adUnits().map(unit => ({
          code: unit.code,
          mediaTypes: unit.mediaTypes,
          bids: unit.bids ? unit.bids.map(bid => bid.bidder) : []
        }));
        
        // Extract unique bidders
        const bidders = new Set();
        pbjs.adUnits().forEach(unit => {
          if (unit.bids) {
            unit.bids.forEach(bid => bidders.add(bid.bidder));
          }
        });
        headerBiddingInfo.prebid.bidders = Array.from(bidders);
      }
      
      // Get timeout
      if (pbjs.getConfig) {
        const config = pbjs.getConfig();
        if (config && config.bidderTimeout) {
          headerBiddingInfo.prebid.timeout = config.bidderTimeout;
        }
      }
    }
    
    // Detect Amazon APS
    if (typeof apstag !== 'undefined') {
      headerBiddingInfo.amazonAPS = true;
    }
    
    // Detect other header bidding solutions
    const knownSolutions = [
      { name: 'Index Exchange', check: () => typeof IndexExchange !== 'undefined' },
      { name: 'Rubicon Project', check: () => typeof rubicontag !== 'undefined' },
      { name: 'AppNexus', check: () => typeof apntag !== 'undefined' },
      { name: 'Criteo', check: () => typeof Criteo !== 'undefined' },
      { name: 'OpenX', check: () => typeof OX !== 'undefined' }
    ];
    
    knownSolutions.forEach(solution => {
      if (solution.check()) {
        headerBiddingInfo.otherSolutions.push(solution.name);
      }
    });
    
    return headerBiddingInfo;
  });
}

async function detectAdRefresh(page) {
  return await page.evaluate(() => {
    const refreshData = {
      detected: false,
      method: null,
      interval: null,
      conditions: []
    };
    
    // Check for GPT refresh
    if (typeof googletag !== 'undefined' && googletag.pubads) {
      const originalRefresh = googletag.pubads().refresh;
      if (originalRefresh) {
        refreshData.detected = true;
        refreshData.method = 'GPT refresh()';
      }
    }
    
    // Check for timer-based refresh in scripts
    const scripts = Array.from(document.querySelectorAll('script'));
    scripts.forEach(script => {
      const content = script.innerHTML;
      
      if (content.includes('setInterval') && 
          (content.includes('refresh') || content.includes('googletag'))) {
        refreshData.detected = true;
        refreshData.method = 'Timer-based';
        
        const intervalMatch = content.match(/setInterval\([^,]+,\s*(\d+)/);
        if (intervalMatch) {
          refreshData.interval = parseInt(intervalMatch[1]) / 1000 + ' seconds';
        }
      }
      
      if (content.includes('IntersectionObserver') && content.includes('refresh')) {
        refreshData.conditions.push('Visibility-based');
      }
      
      if ((content.includes('addEventListener') && content.includes('scroll')) && 
          content.includes('refresh')) {
        refreshData.conditions.push('Scroll-based');
      }
    });
    
    return refreshData;
  });
}

async function detectCMP(page) {
  return await page.evaluate(() => {
    const cmpData = {
      detected: false,
      provider: null,
      gdprApplies: null,
      tcfCompliant: false,
      uspCompliant: false
    };
    
    // Check for TCF API
    if (typeof __tcfapi !== 'undefined') {
      cmpData.detected = true;
      cmpData.tcfCompliant = true;
      cmpData.provider = 'TCF 2.0 Compliant';
    }
    
    // Check for USP API
    if (typeof __uspapi !== 'undefined') {
      cmpData.detected = true;
      cmpData.uspCompliant = true;
    }
    
    // Check for specific CMP providers
    const providers = [
      { name: 'Quantcast Choice', check: () => typeof window.__qcCmpApi !== 'undefined' },
      { name: 'OneTrust', check: () => typeof OneTrust !== 'undefined' },
      { name: 'Cookiebot', check: () => typeof Cookiebot !== 'undefined' },
      { name: 'Sourcepoint', check: () => typeof window._sp_ !== 'undefined' }
    ];
    
    providers.forEach(provider => {
      if (provider.check()) {
        cmpData.detected = true;
        cmpData.provider = provider.name;
      }
    });
    
    return cmpData;
  });
}
