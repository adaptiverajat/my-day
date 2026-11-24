import React from 'react';
import WeekView from '../WeekView';
import DayView from '../DayView';
import MonthView from '../MonthView';
import YearView from '../YearView';
import { getCurrentRange } from '../../utils/dateUtils';

export default function CalendarViewRouter({
  currentView,
  currentDate,
  tasks,
  timeSlots,
  currentTime,
  viewDensity,
  secretMode,
  onDayClick,
  onTaskClick,
  onMonthClick
}) {
  if (currentView === 'week' || currentView === 'current') {
    return (
      <WeekView
        currentDate={currentDate}
        tasks={tasks}
        timeSlots={timeSlots}
        onDayClick={onDayClick}
        onTaskClick={onTaskClick}
        currentTime={currentTime}
        days={currentView === 'current' ? getCurrentRange(currentDate).days : undefined}
        viewDensity={viewDensity}
        secretMode={secretMode}
      />
    );
  }

  if (currentView === 'day') {
    return (
      <DayView
        key={`day-${currentDate.toISOString()}-${tasks.length}`}
        currentDate={currentDate}
        tasks={tasks}
        onDayClick={onDayClick}
        onTaskClick={onTaskClick}
        secretMode={secretMode}
      />
    );
  }

  if (currentView === 'month') {
    return (
      <MonthView
        currentDate={currentDate}
        tasks={tasks}
        onDayClick={onDayClick}
        onTaskClick={onTaskClick}
        secretMode={secretMode}
      />
    );
  }

  if (currentView === 'year') {
    return (
      <YearView
        currentDate={currentDate}
        tasks={tasks}
        onMonthClick={onMonthClick}
        secretMode={secretMode}
      />
    );
  }

  return null;
}
