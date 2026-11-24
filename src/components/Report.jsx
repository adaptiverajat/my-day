import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLogoMenu from './AppLogoMenu';
import ExcelImportModal from './lectures/ExcelImportModal';
import LectureModal from './lectures/LectureModal';
import { exportLecturesToExcel, formatDurationHuman } from './lectures/excelLectureHelper';
import LectureAudioPlayer from './lectures/LectureAudioPlayer';
import LectureTranscriptPanel from './lectures/LectureTranscriptPanel';
import './lectures/LectureHearingSchedule.css';

export default function Report() {
  const navigate = useNavigate();
  const [lectures, setLectures] = useState([]);
  const [summary, setSummary] = useState({
    totalCount: 0,
    totalSeconds: 0,
    totalDurationFormatted: '0h 0m',
    completedCount: 0,
    completedSeconds: 0,
    completedDurationFormatted: '0h 0m',
    pendingCount: 0,
    pendingSeconds: 0,
    pendingDurationFormatted: '0h 0m',
    completionRate: 0,
    sections: [],
    years: []
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Audio Folder Location & Drive Connection State
  const [audioLocation, setAudioLocation] = useState(() => {
    return localStorage.getItem('lectureAudioLocation') || 'E:\\MaharajLectures';
  });
  const [driveConnected, setDriveConnected] = useState(false);
  const [checkingDrive, setCheckingDrive] = useState(false);
  const [driveInfo, setDriveInfo] = useState(null);
  const [currentPlayingLecture, setCurrentPlayingLecture] = useState(null);

  // Collapsible Header & Transcript State (Default: COLLAPSED into 1 row)
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(() => {
    const saved = localStorage.getItem('lectureHeaderCollapsed');
    if (saved === 'false') return false;
    return true; // Default state is collapsed!
  });
  const [showTranscriptPanel, setShowTranscriptPanel] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState('ALL');
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [viewMode, setViewMode] = useState('flat'); // 'flat' | 'grouped'
  const [collapsedSections, setCollapsedSections] = useState({});

  // Modals
  const [showImportModal, setShowImportModal] = useState(false);
  const [showLectureModal, setShowLectureModal] = useState(false);
  const [editingLecture, setEditingLecture] = useState(null);
  const [notification, setNotification] = useState('');

  useEffect(() => {
    fetchLectures();
    checkDriveStatus(false);
  }, []);

  const checkDriveStatus = async (isManualClick = false, locationOverride = null) => {
    try {
      setCheckingDrive(true);
      const targetLocation = locationOverride !== null ? locationOverride : audioLocation;
      const trimmed = (targetLocation || '').trim();

      if (!trimmed) {
        if (isManualClick) showToast('⚠️ Please enter an audio folder path.');
        setDriveConnected(false);
        return;
      }

      localStorage.setItem('lectureAudioLocation', trimmed);

      const url = `http://localhost:3001/api/lectures/drive-status?directory=${encodeURIComponent(trimmed)}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.success && data.connected) {
        setDriveConnected(true);
        setDriveInfo(data);
        if (isManualClick) {
          showToast(`🟢 Connected to ${trimmed}! Found ${data.fileCount} audio files.`);
        }
      } else {
        setDriveConnected(false);
        setDriveInfo(data);
        if (isManualClick) {
          if (!data.drivePresent) {
            showToast(`⚠️ Drive for "${trimmed}" not detected. Please ensure the drive is plugged in.`);
          } else if (!data.directoryPresent) {
            showToast(`⚠️ Folder "${trimmed}" was not found.`);
          } else {
            showToast(`⚠️ Could not connect to "${trimmed}".`);
          }
        }
      }
    } catch (err) {
      console.error('Error checking drive:', err);
      if (isManualClick) {
        showToast('⚠️ Error connecting to audio location: ' + err.message);
      }
    } finally {
      setCheckingDrive(false);
    }
  };

  const fetchLectures = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('http://localhost:3001/api/lectures');
      const data = await response.json();

      if (data.success) {
        setLectures(data.lectures || []);
        if (data.summary) {
          setSummary(data.summary);
        }
      } else {
        setError(data.message || 'Failed to load lectures');
      }
    } catch (err) {
      console.error('Error fetching lectures:', err);
      setError('Could not connect to lectures API: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  // Toggle status (Pending <-> Completed)
  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
      const response = await fetch(`http://localhost:3001/api/lectures/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();
      if (data.success) {
        fetchLectures();
        showToast(newStatus === 'completed' ? 'Marked as completed!' : 'Marked as pending');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status: ' + err.message);
    }
  };

  // Save (Create or Update) Lecture
  const handleSaveLecture = async (formData) => {
    if (editingLecture) {
      // Update
      const response = await fetch(`http://localhost:3001/api/lectures/${editingLecture.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.message || 'Update failed');
      showToast('Lecture updated successfully');
    } else {
      // Create
      const response = await fetch('http://localhost:3001/api/lectures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.message || 'Creation failed');
      showToast('New lecture added successfully');
    }
    fetchLectures();
  };

  // Delete single lecture
  const handleDeleteLecture = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete lecture "${title}"?`)) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/lectures/${id}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        showToast('Lecture deleted');
        fetchLectures();
      }
    } catch (err) {
      console.error('Error deleting lecture:', err);
      alert('Failed to delete lecture: ' + err.message);
    }
  };

  // Clear all lectures
  const handleClearAll = async () => {
    if (!window.confirm('⚠️ WARNING: This will permanently delete ALL lectures in the hearing schedule. Are you sure?')) {
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/lectures/clear', {
        method: 'POST'
      });
      const data = await response.json();
      if (data.success) {
        showToast('All lectures cleared');
        fetchLectures();
      }
    } catch (err) {
      console.error('Error clearing lectures:', err);
      alert('Failed to clear lectures: ' + err.message);
    }
  };

  // Filtered lectures
  const filteredLectures = useMemo(() => {
    return lectures.filter((lec) => {
      // Search
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

      // Section
      if (selectedSection !== 'ALL') {
        if ((lec.section || 'Uncategorized') !== selectedSection) {
          return false;
        }
      }

      // Year
      if (selectedYear !== 'ALL') {
        if (String(lec.year || '') !== selectedYear) {
          return false;
        }
      }

      // Status
      if (selectedStatus !== 'ALL') {
        if (lec.status !== selectedStatus) {
          return false;
        }
      }

      return true;
    });
  }, [lectures, searchQuery, selectedSection, selectedYear, selectedStatus]);

  // Grouped by section structure
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
      groups[secName].totalSeconds += (lec.duration_seconds || 0);
      if (lec.status === 'completed') {
        groups[secName].completedCount++;
      }
    });

    return Object.values(groups).sort((a, b) => {
      const numA = parseInt(a.sectionNo, 10);
      const numB = parseInt(b.sectionNo, 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.sectionName.localeCompare(b.sectionName);
    });
  }, [filteredLectures]);

  const toggleSectionCollapse = (secName) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [secName]: !prev[secName]
    }));
  };

  // Header Collapse Toggle
  const toggleHeaderCollapse = () => {
    setIsHeaderCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('lectureHeaderCollapsed', String(next));
      return next;
    });
  };

  // Audio track switching helpers
  const currentTrackIndex = useMemo(() => {
    if (!currentPlayingLecture) return -1;
    return filteredLectures.findIndex((l) => l.id === currentPlayingLecture.id);
  }, [filteredLectures, currentPlayingLecture]);

  const handlePlayLecture = (lec) => {
    setCurrentPlayingLecture(lec);
    setShowTranscriptPanel(true);
  };

  const handleNextTrack = () => {
    if (currentTrackIndex >= 0 && currentTrackIndex < filteredLectures.length - 1) {
      setCurrentPlayingLecture(filteredLectures[currentTrackIndex + 1]);
    }
  };

  const handlePrevTrack = () => {
    if (currentTrackIndex > 0) {
      setCurrentPlayingLecture(filteredLectures[currentTrackIndex - 1]);
    }
  };

  // Save Transcript Handler
  const handleSaveTranscript = async (id, transcriptText) => {
    const response = await fetch(`http://localhost:3001/api/lectures/${id}/transcript`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript: transcriptText })
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to save transcript');
    }

    setLectures((prev) =>
      prev.map((lec) => (lec.id === id ? { ...lec, transcript: transcriptText } : lec))
    );

    if (currentPlayingLecture && (currentPlayingLecture.id === id || currentPlayingLecture.lecture_id === id)) {
      setCurrentPlayingLecture((prev) => ({ ...prev, transcript: transcriptText }));
    }
    showToast('✓ Transcript saved to database!');
  };

  return (
    <div className={`lectures-page ${currentPlayingLecture ? 'with-player' : ''}`}>
      {/* Unified Top Header Bar */}
      <header className="lectures-header">
        <AppLogoMenu
          title="Lecture Hearing Schedule"
          subtitle={`${summary.totalCount} Lectures • ${summary.totalDurationFormatted} Total • ${summary.completionRate}% Heard`}
          currentScreen="report"
        />
          <div className="lectures-header-controls">
          <button
            type="button"
            className="collapse-trigger-btn symbol-only header-toggle"
            onClick={toggleHeaderCollapse}
            title={isHeaderCollapsed ? 'Expand full statistics cards & toolbar' : 'Collapse to single compact row'}
          >
            {isHeaderCollapsed ? '▼' : '▲'}
          </button>
          <button type="button" className="btn-back" onClick={() => navigate('/')}>
            Back to Calendar
          </button>
        </div>
      </header>

      <div className="lectures-container">
        {notification && (
          <div style={{ padding: '12px 18px', background: '#ecfdf5', border: '1px solid #10b981', color: '#047857', borderRadius: '8px', fontWeight: 600 }}>
            {notification}
          </div>
        )}

        {/* Collapsible Header Section: Either 1-Row Collapsed Bar OR Full Stats & Toolbar */}
        {isHeaderCollapsed ? (
          /* 1-Row Collapsed Bar */
          <div className="lectures-collapsed-bar">
            {/* Left: Important Stats Pills */}
            <div className="collapsed-stats-group">
              <span className="collapsed-stat-pill" title="Total Lectures in schedule">
                📚 <strong>{summary.totalCount}</strong>
              </span>
              <span className="collapsed-stat-pill" title="Total cumulative audio time">
                ⏱️ <strong>{summary.totalDurationFormatted}</strong>
              </span>
              <span className="collapsed-stat-pill heard" title="Listened / completed lectures">
                ✅ <strong>{summary.completedCount}</strong>/{summary.totalCount} ({summary.completionRate}%)
              </span>
              <span className="collapsed-stat-pill pending" title="Remaining listening time">
                ⏳ <strong>{summary.pendingDurationFormatted}</strong>
              </span>
            </div>

            {/* Right: Quick Search, Quick Filters, View Mode, Audio Connect & Controls */}
            <div className="collapsed-controls-group">
              <div className="search-input-wrapper collapsed-search">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Quick search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <select
                className="filter-select"
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                title="Filter by Section"
              >
                <option value="ALL">All Sections ({summary.sections?.length || 0})</option>
                {summary.sections?.map((sec) => (
                  <option key={sec} value={sec}>{sec}</option>
                ))}
              </select>

              <select
                className="filter-select"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                title="Filter by Status"
              >
                <option value="ALL">All Status</option>
                <option value="pending">⏳ Pending</option>
                <option value="completed">✅ Heard</option>
              </select>

              {/* View Mode Toggle in Collapsed Bar */}
              <div className="view-mode-toggle">
                <button
                  type="button"
                  className={`view-mode-btn ${viewMode === 'flat' ? 'active' : ''}`}
                  onClick={() => setViewMode('flat')}
                  title="Flat Table View"
                >
                  📋 Flat
                </button>
                <button
                  type="button"
                  className={`view-mode-btn ${viewMode === 'grouped' ? 'active' : ''}`}
                  onClick={() => setViewMode('grouped')}
                  title="Grouped by Section"
                >
                  📑 By Sec
                </button>
              </div>

              {/* Audio Connect group */}
              <div className="audio-connect-group" title="Audio directory and connection">
                <div className="audio-location-input-wrapper">
                  <span className="audio-location-icon">📁</span>
                  <input
                    type="text"
                    className="audio-location-input"
                    value={audioLocation}
                    onChange={(e) => {
                      setAudioLocation(e.target.value);
                      if (driveConnected) setDriveConnected(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') checkDriveStatus(true, e.target.value);
                    }}
                    placeholder="E:\MaharajLectures"
                  />
                </div>
                <button
                  type="button"
                  className={`connect-btn ${driveConnected ? 'connected' : ''} ${checkingDrive ? 'connecting' : ''}`}
                  onClick={() => checkDriveStatus(true)}
                  disabled={checkingDrive}
                  title={driveConnected ? `Connected to ${audioLocation}` : 'Click to connect'}
                >
                  <span className="connect-status-indicator" />
                  {checkingDrive ? '...' : driveConnected ? '🟢' : '🔌 Connect'}
                </button>
              </div>

              {/* Expand Trigger Button - Symbol only */}
              <button
                type="button"
                className="collapse-trigger-btn symbol-only"
                onClick={toggleHeaderCollapse}
                title="Expand full overview"
              >
                ▼
              </button>
            </div>
          </div>
        ) : (
          /* Full Expanded Header (Stats Grid + Structured 2-Row Toolbar) */
          <>
            {/* Top Summary Stats Cards */}
            <div className="lectures-stats-grid">
              <div className="lecture-stat-card">
                <div className="stat-header">
                  <span className="stat-label">Total Lectures</span>
                  <span className="stat-icon">📚</span>
                </div>
                <div className="stat-value">{summary.totalCount}</div>
                <div className="stat-subtext">
                  Across {summary.sections?.length || 0} Sections
                </div>
              </div>

              <div className="lecture-stat-card">
                <div className="stat-header">
                  <span className="stat-label">Total Audio Time</span>
                  <span className="stat-icon">⏱️</span>
                </div>
                <div className="stat-value">{summary.totalDurationFormatted}</div>
                <div className="stat-subtext">
                  Cumulative lecture length
                </div>
              </div>

              <div className="lecture-stat-card stat-completed">
                <div className="stat-header">
                  <span className="stat-label">Listened / Completed</span>
                  <span className="stat-icon">✅</span>
                </div>
                <div className="stat-value">
                  {summary.completedCount} <span style={{ fontSize: '1rem', color: '#64748b', fontWeight: 500 }}>/ {summary.totalCount}</span>
                </div>
                <div className="stat-subtext">
                  {summary.completedDurationFormatted} listened ({summary.completionRate}%)
                </div>
                <div className="stat-progress-bar-container">
                  <div
                    className="stat-progress-bar-fill"
                    style={{ width: `${summary.completionRate}%` }}
                  />
                </div>
              </div>

              <div className="lecture-stat-card stat-pending">
                <div className="stat-header">
                  <span className="stat-label">Remaining Time</span>
                  <span className="stat-icon">⏳</span>
                </div>
                <div className="stat-value">{summary.pendingDurationFormatted}</div>
                <div className="stat-subtext">
                  {summary.pendingCount} lectures to listen
                </div>
              </div>
            </div>

            {/* Structured 2-Row Toolbar (Eliminates space-crunching and empty space) */}
            <div className="lectures-toolbar">
              {/* Row 1: Search, Filter Selects, View Mode, and Collapse Icon Button */}
              <div className="toolbar-row toolbar-filter-row">
                <div className="search-input-wrapper">
                  <span className="search-icon">🔍</span>
                  <input
                    type="text"
                    placeholder="Search lectures, topics, notes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Section Filter */}
                <select
                  className="filter-select"
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                >
                  <option value="ALL">All Sections ({summary.sections?.length || 0})</option>
                  {summary.sections?.map((sec) => (
                    <option key={sec} value={sec}>{sec}</option>
                  ))}
                </select>

                {/* Year Filter */}
                <select
                  className="filter-select"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  <option value="ALL">All Years ({summary.years?.length || 0})</option>
                  {summary.years?.map((yr) => (
                    <option key={yr} value={yr}>Year {yr}</option>
                  ))}
                </select>

                {/* Status Filter */}
                <select
                  className="filter-select"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="ALL">All Status</option>
                  <option value="pending">⏳ Pending</option>
                  <option value="completed">✅ Completed</option>
                </select>

                {/* View Mode */}
                <div className="view-mode-toggle">
                  <button
                    type="button"
                    className={`view-mode-btn ${viewMode === 'flat' ? 'active' : ''}`}
                    onClick={() => setViewMode('flat')}
                    title="Flat Table View"
                  >
                    📋 Flat Table
                  </button>
                  <button
                    type="button"
                    className={`view-mode-btn ${viewMode === 'grouped' ? 'active' : ''}`}
                    onClick={() => setViewMode('grouped')}
                    title="Grouped by Section"
                  >
                    📑 By Section
                  </button>
                </div>

                {/* Collapse Button - Symbol Only */}
                <button
                  type="button"
                  className="collapse-trigger-btn symbol-only"
                  onClick={toggleHeaderCollapse}
                  title="Collapse Overview"
                >
                  ▲
                </button>
              </div>

              {/* Row 2: Audio Location Connection & Action Buttons */}
              <div className="toolbar-row toolbar-action-row">
                <div className="audio-connect-group" title="Set audio folder location and connect">
                  <div className="audio-location-input-wrapper">
                    <span className="audio-location-icon" title="Audio directory location">📁</span>
                    <input
                      type="text"
                      className="audio-location-input"
                      value={audioLocation}
                      onChange={(e) => {
                        setAudioLocation(e.target.value);
                        if (driveConnected) setDriveConnected(false);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          checkDriveStatus(true, e.target.value);
                        }
                      }}
                      placeholder="E:\MaharajLectures"
                      title="Enter folder path containing lecture MP3 files (Default: E:\MaharajLectures)"
                    />
                    {audioLocation !== 'E:\\MaharajLectures' && (
                      <button
                        type="button"
                        className="audio-location-reset-btn"
                        onClick={() => {
                          setAudioLocation('E:\\MaharajLectures');
                          if (driveConnected) setDriveConnected(false);
                          checkDriveStatus(true, 'E:\\MaharajLectures');
                        }}
                        title="Reset to default (E:\MaharajLectures)"
                      >
                        ↺
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    className={`connect-btn ${driveConnected ? 'connected' : ''} ${checkingDrive ? 'connecting' : ''}`}
                    onClick={() => checkDriveStatus(true)}
                    disabled={checkingDrive}
                    title={
                      driveConnected
                        ? `Connected to ${audioLocation} (${driveInfo?.fileCount ?? 0} MP3 files found). Click to re-verify.`
                        : `Check and connect to folder: ${audioLocation || 'E:\\MaharajLectures'}`
                    }
                  >
                    <span className="connect-status-indicator" />
                    {checkingDrive
                      ? 'Connecting...'
                      : driveConnected
                      ? `🟢 Connected (${driveInfo?.fileCount ?? 0} files)`
                      : '🔌 Connect'}
                  </button>
                </div>

                <div className="action-buttons-group">
                  <button
                    type="button"
                    className="lec-btn success"
                    onClick={() => setShowImportModal(true)}
                    title="Import lecture list from Excel (.xlsx, .xls, .csv)"
                  >
                    📥 Import Excel
                  </button>
                  <button
                    type="button"
                    className="lec-btn primary"
                    onClick={() => {
                      setEditingLecture(null);
                      setShowLectureModal(true);
                    }}
                    title="Add a new lecture manually"
                  >
                    ➕ Add Lecture
                  </button>
                  {lectures.length > 0 && (
                    <>
                      <button
                        type="button"
                        className="lec-btn"
                        onClick={() => exportLecturesToExcel(filteredLectures)}
                        title="Export current view to Excel"
                      >
                        📊 Export
                      </button>
                      <button
                        type="button"
                        className="lec-btn danger"
                        onClick={handleClearAll}
                        title="Clear all lectures"
                      >
                        🗑️ Clear All
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Utilizing Additional Space: Transcript of the Audio Being Played */}
        {currentPlayingLecture && showTranscriptPanel && (
          <LectureTranscriptPanel
            lecture={currentPlayingLecture}
            onClose={() => setShowTranscriptPanel(false)}
            onSaveTranscript={handleSaveTranscript}
          />
        )}

        {/* Main Content Area */}
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', background: '#fff', borderRadius: '12px' }}>
            <div className="loading-spinner"></div>
            <p style={{ marginTop: '14px', color: '#64748b' }}>Loading lecture hearing schedule...</p>
          </div>
        ) : error ? (
          <div style={{ padding: '24px', background: '#fee2e2', color: '#991b1b', borderRadius: '12px' }}>
            <strong>Error:</strong> {error}
          </div>
        ) : lectures.length === 0 ? (
          <div className="empty-lectures-state">
            <div className="empty-state-icon">🎧</div>
            <h3 className="empty-state-title">No Lectures in Schedule Yet</h3>
            <p className="empty-state-desc">
              Import your lecture listening list directly from an Excel sheet with columns for 
              <strong> ID, Title, Year, Duration (hh:mm:ss), Section No., Section, Sub-section</strong>, 
              or add them manually.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                className="lec-btn success"
                onClick={() => setShowImportModal(true)}
              >
                📥 Upload Excel Sheet
              </button>
              <button
                type="button"
                className="lec-btn primary"
                onClick={() => {
                  setEditingLecture(null);
                  setShowLectureModal(true);
                }}
              >
                ➕ Add Lecture Manually
              </button>
            </div>
          </div>
        ) : viewMode === 'flat' ? (
          /* Flat Table View */
          <div className="lectures-table-card">
            <div className="table-header-bar">
              <div className="table-header-title">
                <span>Lecture Hearing Schedule</span>
                <span className="count-tag">{filteredLectures.length} of {lectures.length} lectures</span>
              </div>
            </div>

            <div className="lectures-table-wrapper">
              <table className="lectures-table">
                <thead>
                  <tr>
                    <th className="col-checkbox">Heard</th>
                    <th className="col-id">ID</th>
                    <th className="col-title">Title</th>
                    <th className="col-year">Year</th>
                    <th className="col-duration">Duration</th>
                    <th className="col-sec-no">Sec No.</th>
                    <th className="col-section">Section</th>
                    <th className="col-subsection">Sub-section</th>
                    <th className="col-schedule">Schedule Date</th>
                    <th className="col-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLectures.map((lec) => {
                    const isCompleted = lec.status === 'completed';
                    return (
                      <tr key={lec.id} className={isCompleted ? 'completed-row' : ''}>
                        <td className="col-checkbox">
                          <input
                            type="checkbox"
                            checked={isCompleted}
                            onChange={() => handleToggleStatus(lec.id, lec.status)}
                            title={isCompleted ? 'Mark as pending' : 'Mark as heard/completed'}
                            style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                          />
                        </td>
                        <td className="col-id">
                          {driveConnected ? (
                            <button
                              type="button"
                              className={`lecture-id-audio-btn ${currentPlayingLecture?.id === lec.id ? 'playing' : ''}`}
                              onClick={() => handlePlayLecture(lec)}
                              title={`Play audio: ${audioLocation}\\${lec.lecture_id || lec.id}.mp3`}
                            >
                              <span className="audio-play-icon">
                                {currentPlayingLecture?.id === lec.id ? '🔊' : '▶'}
                              </span>
                              <span>{lec.lecture_id || lec.id}</span>
                            </button>
                          ) : (
                            <span
                              className="lecture-id-plain"
                              title={`Click 'Connect' in the toolbar to enable playback from ${audioLocation}`}
                            >
                              {lec.lecture_id || lec.id}
                            </span>
                          )}
                        </td>
                        <td className="col-title">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 600 }}>{lec.title}</span>
                            {lec.transcript ? (
                              <button
                                type="button"
                                className="transcript-mini-badge"
                                title="Click to view/edit saved transcript"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCurrentPlayingLecture(lec);
                                  setShowTranscriptPanel(true);
                                }}
                                style={{
                                  background: '#e0e7ff',
                                  color: '#4338ca',
                                  border: '1px solid #c7d2fe',
                                  borderRadius: '4px',
                                  padding: '1px 6px',
                                  fontSize: '0.72rem',
                                  cursor: 'pointer',
                                  fontWeight: 600
                                }}
                              >
                                📝 Transcript
                              </button>
                            ) : null}
                          </div>
                          {lec.notes && (
                            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                              📝 {lec.notes}
                            </div>
                          )}
                        </td>
                        <td className="col-year">{lec.year || '—'}</td>
                        <td className="col-duration">{lec.duration || '00:00:00'}</td>
                        <td className="col-sec-no">{lec.section_no || '—'}</td>
                        <td className="col-section">
                          {lec.section ? (
                            <span className="badge-section">{lec.section}</span>
                          ) : '—'}
                        </td>
                        <td className="col-subsection">{lec.sub_section || '—'}</td>
                        <td className="col-schedule">
                          <span style={{ fontSize: '0.8rem', color: isCompleted ? '#047857' : '#475569' }}>
                            {isCompleted
                              ? `✅ ${lec.completed_date || 'Heard'}`
                              : lec.scheduled_date
                              ? `📅 ${lec.scheduled_date}`
                              : '—'}
                          </span>
                        </td>
                        <td className="col-actions">
                          <button
                            type="button"
                            className="action-btn-sm"
                            title="View / edit transcript"
                            onClick={() => {
                              setCurrentPlayingLecture(lec);
                              setShowTranscriptPanel(true);
                            }}
                          >
                            📝
                          </button>
                          <button
                            type="button"
                            className="action-btn-sm"
                            title="Edit lecture"
                            onClick={() => {
                              setEditingLecture(lec);
                              setShowLectureModal(true);
                            }}
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            className="action-btn-sm delete"
                            title="Delete lecture"
                            onClick={() => handleDeleteLecture(lec.id, lec.title)}
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Grouped by Section View */
          <div className="section-group-container">
            {groupedSections.map((group) => {
              const isCollapsed = collapsedSections[group.sectionName];
              const pct = group.lectures.length > 0 ? Math.round((group.completedCount / group.lectures.length) * 100) : 0;
              return (
                <div key={group.sectionName} className="section-group-card">
                  <div
                    className="section-group-header"
                    onClick={() => toggleSectionCollapse(group.sectionName)}
                  >
                    <div className="section-group-title">
                      <span>{isCollapsed ? '▶' : '▼'}</span>
                      {group.sectionNo && <span className="count-tag">Sec {group.sectionNo}</span>}
                      <span>{group.sectionName}</span>
                    </div>

                    <div className="section-group-stats">
                      <span><strong>{group.lectures.length}</strong> lectures</span>
                      <span>⏱️ <strong>{formatDurationHuman(group.totalSeconds)}</strong></span>
                      <span style={{ color: pct === 100 ? '#10b981' : '#b45309', fontWeight: 600 }}>
                        {group.completedCount}/{group.lectures.length} heard ({pct}%)
                      </span>
                    </div>
                  </div>

                  {!isCollapsed && (
                    <div className="lectures-table-wrapper">
                      <table className="lectures-table">
                        <thead>
                          <tr>
                            <th className="col-checkbox">Heard</th>
                            <th className="col-id">ID</th>
                            <th className="col-title">Title</th>
                            <th className="col-year">Year</th>
                            <th className="col-duration">Duration</th>
                            <th className="col-sec-no">Sec No.</th>
                            <th className="col-subsection">Sub-section</th>
                            <th className="col-schedule">Schedule Date</th>
                            <th className="col-actions">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.lectures.map((lec) => {
                            const isCompleted = lec.status === 'completed';
                            return (
                              <tr key={lec.id} className={isCompleted ? 'completed-row' : ''}>
                                <td className="col-checkbox">
                                  <input
                                    type="checkbox"
                                    checked={isCompleted}
                                    onChange={() => handleToggleStatus(lec.id, lec.status)}
                                    title={isCompleted ? 'Mark as pending' : 'Mark as heard'}
                                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                                  />
                                </td>
                                <td className="col-id">
                                  {driveConnected ? (
                                    <button
                                      type="button"
                                      className={`lecture-id-audio-btn ${currentPlayingLecture?.id === lec.id ? 'playing' : ''}`}
                                      onClick={() => handlePlayLecture(lec)}
                                      title={`Play audio: ${audioLocation}\\${lec.lecture_id || lec.id}.mp3`}
                                    >
                                      <span className="audio-play-icon">
                                        {currentPlayingLecture?.id === lec.id ? '🔊' : '▶'}
                                      </span>
                                      <span>{lec.lecture_id || lec.id}</span>
                                    </button>
                                  ) : (
                                    <span
                                      className="lecture-id-plain"
                                      title={`Click 'Connect' in the toolbar to enable playback from ${audioLocation}`}
                                    >
                                      {lec.lecture_id || lec.id}
                                    </span>
                                  )}
                                </td>
                                <td className="col-title">
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    <span style={{ fontWeight: 600 }}>{lec.title}</span>
                                    {lec.transcript ? (
                                      <button
                                        type="button"
                                        className="transcript-mini-badge"
                                        title="Click to view/edit saved transcript"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setCurrentPlayingLecture(lec);
                                          setShowTranscriptPanel(true);
                                        }}
                                        style={{
                                          background: '#e0e7ff',
                                          color: '#4338ca',
                                          border: '1px solid #c7d2fe',
                                          borderRadius: '4px',
                                          padding: '1px 6px',
                                          fontSize: '0.72rem',
                                          cursor: 'pointer',
                                          fontWeight: 600
                                        }}
                                      >
                                        📝 Transcript
                                      </button>
                                    ) : null}
                                  </div>
                                  {lec.notes && (
                                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                                      📝 {lec.notes}
                                    </div>
                                  )}
                                </td>
                                <td className="col-year">{lec.year || '—'}</td>
                                <td className="col-duration">{lec.duration || '00:00:00'}</td>
                                <td className="col-sec-no">{lec.section_no || '—'}</td>
                                <td className="col-subsection">{lec.sub_section || '—'}</td>
                                <td className="col-schedule">
                                  <span style={{ fontSize: '0.8rem', color: isCompleted ? '#047857' : '#475569' }}>
                                    {isCompleted
                                      ? `✅ ${lec.completed_date || 'Heard'}`
                                      : lec.scheduled_date
                                      ? `📅 ${lec.scheduled_date}`
                                      : '—'}
                                  </span>
                                </td>
                                <td className="col-actions">
                                  <button
                                    type="button"
                                    className="action-btn-sm"
                                    title="View / edit transcript"
                                    onClick={() => {
                                      setCurrentPlayingLecture(lec);
                                      setShowTranscriptPanel(true);
                                    }}
                                  >
                                    📝
                                  </button>
                                  <button
                                    type="button"
                                    className="action-btn-sm"
                                    title="Edit lecture"
                                    onClick={() => {
                                      setEditingLecture(lec);
                                      setShowLectureModal(true);
                                    }}
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    type="button"
                                    className="action-btn-sm delete"
                                    title="Delete lecture"
                                    onClick={() => handleDeleteLecture(lec.id, lec.title)}
                                  >
                                    🗑️
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Import Modal */}
      <ExcelImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportSuccess={(count) => {
          showToast(`Successfully imported ${count} lectures!`);
          fetchLectures();
        }}
      />

      {/* Add / Edit Lecture Modal */}
      <LectureModal
        isOpen={showLectureModal}
        onClose={() => {
          setShowLectureModal(false);
          setEditingLecture(null);
        }}
        lecture={editingLecture}
        onSave={handleSaveLecture}
      />

      {/* Docked MP3 Audio Player */}
      {currentPlayingLecture && (
        <LectureAudioPlayer
          lecture={currentPlayingLecture}
          audioLocation={audioLocation}
          onClose={() => setCurrentPlayingLecture(null)}
          onToggleStatus={handleToggleStatus}
          onNext={handleNextTrack}
          onPrev={handlePrevTrack}
          hasNext={currentTrackIndex >= 0 && currentTrackIndex < filteredLectures.length - 1}
          hasPrev={currentTrackIndex > 0}
          onToggleTranscript={() => setShowTranscriptPanel((prev) => !prev)}
          showTranscript={showTranscriptPanel}
        />
      )}
    </div>
  );
}