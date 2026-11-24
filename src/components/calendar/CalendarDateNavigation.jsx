import React from 'react';
import {
  formatDateDisplay,
  formatMonthDisplay,
  formatYearDisplay,
  formatCurrentRangeDisplay
} from '../../utils/dateUtils';

export default function CalendarDateNavigation({
  currentDate,
  currentView,
  currentTime,
  onNavigate
}) {
  return (
    <div className="date-display">
      <div className="digital-clock">
        {currentTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </div>
      {currentView === 'week' && (
        <>
          <button className="nav-btn" onClick={() => onNavigate.navigateWeek(-1)}>←</button>
          <h2>{formatDateDisplay(currentDate)}</h2>
          <button className="nav-btn" onClick={() => onNavigate.navigateWeek(1)}>→</button>
        </>
      )}
      {currentView === 'current' && (
        <>
          <button className="nav-btn" onClick={() => onNavigate.navigateCurrent(-1)}>←</button>
          <h2>{formatCurrentRangeDisplay(currentDate)}</h2>
          <button className="nav-btn" onClick={() => onNavigate.navigateCurrent(1)}>→</button>
        </>
      )}
      {currentView === 'day' && (
        <>
          <button className="nav-btn" onClick={() => onNavigate.navigateDay(-1)}>←</button>
          <h2>{formatDateDisplay(currentDate)}</h2>
          <button className="nav-btn" onClick={() => onNavigate.navigateDay(1)}>→</button>
        </>
      )}
      {currentView === 'month' && (
        <>
          <button className="nav-btn" onClick={() => onNavigate.navigateMonth(-1)}>←</button>
          <h2>{formatMonthDisplay(currentDate)}</h2>
          <button className="nav-btn" onClick={() => onNavigate.navigateMonth(1)}>→</button>
        </>
      )}
      {currentView === 'year' && (
        <>
          <button className="nav-btn" onClick={() => onNavigate.navigateYear(-1)}>←</button>
          <h2>{formatYearDisplay(currentDate)}</h2>
          <button className="nav-btn" onClick={() => onNavigate.navigateYear(1)}>→</button>
        </>
      )}
    </div>
  );
}
