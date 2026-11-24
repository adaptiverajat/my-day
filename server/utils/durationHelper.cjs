/**
 * Utility to normalize duration into 'hh:mm:ss' and total seconds
 */
const parseDuration = (val) => {
  if (val === null || val === undefined || val === '') {
    return { text: '00:00:00', seconds: 0 };
  }

  if (typeof val === 'number') {
    let totalSec = 0;
    if (val < 1) {
      totalSec = Math.round(val * 86400);
    } else if (val > 1000) {
      totalSec = Math.round(val);
    } else {
      totalSec = Math.round(val * 3600);
    }
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return {
      text: [h, m, s].map(n => String(n).padStart(2, '0')).join(':'),
      seconds: totalSec
    };
  }

  const str = String(val).trim();
  const parts = str.split(':').map(p => parseInt(p, 10) || 0);
  let totalSec = 0;
  if (parts.length === 3) {
    totalSec = parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    totalSec = parts[0] * 60 + parts[1];
  } else if (parts.length === 1) {
    totalSec = parts[0];
  }

  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return {
    text: [h, m, s].map(n => String(n).padStart(2, '0')).join(':'),
    seconds: totalSec
  };
};

/**
 * Format total seconds into human-readable duration string (e.g. '1h 25m')
 */
const formatSecondsHuman = (totalSec) => {
  if (!totalSec || totalSec <= 0) return '0h 0m';
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) {
    return s > 0 ? `${h}h ${m}m ${s}s` : `${h}h ${m}m`;
  }
  return `${m}m ${s}s`;
};

module.exports = {
  parseDuration,
  formatSecondsHuman
};
