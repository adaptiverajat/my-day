import * as XLSX from 'xlsx';

// Normalizes duration to 'hh:mm:ss' and seconds
export const parseDuration = (val) => {
  if (val === null || val === undefined || val === '') {
    return { text: '00:00:00', seconds: 0 };
  }

  if (typeof val === 'number') {
    let totalSec = 0;
    if (val < 1) {
      // Excel fractional day
      totalSec = Math.round(val * 86400);
    } else if (val > 1000) {
      // Direct seconds
      totalSec = Math.round(val);
    } else {
      // Decimal hours
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

export const formatDurationHuman = (seconds) => {
  if (!seconds || seconds <= 0) return '0h 0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return s > 0 ? `${h}h ${m}m ${s}s` : `${h}h ${m}m`;
  }
  return `${m}m ${s}s`;
};

// Normalize column header keys for flexible matching
const cleanKey = (key) => {
  return String(key || '')
    .toLowerCase()
    .replace(/[._\-#\(\)]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

export const parseLecturesExcelFile = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });

        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          throw new Error('Excel file has no sheets.');
        }

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false });

        if (!rawRows || rawRows.length === 0) {
          throw new Error('The uploaded sheet is empty.');
        }

        const lectures = [];

        rawRows.forEach((row, idx) => {
          // Build lookup map from cleaned keys
          const rowMap = {};
          Object.keys(row).forEach((k) => {
            rowMap[cleanKey(k)] = row[k];
          });

          // Helper to find value by possible header variants
          const findVal = (candidates) => {
            for (const cand of candidates) {
              const cleaned = cleanKey(cand);
              if (rowMap[cleaned] !== undefined && rowMap[cleaned] !== '') {
                return rowMap[cleaned];
              }
            }
            return '';
          };

          const lecture_id = findVal(['id', 'lecture id', 'lecture no', 'lecture no.', 'no', 'sr no', 'sr. no.', 'sr no.', 's.no.', 's no', '#']);
          const title = findVal(['title', 'lecture title', 'topic', 'name', 'lecture name']);
          const year = findVal(['year', 'lecture year', 'yr']);
          const rawDuration = findVal(['duration (hh:mm:ss)', 'duration(hh:mm:ss)', 'duration', 'time', 'length', 'hh:mm:ss']);
          const section_no = findVal(['section no.', 'section no', 'section_no', 'section number', 'sec no', 'sec no.', 'sec #']);
          const section = findVal(['section', 'section name', 'sec']);
          const sub_section = findVal(['sub-section', 'subsection', 'sub section', 'sub_section', 'sub section name', 'part']);

          // Only consider row valid if title is present
          if (String(title).trim()) {
            const parsedDur = parseDuration(rawDuration);
            lectures.push({
              tempId: `imported-${idx + 1}`,
              lecture_id: String(lecture_id).trim() || String(idx + 1),
              title: String(title).trim(),
              year: String(year).trim() || '',
              duration: parsedDur.text,
              duration_seconds: parsedDur.seconds,
              section_no: String(section_no).trim() || '',
              section: String(section).trim() || '',
              sub_section: String(sub_section).trim() || '',
              status: 'pending'
            });
          }
        });

        if (lectures.length === 0) {
          throw new Error('No valid lecture rows found. Please make sure the sheet has Title and Duration columns.');
        }

        resolve({
          success: true,
          lectures,
          totalRows: rawRows.length,
          validCount: lectures.length
        });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(new Error('Failed to read file: ' + err.message));
    reader.readAsArrayBuffer(file);
  });
};

// Export lectures to Excel
export const exportLecturesToExcel = (lectures, filename = 'Lecture_Hearing_Schedule.xlsx') => {
  const exportData = lectures.map((l) => ({
    'ID': l.lecture_id || l.id,
    'Title': l.title,
    'Year': l.year || '',
    'Duration (hh:mm:ss)': l.duration || '00:00:00',
    'Section No.': l.section_no || '',
    'Section': l.section || '',
    'Sub-section': l.sub_section || '',
    'Status': l.status === 'completed' ? 'Completed' : 'Pending',
    'Scheduled Date': l.scheduled_date || '',
    'Completed Date': l.completed_date || '',
    'Notes': l.notes || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Lectures');
  XLSX.writeFile(workbook, filename);
};
