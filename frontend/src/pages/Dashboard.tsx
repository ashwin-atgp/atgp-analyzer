import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  Shield,
  Zap,
  Globe,
  BarChart,
  AlertTriangle,
  Info
} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import axios from 'axios';
import AnalysisResults from '../components/AnalysisResults';
import StatsCard from '../components/StatsCard';

interface AnalysisResult {
  success: boolean;
  url: string;
  timestamp: string;
  adTechnology: any;
  adSlots: any;
  consoleAnalysis: any;
  networkAnalysis: any;
  adDensity: any;
  viewability: any;
  performance: any;
  recommendations: any;
  overallScore: any;
}

export default function Dashboard() {
  const [url, setUrl] = useState('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  
  const analysisMutation = useMutation({
    mutationFn: async (url: string) => {
      const response = await axios.post('/api/analyze/url/sync', { url });
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success) {
        setAnalysisResult(data.data);
        toast.success('Analysis completed successfully!');
      } else {
        toast.error('Analysis failed. Please try again.');
      }
    },
    onError: () => {
      toast.error('Failed to analyze website. Please check the URL and try again.');
    }
  });

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url) {
      toast.error('Please enter a URL');
      return;
    }
    
    try {
      new URL(url);
    } catch {
      toast.error('Please enter a valid URL');
      return;
    }
    
    analysisMutation.mutate(url);
  };

  const stats = analysisResult ? [
    {
      title: 'Overall Score',
      value: analysisResult.overallScore?.score || 0,
      suffix: '/100',
      icon: TrendingUp,
      color: 'blue',
      description: `Grade: ${analysisResult.overallScore?.grade || 'N/A'}`
    },
    {
      title: 'Fill Rate',
      value: analysisResult.adSlots?.fillRate || '0%',
      icon: BarChart,
      color: 'green',
      description: `${analysisResult.adSlots?.filledSlots || 0} of ${analysisResult.adSlots?.totalSlots || 0} slots filled`
    },
    {
      title: 'Ad Density',
      value: analysisResult.adDensity?.adDensityViewport || '0%',
      icon: Zap,
      color: 'purple',
      description: analysisResult.adDensity?.isOptimal ? 'Optimal' : 'High density'
    },
    {
      title: 'Viewability',
      value: analysisResult.viewability?.summary?.viewabilityRate || '0',
      suffix: '%',
      icon: Shield,
      color: 'indigo',
      description: analysisResult.viewability?.mrcCompliant ? 'MRC Compliant' : 'Not MRC Compliant'
    }
  ] : [];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-4"
      >
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Enterprise Ad Stack Analyzer
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Comprehensive analysis of advertising implementations, performance metrics, and optimization opportunities
        </p>
      </motion.div>

      {/* Analysis Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="max-w-3xl mx-auto"
      >
        <form onSubmit={handleAnalyze} className="space-y-4">
          <div className="relative">
            <Globe className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter website URL (e.g., https://example.com)"
              className="w-full pl-12 pr-4 py-4 text-lg border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              disabled={analysisMutation.isPending}
            />
          </div>
          
          <button
            type="submit"
            disabled={analysisMutation.isPending}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {analysisMutation.isPending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Search className="h-5 w-5" />
                <span>Analyze Website</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Tips */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
          <div className="flex items-start space-x-2">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="text-sm text-gray-700 dark:text-gray-300">
              <p className="font-semibold mb-1">Analysis includes:</p>
              <ul className="space-y-1">
                <li>• GPT and AdSense implementation detection</li>
                <li>• Header bidding and prebid analysis</li>
                <li>• Ad density and viewability metrics</li>
                <li>• Console error detection and troubleshooting</li>
                <li>• Performance metrics and recommendations</li>
              </ul>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      {analysisResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {stats.map((stat, index) => (
            <StatsCard key={index} {...stat} />
          ))}
        </motion.div>
      )}

      {/* Analysis Results */}
      {analysisResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <AnalysisResults result={analysisResult} />
        </motion.div>
      )}
    </div>
  );
}
