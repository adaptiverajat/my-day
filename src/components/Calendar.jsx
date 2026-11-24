import { useState } from 'react';
import CalendarHeader from './CalendarHeader';
import ViewControls from './ViewControls';
import TodoList from './TodoList';
import CalendarDateNavigation from './calendar/CalendarDateNavigation';
import CalendarViewRouter from './calendar/CalendarViewRouter';
import CalendarModals from './calendar/CalendarModals';
import DatabaseStatusBanner from './calendar/DatabaseStatusBanner';
import { useCalendarNavigation } from './calendar/useCalendarNavigation';
import { useIdleScreensaver } from './calendar/useIdleScreensaver';
import { useDatabaseInit } from './calendar/useDatabaseInit';
import { useCalendarTasks } from '../hooks/useCalendarTasks';
import { useTodoItems } from '../hooks/useTodoItems';
import { useTimeSlots } from '../hooks/useTimeSlots';
import { useCurrentTime } from '../hooks/useCurrentTime';
import { parseDateInputValue } from '../utils/dateUtils';
import { calculateEndTime } from '../utils/timeUtils';

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState('week');
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [initialFromTime, setInitialFromTime] = useState('');
  const [initialToTime, setInitialToTime] = useState('');
  const [editingTask, setEditingTask] = useState(null);
  const [viewDensity, setViewDensity] = useState(1);
  const [showVoiceInput, setShowVoiceInput] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [secretMode, setSecretMode] = useState(false);

  const { databaseReady, databaseError, setupDatabase } = useDatabaseInit();
  const { tasks, addTask, updateTask, deleteTask, fetchTasks } = useCalendarTasks(currentDate, currentView, databaseReady);
  const { todoItems, addTodoItem, toggleTodoItem, deleteTodoItem, updateTodoItem } = useTodoItems(databaseReady);
  const timeSlots = useTimeSlots();
  const currentTime = useCurrentTime(() => window.location.reload());
  const navigation = useCalendarNavigation(currentDate, setCurrentDate);
  const { showScreensaver } = useIdleScreensaver();

  const handleDayClick = (date, clickedTime = null) => {
    setSelectedDate(date);
    setEditingTask(null);
    setInitialFromTime(clickedTime || '');
    setInitialToTime(clickedTime ? calculateEndTime(clickedTime) : '');
    setShowModal(true);
  };

  const handleTaskClick = (task) => {
    setSelectedDate(parseDateInputValue(task.task_date));
    setEditingTask(task);
    setInitialFromTime(task.from_time);
    setInitialToTime(task.to_time);
    setShowModal(true);
  };

  const handleSaveTask = async (taskData) => {
    const success = editingTask ? await updateTask(editingTask.id, taskData) : await addTask(taskData);
    if (success) {
      setShowModal(false);
      setEditingTask(null);
    }
  };

  const handleDeleteTask = async (id, deleteMode) => {
    const success = await deleteTask(id, deleteMode);
    if (success) {
      setShowModal(false);
      setEditingTask(null);
    }
  };

  return (
    <div className="calendar-app">
      <DatabaseStatusBanner databaseReady={databaseReady} databaseError={databaseError} onRetry={setupDatabase} />
      <div className="header-row">
        <CalendarHeader onVoiceInputClick={() => setShowVoiceInput(true)} onHelpClick={() => setShowHelp(true)} onSecretModeToggle={setSecretMode} secretMode={secretMode} />
        <ViewControls currentView={currentView} setCurrentView={setCurrentView} setCurrentDate={setCurrentDate} viewDensity={viewDensity} setViewDensity={setViewDensity} />
        <CalendarDateNavigation currentDate={currentDate} currentView={currentView} currentTime={currentTime} onNavigate={navigation} />
      </div>

      <CalendarViewRouter
        currentView={currentView}
        currentDate={currentDate}
        tasks={tasks}
        timeSlots={timeSlots}
        currentTime={currentTime}
        viewDensity={viewDensity}
        secretMode={secretMode}
        onDayClick={handleDayClick}
        onTaskClick={handleTaskClick}
        onMonthClick={(month) => {
          setCurrentDate(month);
          setCurrentView('month');
        }}
      />

      <TodoList todoItems={todoItems} onAdd={addTodoItem} onToggle={toggleTodoItem} onDelete={deleteTodoItem} onUpdate={updateTodoItem} />

      <CalendarModals
        showModal={showModal}
        selectedDate={selectedDate}
        timeSlots={timeSlots}
        initialFromTime={initialFromTime}
        initialToTime={initialToTime}
        editingTask={editingTask}
        secretMode={secretMode}
        showVoiceInput={showVoiceInput}
        showHelp={showHelp}
        showScreensaver={showScreensaver}
        tasks={tasks}
        currentDate={currentDate}
        onSaveTask={handleSaveTask}
        onDeleteTask={handleDeleteTask}
        onCloseTaskModal={() => { setShowModal(false); setEditingTask(null); }}
        onCloseVoiceInput={() => setShowVoiceInput(false)}
        onCloseHelp={() => setShowHelp(false)}
        onTasksCreated={() => fetchTasks()}
      />
    </div>
  );
}
