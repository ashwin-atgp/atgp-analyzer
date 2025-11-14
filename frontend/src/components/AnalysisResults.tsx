import { motion } from 'framer-motion';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronRight,
  Code,
  Globe,
  Server,
  Eye,
  Zap,
  Shield,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { useState } from 'react';

interface AnalysisResultsProps {
  result: any;
}

export default function AnalysisResults({ result }: AnalysisResultsProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['recommendations']));

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const renderRecommendations = () => {
    const { recommendations } = result;
    if (!recommendations) return null;

    const priorityColors = {
      critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    };

    return (
      <div className="space-y-4">
        {Object.entries(recommendations).map(([priority, items]: [string, any]) => {
          if (!Array.isArray(items) || items.length === 0) return null;
          
          return (
            <div key={priority} className="space-y-2">
              <h4 className="font-semibold capitalize text-gray-700 dark:text-gray-300">
                {priority} Priority Issues
              </h4>
              {items.map((item: any, index: number) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg ${priorityColors[priority as keyof typeof priorityColors] || 'bg-gray-100'}`}
                >
                  <div className="flex items-start space-x-2">
                    {priority === 'critical' && <AlertCircle className="h-5 w-5 mt-0.5" />}
                    {priority === 'high' && <AlertTriangle className="h-5 w-5 mt-0.5" />}
                    {priority === 'medium' && <Info className="h-5 w-5 mt-0.5" />}
                    <div className="flex-1">
                      <p className="font-semibold">{item.issue}</p>
                      {item.value && <p className="text-sm mt-1">Current: {item.value}</p>}
                      {item.solution && (
                        <p className="text-sm mt-2 opacity-90">{item.solution}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    );
  };

  const sections = [
    {
      id: 'adTechnology',
      title: 'Ad Technology Stack',
      icon: Code,
      content: () => (
        <div className="space-y-4">
          {/* GPT Section */}
          {result.adTechnology?.gpt && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                {result.adTechnology.gpt.present ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-gray-400" />
                )}
                <h4 className="font-semibold">Google Publisher Tags (GPT)</h4>
              </div>
              {result.adTechnology.gpt.present && (
                <div className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                  <p>Version: {result.adTechnology.gpt.version || 'Unknown'}</p>
                  <p>Slots: {result.adTechnology.gpt.slots?.length || 0}</p>
                  <p>Implementation: {result.adTechnology.gpt.implementation}</p>
                  <p>Lazy Load: {result.adTechnology.gpt.lazyLoad ? 'Yes' : 'No'}</p>
                </div>
              )}
            </div>
          )}
          
          {/* AdSense Section */}
          {result.adTechnology?.adsense && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                {result.adTechnology.adsense.present ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-gray-400" />
                )}
                <h4 className="font-semibold">Google AdSense</h4>
              </div>
              {result.adTechnology.adsense.present && (
                <div className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                  <p>Client ID: {result.adTechnology.adsense.clientId || 'Unknown'}</p>
                  <p>Auto Ads: {result.adTechnology.adsense.autoAds ? 'Enabled' : 'Disabled'}</p>
                  <p>Display Ads: {result.adTechnology.adsense.displayAds?.length || 0}</p>
                </div>
              )}
            </div>
          )}
          
          {/* Header Bidding */}
          {result.adTechnology?.headerBidding && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                {result.adTechnology.headerBidding.prebid.present ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-gray-400" />
                )}
                <h4 className="font-semibold">Header Bidding</h4>
              </div>
              {result.adTechnology.headerBidding.prebid.present && (
                <div className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                  <p>Prebid Version: {result.adTechnology.headerBidding.prebid.version || 'Unknown'}</p>
                  <p>Bidders: {result.adTechnology.headerBidding.prebid.bidders?.join(', ') || 'None'}</p>
                  <p>Timeout: {result.adTechnology.headerBidding.prebid.timeout || 'Unknown'}ms</p>
                </div>
              )}
              {result.adTechnology.headerBidding.amazonAPS && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Amazon TAM: Detected
                </p>
              )}
            </div>
          )}
        </div>
      )
    },
    {
      id: 'performance',
      title: 'Performance Metrics',
      icon: Zap,
      content: () => (
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
            <p className="text-sm text-gray-500 dark:text-gray-400">Page Load Time</p>
            <p className="text-lg font-semibold">
              {result.performance?.pageLoadTime ? 
                `${(result.performance.pageLoadTime / 1000).toFixed(2)}s` : 'N/A'}
            </p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
            <p className="text-sm text-gray-500 dark:text-gray-400">FCP</p>
            <p className="text-lg font-semibold">
              {result.performance?.firstContentfulPaint ? 
                `${(result.performance.firstContentfulPaint / 1000).toFixed(2)}s` : 'N/A'}
            </p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
            <p className="text-sm text-gray-500 dark:text-gray-400">LCP</p>
            <p className="text-lg font-semibold">
              {result.performance?.largestContentfulPaint ? 
                `${(result.performance.largestContentfulPaint / 1000).toFixed(2)}s` : 'N/A'}
            </p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
            <p className="text-sm text-gray-500 dark:text-gray-400">CLS</p>
            <p className="text-lg font-semibold">
              {result.performance?.cumulativeLayoutShift?.toFixed(3) || 'N/A'}
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'viewability',
      title: 'Viewability Analysis',
      icon: Eye,
      content: () => (
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {result.viewability?.mrcCompliant ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <span className="font-medium">
                {result.viewability?.mrcCompliant ? 'MRC Compliant' : 'Not MRC Compliant'}
              </span>
            </div>
          </div>
          
          {result.viewability?.viewabilityProviders?.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Viewability Providers:
              </p>
              <div className="flex flex-wrap gap-2">
                {result.viewability.viewabilityProviders.map((provider: string) => (
                  <span
                    key={provider}
                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded-full text-sm"
                  >
                    {provider}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {result.viewability?.summary?.viewableCount || 0}
              </p>
              <p className="text-sm text-gray-500">Viewable Slots</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {result.viewability?.summary?.partiallyViewableCount || 0}
              </p>
              <p className="text-sm text-gray-500">Partial</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">
                {result.viewability?.summary?.nonViewableCount || 0}
              </p>
              <p className="text-sm text-gray-500">Non-viewable</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'consoleErrors',
      title: 'Console Analysis',
      icon: AlertTriangle,
      content: () => (
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {result.consoleAnalysis?.errorCount > 0 ? (
                <XCircle className="h-5 w-5 text-red-500" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
              <span className="font-medium">
                {result.consoleAnalysis?.errorCount || 0} Errors
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <span className="font-medium">
                {result.consoleAnalysis?.warningCount || 0} Warnings
              </span>
            </div>
          </div>
          
          {result.consoleAnalysis?.errors?.length > 0 && (
            <div className="space-y-2">
              <p className="font-medium text-sm text-gray-600 dark:text-gray-400">Error Messages:</p>
              {result.consoleAnalysis.errors.slice(0, 5).map((error: any, index: number) => (
                <div key={index} className="p-3 bg-red-50 dark:bg-red-900/20 rounded text-sm">
                  <code className="text-red-800 dark:text-red-400">{error.text || error.message}</code>
                </div>
              ))}
            </div>
          )}
        </div>
      )
    },
    {
      id: 'recommendations',
      title: 'Recommendations & Optimizations',
      icon: TrendingUp,
      content: renderRecommendations
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center space-x-2">
          <Globe className="h-6 w-6 text-blue-600" />
          <span>Analysis Results for {result.url}</span>
        </h2>
        
        <div className="space-y-4">
          {sections.map((section) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
            >
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <section.icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {section.title}
                  </span>
                </div>
                {expandedSections.has(section.id) ? (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-gray-500" />
                )}
              </button>
              
              {expandedSections.has(section.id) && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  {section.content()}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
