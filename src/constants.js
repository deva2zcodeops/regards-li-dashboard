/** Full range options used by all dashboard pages. */
export const RANGES = ['7d', '14d', '30d', 'all'];

/**
 * Log stream range options — excludes 'all' because streaming the entire
 * log history in live mode would return too many results.
 */
export const LOG_RANGES = ['7d', '14d', '30d'];

export const POLL_INTERVAL_MS = 15_000;

export const LOG_BUFFER_MAX = 2000;

/** Max jobs loaded per page / infinite-scroll batch in the sidebar. */
export const JOBS_PER_PAGE = 15;

export const ERROR_COLORS = {
  '429 Rate Limited':     '#ffb74d',
  '401 Auth Failed':      '#ef5350',
  '403 Forbidden':        '#ff8a65',
  'Proxy Error':          '#ce93d8',
  'Max Retries Exceeded': '#fff176',
  'Other':                '#546e7a',
};
