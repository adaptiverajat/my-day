import * as XLSX from 'xlsx';
import { parseDuration, formatDurationHuman } from './lectureDurationHelper';

export { parseDuration, formatDurationHuman };

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
          const rowMap = {};
          Object.keys(row).forEach((k) => {
            rowMap[cleanKey(k)] = row[k];
          });

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
