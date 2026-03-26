import React from 'react';
import styles from './DashboardHeader.module.css';
import { RANGES } from '@/constants.js';

/**
 * Standard page header row used by every dashboard page.
 * Renders a title (+ optional subtitle) on the left and a range picker on the right.
 *
 * @param {{
 *   title: string,
 *   subtitle?: string,
 *   range: string,
 *   onRangeChange: (r: string) => void,
 *   ranges?: Array<string | { label: string, value: string }>
 * }} props
 */
export function DashboardHeader({ title, subtitle, range, onRangeChange, ranges = RANGES }) {
  return (
    <div className={styles.header}>
      <div className={styles.titles}>
        <span className={styles.title}>{title}</span>
        {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
      </div>

      <div className={styles.rangePicker}>
        {ranges.map((r) => {
          const value  = typeof r === 'string' ? r : r.value;
          const label  = typeof r === 'string' ? r.toUpperCase() : r.label;
          const active = range === value;
          return (
            <button
              key={value}
              onClick={() => onRangeChange(value)}
              className={active ? styles.activeBtn : styles.btn}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
