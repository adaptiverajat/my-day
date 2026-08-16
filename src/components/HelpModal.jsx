import packageJson from '../../package.json'

const HelpModal = ({ onClose }) => {
  const appVersion = packageJson.version
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="help-modal" onClick={(e) => e.stopPropagation()}>
        <div className="help-header">
          <h2>Help & Information</h2>
          <button className="help-close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="help-content">
         
          <section>
                <h3>📅 My Day - Calendar & Task Management <span className="app-version">Version {appVersion}</span></h3>
                <p>This is a full-stack calendar application that allows users to manage tasks and to-do items with multiple calendar views and voice input capabilities.
                   It is essentially a <strong>personal productivity app</strong> combining a full-featured calendar with daily task scheduling and a quick reference to-do list, suitable for planning and organizing a single person's day-to-day activities.
                   It is built with React (frontend) and Express.js (backend)
                    </p>  
          </section>

          <section>
            <h4>Calendar Views</h4>
            <ul>
              <li><strong>Week View:</strong> Traditional 7-day week layout with hourly time slots</li>
              <li><strong>Day View:</strong> Detailed single-day schedule</li>
              <li><strong>Month View:</strong> Monthly calendar grid</li>
              <li><strong>Year View:</strong> 12-month overview</li>
              <li><strong>Current View:</strong> A special 7-day range centered around today</li>
            </ul>
          </section>
          
          <section>
            <h4>Task Management</h4>
            <ul>
              <li>Click on any time slot to create a new task</li>
              <li>Click on existing tasks to edit them</li>
              <li>Each task includes date, start time, and end time</li>
              <li>Support for recurring tasks with flexible deletion modes</li>
              <li>Tasks are saved to the database automatically</li>
            </ul>
          </section>
          
          <section>
            <h4>To-Do List</h4>
            <ul>
              <li>Add quick to-do items in the sidebar</li>
              <li>Check off items to mark them as complete</li>
              <li>Click on items to edit them (cannot edit completed items)</li>
              <li>Delete items you no longer need</li>
              <li>Use Enter to save, Escape to cancel when editing</li>
            </ul>
          </section>
          
          <section>
            <h4>Features & Controls</h4>
            <ul>
              <li><strong>Today Button:</strong> Jump back to today's date</li>
              <li><strong>Navigation Arrows:</strong> Move between dates, weeks, months, or years</li>
              <li><strong>View Density:</strong> Switch between Normal, Minimal, or Ultra-Minimal UI density</li>
              <li><strong>Voice Input (🎤):</strong> Create tasks using voice commands (in future updates). Currently text based.</li>
              <li><strong>Report:</strong> View analytics and insights about your tasks</li>
            </ul>
          </section>
          
          <section>
                <h4>Main Workflows</h4>
                <ul>
                    <li>Create Task: Click on a time slot → Modal opens → Fill task details → Save to database</li>
                    <li>View Tasks: Switch between different calendar views → Tasks appear in relevant time slots</li>
                    <li>Manage To-Dos: Add items to side panel → Toggle completion → Edit or delete as needed</li>
                    <li>Generate Reports: Click Report button → View analytics dashboard</li>
                    <li>Voice Input: Click microphone → Speak task details → System converts to task</li>
                </ul>
          </section>

          <section>
            <h4>Tips</h4>
            <ul>
              <li>Use the Current view to see a 7-day range centered on today</li>
              <li>Adjust view density to focus more on content or reduce clutter</li>
              <li>The current time is displayed in real-time in calendar views</li>
              <li>Your tasks are synchronized with the database</li>
              <li>Use the Report view to track your productivity</li>
            </ul>
          </section>

        </div>
      </div>
    </div>
  )
}

export default HelpModal
