import React from 'react';
import styles from './FetchErrorBanner.module.css';

/**
 * Displays a red error banner when `error` is a non-empty string.
 * Renders nothing when `error` is null / undefined / empty.
 *
 * @param {{ error: string | null | undefined }} props
 */
export function FetchErrorBanner({ error }) {
  if (!error) return null;
  return (
    <div className={styles.banner}>
      FETCH ERROR: {error}
    </div>
  );
}
