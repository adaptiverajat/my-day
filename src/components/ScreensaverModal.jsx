import { useState, useEffect } from 'react';
import ScreensaverTaskColumn from './ScreensaverTaskColumn';

const ScreensaverModal = ({ show, tasks, currentDate }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    if (show) {
      const timer = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [show]);

  if (!show) return null;

  const getTasksForDay = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return tasks.filter(task => task.task_date === dateStr && !task.is_hidden);
  };

  const getDays = () => {
    const yesterday = new Date(currentDate);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const today = new Date(currentDate);
    
    const tomorrow = new Date(currentDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dayAfter = new Date(currentDate);
    dayAfter.setDate(dayAfter.getDate() + 2);
    
    return [
      { title: 'Yesterday', date: yesterday },
      { title: 'Today', date: today },
      { title: 'Tomorrow', date: tomorrow },
      { title: 'Day After', date: dayAfter }
    ];
  };

  const formatDate = (date) => {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const daysList = getDays();

  return (
    <div className="screensaver-overlay">
      <div className="screensaver-content">
        <div className="screensaver-time">
          {currentTime.toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
          })}
        </div>

        <div className="screensaver-date">
          {formatDate(currentDate)}
        </div>

        <div className="screensaver-tasks">
          {daysList.map(({ title, date }) => (
            <ScreensaverTaskColumn
              key={title}
              title={title}
              date={date}
              tasks={getTasksForDay(date)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ScreensaverModal;