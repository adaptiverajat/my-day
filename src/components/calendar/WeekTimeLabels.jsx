import React from 'react';

export default function WeekTimeLabels({ timeSlots, viewDensity, blankTimeSlots, scrollRef }) {
  return (
    <div className="week-time-labels-right">
      <div className="time-label-spacer">
        <div className="day-name">Time</div>
        <div className="arrow-down">↓</div>
      </div>
      <div className="time-labels-scroll" ref={scrollRef}>
        {timeSlots.map((time, index) => {
          const isCollapsed = viewDensity === 1 && blankTimeSlots.has(index);
          const isUltraCollapsed = viewDensity === 2;
          return (
            <div 
              key={index} 
              className={`time-label ${isUltraCollapsed ? 'ultra-collapsed-slot' : (isCollapsed ? 'collapsed-slot' : '')}`}
            >
              {time.display}
            </div>
          );
        })}
      </div>
    </div>
  );
}
