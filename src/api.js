// Central registry of all API endpoint path builders.
// Each function returns a path string suitable for apiFetch().

export const endpoints = {
  stats:           (range)  => `/api/stats?range=${range}`,
  jobs:            (params) => `/api/jobs?${params}`,
  geo:             (range)  => `/api/geo?range=${range}`,
  proxy:           (range)  => `/api/proxy?range=${range}`,
  errors:          (range)  => `/api/errors?range=${range}`,
  scrape:          (range)  => `/api/scrape?range=${range}`,
  logs:            (params) => `/api/logs?${params}`,
  archives:        (params) => `/api/archives?${params}`,
  archiveView:     (jobId)  => `/api/archives/${jobId}/view`,
  archiveDownload: (jobId)  => `/api/archives/${jobId}/download`,
};
