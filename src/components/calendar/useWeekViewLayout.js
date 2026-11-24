import { useMemo } from 'react';
import { getTasksForDate } from '../../utils/dateUtils';
import { calculateTaskPosition } from '../../utils/timeUtils';

export function useWeekViewLayout({ viewDensity, tasks, weekDays, timeSlots, secretMode }) {
  // Determine which time slots are blank for all visible days
  const blankTimeSlots = useMemo(() => {
    if (viewDensity === 0) return new Set();

    const blankSlots = new Set();
    
    timeSlots.forEach((time, slotIndex) => {
      let isBlank = true;
      
      weekDays.forEach(day => {
        const dayTasks = getTasksForDate(tasks, day).filter(task => secretMode || !task.is_hidden);
        const [hours, minutes] = time.value.split(':').map(Number);
        const slotStartMinutes = hours * 60 + minutes;
        const slotEndMinutes = slotStartMinutes + 30;
        
        dayTasks.forEach(task => {
          const taskStart = task.from_time.split(':').map(Number);
          const taskEnd = task.to_time.split(':').map(Number);
          const taskStartMinutes = taskStart[0] * 60 + taskStart[1];
          const taskEndMinutes = taskEnd[0] * 60 + taskEnd[1];
          
          if (taskStartMinutes < slotEndMinutes && taskEndMinutes > slotStartMinutes) {
            isBlank = false;
          }
        });
      });
      
      if (isBlank) blankSlots.add(slotIndex);
    });
    
    return blankSlots;
  }, [viewDensity, tasks, weekDays, timeSlots, secretMode]);

  const getActualPosition = (slotIndex) => {
    let position = 0;
    for (let i = 0; i < slotIndex; i++) {
      if (viewDensity === 2) {
        position += 15;
      } else if (viewDensity === 1 && blankTimeSlots.has(i)) {
        position += 15;
      } else {
        position += 60;
      }
    }
    return position;
  };

  const calculateTaskPositionWithCollapse = (task) => {
    const [fromHours, fromMinutes] = task.from_time.split(':').map(Number);
    const [toHours, toMinutes] = task.to_time.split(':').map(Number);
    
    const fromTotalMinutes = fromHours * 60 + fromMinutes;
    const toTotalMinutes = toHours * 60 + toMinutes;
    
    const slotIndex = Math.floor(fromTotalMinutes / 30);
    const endSlotIndex = Math.floor(toTotalMinutes / 30);
    const top = getActualPosition(slotIndex);
    
    let height = 0;
    for (let i = slotIndex; i < endSlotIndex; i++) {
      if (viewDensity === 2) {
        height += 15;
      } else if (viewDensity === 1 && blankTimeSlots.has(i)) {
        height += 15;
      } else {
        height += 60;
      }
    }
    
    const remainingMinutes = toTotalMinutes % 30;
    if (remainingMinutes > 0) {
      let slotHeight = (viewDensity === 2 || (viewDensity === 1 && blankTimeSlots.has(endSlotIndex))) ? 15 : 60;
      height += (remainingMinutes / 30) * slotHeight;
    }
    
    return { top, height };
  };

  const handleOverlappingTasks = (dayTasks) => {
    const sortedTasks = [...dayTasks].sort((a, b) => {
      const aStart = a.from_time.split(':').map(Number);
      const bStart = b.from_time.split(':').map(Number);
      return (aStart[0] * 60 + aStart[1]) - (bStart[0] * 60 + bStart[1]);
    });

    const groups = [];
    for (const task of sortedTasks) {
      const taskStart = task.from_time.split(':').map(Number);
      const taskEnd = task.to_time.split(':').map(Number);
      const taskStartMin = taskStart[0] * 60 + taskStart[1];
      const taskEndMin = taskEnd[0] * 60 + taskEnd[1];

      let placed = false;
      for (const group of groups) {
        const groupTask = group[0];
        const groupStart = groupTask.from_time.split(':').map(Number);
        const groupEnd = groupTask.to_time.split(':').map(Number);
        const groupStartMin = groupStart[0] * 60 + groupStart[1];
        const groupEndMin = groupEnd[0] * 60 + groupEnd[1];

        if (taskStartMin < groupEndMin && taskEndMin > groupStartMin) {
          group.push(task);
          placed = true;
          break;
        }
      }

      if (!placed) groups.push([task]);
    }

    const positionedTasks = [];
    for (const group of groups) {
      const groupSize = group.length;
      group.forEach((task, index) => {
        const position = viewDensity > 0 ? calculateTaskPositionWithCollapse(task) : calculateTaskPosition(task);
        positionedTasks.push({
          ...task,
          ...position,
          width: 100 / groupSize,
          left: (index * 100) / groupSize
        });
      });
    }

    return positionedTasks;
  };

  return {
    blankTimeSlots,
    getActualPosition,
    calculateTaskPositionWithCollapse,
    handleOverlappingTasks
  };
}
