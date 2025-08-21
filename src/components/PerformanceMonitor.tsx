'use client';

import { useEffect, useState } from 'react';
import { performanceMonitor } from '@/lib/performance';

interface PerformanceMetrics {
  pageLoadTime: number;
  memoryUsed: number;
  memoryTotal: number;
  apiCalls: { [key: string]: number };
  componentRenders: { [key: string]: number };
  longTasks: number;
}

export default function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    pageLoadTime: 0,
    memoryUsed: 0,
    memoryTotal: 0,
    apiCalls: {},
    componentRenders: {},
    longTasks: 0,
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = performanceMonitor.subscribe((metric) => {
      setMetrics(prev => {
        const newMetrics = { ...prev };
        
        switch (metric.name) {
          case 'page_load_time':
            newMetrics.pageLoadTime = metric.value;
            break;
          case 'memory_used':
            newMetrics.memoryUsed = metric.value;
            break;
          case 'memory_total':
            newMetrics.memoryTotal = metric.value;
            break;
          case 'long_task':
            newMetrics.longTasks++;
            break;
          default:
            if (metric.name.startsWith('api_call_')) {
              const apiName = metric.name.replace('api_call_', '');
              newMetrics.apiCalls[apiName] = metric.value;
            } else if (metric.name.startsWith('component_render_')) {
              const componentName = metric.name.replace('component_render_', '');
              newMetrics.componentRenders[componentName] = metric.value;
            }
        }
        
        return newMetrics;
      });
    });

    return unsubscribe;
  }, []);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const toggleVisibility = () => setIsVisible(!isVisible);

  if (!isVisible) {
    return (
      <button
        onClick={toggleVisibility}
        className="fixed bottom-4 right-4 bg-blue-500 text-white p-2 rounded-full shadow-lg z-50"
        title="Show Performance Monitor"
      >
        📊
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-80 max-h-96 overflow-y-auto z-50">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Performance Monitor</h3>
        <button
          onClick={toggleVisibility}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <div className="space-y-3 text-sm">
        {/* Page Load Time */}
        <div className="flex justify-between">
          <span>Page Load:</span>
          <span className={metrics.pageLoadTime > 3000 ? 'text-red-500' : 'text-green-500'}>
            {metrics.pageLoadTime.toFixed(0)}ms
          </span>
        </div>

        {/* Memory Usage */}
        <div className="flex justify-between">
          <span>Memory Used:</span>
          <span className={metrics.memoryUsed > 100 ? 'text-yellow-500' : 'text-green-500'}>
            {metrics.memoryUsed.toFixed(1)}MB
          </span>
        </div>

        <div className="flex justify-between">
          <span>Memory Total:</span>
          <span>{metrics.memoryTotal.toFixed(1)}MB</span>
        </div>

        {/* Long Tasks */}
        <div className="flex justify-between">
          <span>Long Tasks:</span>
          <span className={metrics.longTasks > 5 ? 'text-red-500' : 'text-green-500'}>
            {metrics.longTasks}
          </span>
        </div>

        {/* API Calls */}
        {Object.keys(metrics.apiCalls).length > 0 && (
          <div>
            <h4 className="font-medium mb-2">API Calls:</h4>
            {Object.entries(metrics.apiCalls)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([api, time]) => (
                <div key={api} className="flex justify-between text-xs">
                  <span className="truncate">{api}</span>
                  <span className={time > 1000 ? 'text-red-500' : 'text-green-500'}>
                    {time.toFixed(0)}ms
                  </span>
                </div>
              ))}
          </div>
        )}

        {/* Component Renders */}
        {Object.keys(metrics.componentRenders).length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Component Renders:</h4>
            {Object.entries(metrics.componentRenders)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([component, time]) => (
                <div key={component} className="flex justify-between text-xs">
                  <span className="truncate">{component}</span>
                  <span className={time > 16 ? 'text-red-500' : 'text-green-500'}>
                    {time.toFixed(1)}ms
                  </span>
                </div>
              ))}
          </div>
        )}

        {/* Performance Score */}
        <div className="pt-2 border-t">
          <div className="flex justify-between">
            <span>Performance Score:</span>
            <span className={getPerformanceScore(metrics) > 80 ? 'text-green-500' : 'text-yellow-500'}>
              {getPerformanceScore(metrics)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function getPerformanceScore(metrics: PerformanceMetrics): number {
  let score = 100;

  // Deduct points for slow page load
  if (metrics.pageLoadTime > 3000) score -= 20;
  else if (metrics.pageLoadTime > 2000) score -= 10;

  // Deduct points for high memory usage
  if (metrics.memoryUsed > 100) score -= 15;
  else if (metrics.memoryUsed > 50) score -= 5;

  // Deduct points for long tasks
  if (metrics.longTasks > 5) score -= 15;
  else if (metrics.longTasks > 2) score -= 5;

  // Deduct points for slow API calls
  const slowApiCalls = Object.values(metrics.apiCalls).filter(time => time > 1000).length;
  score -= slowApiCalls * 5;

  return Math.max(0, score);
}