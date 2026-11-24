import { useState } from 'react';
import ParsedTasksTable from './ParsedTasksTable';
import IcsImportSection from './IcsImportSection';
import { parseTasksWithAI } from '../utils/openaiTaskParser';

const VoiceInputModal = ({ show, onClose, currentDate, onTasksCreated }) => {
  const [input, setInput] = useState('');
  const [parsedTasks, setParsedTasks] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!show) return null;

  const handleParse = async () => {
    if (!input.trim()) {
      setError('Please enter task descriptions');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const tasks = await parseTasksWithAI(input, currentDate);
      setParsedTasks(tasks);
    } catch (err) {
      setError(err.message || 'Failed to parse tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!parsedTasks || parsedTasks.length === 0) {
      setError('No tasks to create');
      return;
    }

    try {
      for (const task of parsedTasks) {
        const response = await fetch('http://localhost:3001/api/calendar-tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: task.title,
            description: task.description || '',
            task_date: task.date,
            from_time: task.from_time,
            to_time: task.to_time,
            color: task.color || '#e3f2fd'
          })
        });

        if (!response.ok) {
          throw new Error(`Failed to create task: ${task.title}`);
        }
      }

      onTasksCreated();
      handleCancel();
    } catch (err) {
      setError('Failed to create tasks: ' + err.message);
    }
  };

  const handleCancel = () => {
    setInput('');
    setParsedTasks(null);
    setError(null);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content voice-input-modal">
        <h2>Voice/Text Task Input</h2>
        
        <div className="form-group">
          <label>Describe your tasks in plain language:</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g., 'Meeting with team tomorrow at 2pm, Workout at 6am daily, Complete project report by Friday 5pm'"
            rows={4}
            className="voice-input-textarea"
          />
        </div>

        <IcsImportSection
          onTasksParsed={setParsedTasks}
          onError={setError}
          loading={loading}
          setLoading={setLoading}
        />

        {!parsedTasks && (
          <button 
            className="btn-parse" 
            onClick={handleParse}
            disabled={loading}
          >
            {loading ? 'Parsing...' : 'Parse Tasks'}
          </button>
        )}

        {error && <p className="error-message">{error}</p>}

        {parsedTasks && (
          <ParsedTasksTable
            tasks={parsedTasks}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
          />
        )}

        {!parsedTasks && (
          <div className="modal-buttons">
            <button className="btn-cancel" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceInputModal;