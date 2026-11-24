import React from 'react';
import TaskModal from '../TaskModal';
import VoiceInputModal from '../VoiceInputModal';
import HelpModal from '../HelpModal';
import ScreensaverModal from '../ScreensaverModal';

export default function CalendarModals({
  showModal,
  selectedDate,
  timeSlots,
  initialFromTime,
  initialToTime,
  editingTask,
  secretMode,
  showVoiceInput,
  showHelp,
  showScreensaver,
  tasks,
  currentDate,
  onSaveTask,
  onDeleteTask,
  onCloseTaskModal,
  onCloseVoiceInput,
  onCloseHelp,
  onTasksCreated
}) {
  return (
    <>
      <TaskModal
        show={showModal}
        onClose={onCloseTaskModal}
        selectedDate={selectedDate}
        onSave={onSaveTask}
        timeSlots={timeSlots}
        initialFromTime={initialFromTime}
        initialToTime={initialToTime}
        editingTask={editingTask}
        secretMode={secretMode}
        onDelete={onDeleteTask}
      />

      <VoiceInputModal 
        show={showVoiceInput}
        onClose={onCloseVoiceInput}
        currentDate={currentDate}
        onTasksCreated={onTasksCreated}
      />

      {showHelp && <HelpModal onClose={onCloseHelp} />}

      <ScreensaverModal 
        show={showScreensaver}
        tasks={tasks}
        currentDate={currentDate}
      />
    </>
  );
}
