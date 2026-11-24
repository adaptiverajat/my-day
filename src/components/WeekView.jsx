import { useRef, useEffect, useState } from 'react';
import { getWeekDays } from '../utils/dateUtils';
import { getCurrentTimePosition } from '../utils/timeUtils';
import { useWeekViewLayout } from './calendar/useWeekViewLayout';
import WeekDayColumn from './calendar/WeekDayColumn';
import WeekTimeLabels from './calendar/WeekTimeLabels';

const WeekView = ({ currentDate, tasks, timeSlots, onDayClick, onTaskClick, currentTime, days, viewDensity, secretMode }) => {
  const mainScrollRef = useRef(null);
  const rightTimeScrollRef = useRef(null);
  const [previousDate, setPreviousDate] = useState(null);

  const weekDays = days || getWeekDays(currentDate);

  const {
    blankTimeSlots,
    getActualPosition,
    handleOverlappingTasks
  } = useWeekViewLayout({ viewDensity, tasks, weekDays, timeSlots, secretMode });

  // Scroll to 7:00AM or current time on date change or initial load
  useEffect(() => {
    const currentDateString = weekDays[0]?.toDateString();
    if (mainScrollRef.current) {
      if (previousDate === null) {
        const currentTimePosition = viewDensity > 0 
          ? getActualPosition(Math.floor((currentTime.getHours() * 60 + currentTime.getMinutes()) / 30)) 
          : getCurrentTimePosition(currentTime);
        mainScrollRef.current.scrollTop = Math.max(0, currentTimePosition - 300);
      } else if (currentDateString !== previousDate) {
        const position7AM = getActualPosition(14); // 7:00AM is slot 14
        mainScrollRef.current.scrollTop = Math.max(0, position7AM - 50);
      }
    }
    setPreviousDate(currentDateString);
  }, [currentDate, weekDays, previousDate, blankTimeSlots, currentTime, viewDensity]);

  const handleMainScroll = (e) => {
    if (rightTimeScrollRef.current) {
      rightTimeScrollRef.current.scrollTop = e.target.scrollTop;
    }
  };

  return (
    <div className="week-view">
      <WeekTimeLabels
        timeSlots={timeSlots}
        viewDensity={viewDensity}
        blankTimeSlots={blankTimeSlots}
        scrollRef={rightTimeScrollRef}
      />
      <div className="week-main-content">
        <div className="week-header">
          {weekDays.map((day, index) => (
            <div key={index} className="day-header">
              <div className="day-name">{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
              <div className="day-number">{day.getDate()}</div>
            </div>
          ))}
        </div>
        
        <div 
          className="week-scroll-container" 
          ref={mainScrollRef}
          onScroll={handleMainScroll}
        >
          <div className="week-grid-time">
            {weekDays.map((day, index) => (
              <WeekDayColumn
                key={index}
                day={day}
                timeSlots={timeSlots}
                tasks={tasks}
                secretMode={secretMode}
                viewDensity={viewDensity}
                blankTimeSlots={blankTimeSlots}
                currentTime={currentTime}
                getActualPosition={getActualPosition}
                handleOverlappingTasks={handleOverlappingTasks}
                onDayClick={onDayClick}
                onTaskClick={onTaskClick}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeekView;