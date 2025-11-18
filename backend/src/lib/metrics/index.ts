interface MetricLabels {
  [key: string]: string | number;
}

class MetricsCollector {
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();

  /**
   * Increment a counter metric
   */
  incrementCounter(name: string, value: number = 1, labels?: MetricLabels) {
    const key = this.buildKey(name, labels);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + value);
  }

  /**
   * Set a gauge metric (current value)
   */
  setGauge(name: string, value: number, labels?: MetricLabels) {
    const key = this.buildKey(name, labels);
    this.gauges.set(key, value);
  }

  /**
   * Record a value in a histogram (for distributions)
   */
  recordHistogram(name: string, value: number, labels?: MetricLabels) {
    const key = this.buildKey(name, labels);
    const values = this.histograms.get(key) || [];
    values.push(value);
    this.histograms.set(key, values);
  }

  /**
   * Measure execution time of a function
   */
  async measureTime<T>(
    name: string,
    fn: () => Promise<T>,
    labels?: MetricLabels,
  ): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - start;
      this.recordHistogram(`${name}_duration_ms`, duration, labels);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.recordHistogram(`${name}_duration_ms`, duration, {
        ...labels,
        error: 'true',
      });
      throw error;
    }
  }

  /**
   * Get current metric values (for debugging or export)
   */
  getMetrics() {
    return {
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
      histograms: Object.fromEntries(
        Array.from(this.histograms.entries()).map(([key, values]) => [
          key,
          {
            count: values.length,
            sum: values.reduce((a, b) => a + b, 0),
            avg: values.reduce((a, b) => a + b, 0) / values.length,
            min: Math.min(...values),
            max: Math.max(...values),
          },
        ]),
      ),
    };
  }

  /**
   * Clear all metrics (useful for testing)
   */
  reset() {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
  }

  private buildKey(name: string, labels?: MetricLabels): string {
    if (!labels) return name;
    const labelStr = Object.entries(labels)
      .map(([k, v]) => `${k}=${v}`)
      .sort()
      .join(',');
    return `${name}{${labelStr}}`;
  }
}

export const metrics = new MetricsCollector();

// Common metric names
export const METRICS = {
  // API
  HTTP_REQUESTS: 'http_requests_total',
  HTTP_REQUEST_DURATION: 'http_request_duration_ms',
  HTTP_ERRORS: 'http_errors_total',

  // Business
  ACCESS_GRANTS_IMPORTED: 'access_grants_imported_total',
  CAMPAIGNS_CREATED: 'campaigns_created_total',
  REVIEWS_SUBMITTED: 'reviews_submitted_total',
  ACCESS_REQUESTS_CREATED: 'access_requests_created_total',
  DELEGATIONS_CREATED: 'delegations_created_total',

  // System
  ACTIVE_CAMPAIGNS: 'active_campaigns',
  PENDING_REVIEWS: 'pending_reviews',
  PENDING_ACCESS_REQUESTS: 'pending_access_requests',
} as const;
