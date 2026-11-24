const formatDateOnly = (value) => {
  if (!value) return '';

  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return '';

    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }

    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      const year = parsed.getFullYear();
      const month = String(parsed.getMonth() + 1).padStart(2, '0');
      const day = String(parsed.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    const datePart = trimmed.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
      return datePart;
    }
  }

  return String(value).slice(0, 10);
};

const parseLocalDate = (value) => {
  if (!value) return null;

  const dateString = typeof value === 'string' && value.includes('T') ? value.split('T')[0] : value;
  const [year, month, day] = dateString.split('-').map(Number);

  if (!year || !month || !day) {
    return new Date(value);
  }

  return new Date(year, month - 1, day);
};

module.exports = {
  formatDateOnly,
  parseLocalDate
};
