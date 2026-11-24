import { useState, useMemo } from 'react';

export function useLectureFilters(lectures) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState('ALL');
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [viewMode, setViewMode] = useState('flat'); // 'flat' | 'grouped'
  const [collapsedSections, setCollapsedSections] = useState({});

  const filteredLectures = useMemo(() => {
    return lectures.filter((lec) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = (lec.title || '').toLowerCase().includes(q);
        const matchesId = (lec.lecture_id || '').toLowerCase().includes(q);
        const matchesSection = (lec.section || '').toLowerCase().includes(q);
        const matchesSubSection = (lec.sub_section || '').toLowerCase().includes(q);
        const matchesNotes = (lec.notes || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesId && !matchesSection && !matchesSubSection && !matchesNotes) {
          return false;
        }
      }

      if (selectedSection !== 'ALL' && (lec.section || 'Uncategorized') !== selectedSection) {
        return false;
      }
      if (selectedYear !== 'ALL' && String(lec.year || '') !== selectedYear) {
        return false;
      }
      if (selectedStatus !== 'ALL' && lec.status !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [lectures, searchQuery, selectedSection, selectedYear, selectedStatus]);

  const groupedSections = useMemo(() => {
    const groups = {};
    filteredLectures.forEach((lec) => {
      const secName = lec.section || 'General / Uncategorized';
      if (!groups[secName]) {
        groups[secName] = {
          sectionName: secName,
          sectionNo: lec.section_no || '',
          lectures: [],
          totalSeconds: 0,
          completedCount: 0
        };
      }
      groups[secName].lectures.push(lec);
      groups[secName].totalSeconds += lec.duration_seconds || 0;
      if (lec.status === 'completed') groups[secName].completedCount++;
    });

    return Object.values(groups).sort((a, b) => {
      const numA = parseInt(a.sectionNo, 10);
      const numB = parseInt(b.sectionNo, 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.sectionName.localeCompare(b.sectionName);
    });
  }, [filteredLectures]);

  const toggleSectionCollapse = (secName) => {
    setCollapsedSections((prev) => ({ ...prev, [secName]: !prev[secName] }));
  };

  return {
    searchQuery,
    setSearchQuery,
    selectedSection,
    setSelectedSection,
    selectedYear,
    setSelectedYear,
    selectedStatus,
    setSelectedStatus,
    viewMode,
    setViewMode,
    collapsedSections,
    toggleSectionCollapse,
    filteredLectures,
    groupedSections
  };
}
