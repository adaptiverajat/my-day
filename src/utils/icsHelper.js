export const formatICSDate = (icsDate) => {
  if (!icsDate) return { date: '', time: '09:00' };

  if (icsDate.includes('T')) {
    const datePart = icsDate.substring(0, 8);
    const timePart = icsDate.substring(9, 15);
    
    const year = datePart.substring(0, 4);
    const month = datePart.substring(4, 6);
    const day = datePart.substring(6, 8);
    const hour = timePart.substring(0, 2);
    const minute = timePart.substring(2, 4);
    
    return {
      date: `${year}-${month}-${day}`,
      time: `${hour}:${minute}`
    };
  } else {
    const year = icsDate.substring(0, 4);
    const month = icsDate.substring(4, 6);
    const day = icsDate.substring(6, 8);
    
    return {
      date: `${year}-${month}-${day}`,
      time: '09:00'
    };
  }
};

export const parseICSFile = (icsContent) => {
  const events = [];
  const lines = (icsContent || '').split('\n');
  let currentEvent = null;
  let inEvent = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line === 'BEGIN:VEVENT') {
      inEvent = true;
      currentEvent = {};
    } else if (line === 'END:VEVENT') {
      if (currentEvent && currentEvent.summary && currentEvent.dtstart) {
        events.push(currentEvent);
      }
      inEvent = false;
      currentEvent = null;
    } else if (inEvent && currentEvent) {
      if (line.startsWith('SUMMARY:')) {
        currentEvent.summary = line.substring(8);
      } else if (line.startsWith('DESCRIPTION:')) {
        currentEvent.description = line.substring(12);
      } else if (line.startsWith('DTSTART:')) {
        currentEvent.dtstart = line.substring(8);
      } else if (line.startsWith('DTEND:')) {
        currentEvent.dtend = line.substring(6);
      } else if (line.startsWith('DTSTART;')) {
        const parts = line.split(':');
        if (parts.length > 1) {
          currentEvent.dtstart = parts[1];
        }
      } else if (line.startsWith('DTEND;')) {
        const parts = line.split(':');
        if (parts.length > 1) {
          currentEvent.dtend = parts[1];
        }
      }
    }
  }

  return events;
};

export const convertICSEventsToTasks = (events) => {
  return events.map(event => {
    const startData = formatICSDate(event.dtstart);
    const endData = event.dtend ? formatICSDate(event.dtend) : null;
    
    let endTime = '10:00';
    if (endData && endData.time) {
      endTime = endData.time;
    } else if (startData.time) {
      const [startHour, startMin] = startData.time.split(':');
      const endHour = (parseInt(startHour, 10) + 1).toString().padStart(2, '0');
      endTime = `${endHour}:${startMin}`;
    }

    return {
      title: event.summary || 'Meeting',
      description: event.description || '',
      date: startData.date,
      from_time: startData.time,
      to_time: endTime,
      color: '#e3f2fd'
    };
  });
};
