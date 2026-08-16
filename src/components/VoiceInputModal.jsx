import { useState } from 'react'

const VoiceInputModal = ({ show, onClose, currentDate, onTasksCreated }) => {
  const [input, setInput] = useState('')
  const [parsedTasks, setParsedTasks] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleParse = async () => {
    if (!input.trim()) {
      setError('Please enter task descriptions')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY
      if (!apiKey) {
        setError('OpenAI API key not found in .env file')
        setLoading(false)
        return
      }

      const prompt = `Parse these task descriptions into structured calendar tasks. Current date: ${currentDate.toISOString().split('T')[0]}

      Format minutes to closest solid hours or half-hours only. Floor Start times and Ceil End times. Only 00 or 30 minutes allowed. If no specific time is mentioned, use reasonable defaults (e.g., 9:00-10:00). Use the default color #e3f2fd unless specified otherwise.

Return ONLY a JSON array with this structure:
[
  {
    "title": "Task title",
    "description": "Task description",
    "date": "YYYY-MM-DD",
    "from_time": "HH:mm",
    "to_time": "HH:mm",
    "color": "#e3f2fd"
  }
]

Task descriptions:
${input}

Guidelines:
- Extract task titles, descriptions, dates, and times from the descriptions
- Use 24-hour time format (HH:mm)
- If no specific date is mentioned, use the current date or reasonable defaults
- If no specific time is mentioned, use reasonable defaults (e.g., 9:00-10:00)
- Use the default color #e3f2fd unless specified otherwise`

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You are a helpful calendar assistant. Always return valid JSON arrays.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 1000,
          temperature: 0.3
        })
      })

      const data = await response.json()
      if (data.error) {
        setError(data.error.message)
      } else {
        try {
          const content = data.choices[0].message.content
          const jsonMatch = content.match(/\[[\s\S]*\]/)
          if (jsonMatch) {
            const tasks = JSON.parse(jsonMatch[0])
            setParsedTasks(tasks)
          } else {
            setError('Could not parse AI response')
          }
        } catch (parseError) {
          setError('Failed to parse AI response')
        }
      }
    } catch (err) {
      setError('Failed to parse tasks: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async () => {
    if (!parsedTasks || parsedTasks.length === 0) {
      setError('No tasks to create')
      return
    }

    try {
      for (const task of parsedTasks) {
        const response = await fetch('http://localhost:3001/api/calendar-tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: task.title,
            description: task.description || '',
            task_date: task.date,
            from_time: task.from_time,
            to_time: task.to_time,
            color: task.color || '#e3f2fd'
          })
        })

        if (!response.ok) {
          throw new Error(`Failed to create task: ${task.title}`)
        }
      }

      onTasksCreated()
      onClose()
      setInput('')
      setParsedTasks(null)
    } catch (err) {
      setError('Failed to create tasks: ' + err.message)
    }
  }

  const handleCancel = () => {
    setInput('')
    setParsedTasks(null)
    setError(null)
    onClose()
  }

  if (!show) return null

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

        {!parsedTasks && (
          <button 
            className="btn-parse" 
            onClick={handleParse}
            disabled={loading}
          >
            {loading ? 'Parsing...' : 'Parse Tasks'}
          </button>
        )}

        {error && (
          <p className="error-message">{error}</p>
        )}

        {parsedTasks && (
          <div className="parsed-tasks-section">
            <h3>Confirm Tasks:</h3>
            <table className="parsed-tasks-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {parsedTasks.map((task, index) => (
                  <tr key={index}>
                    <td>{task.title}</td>
                    <td>{task.date}</td>
                    <td>{task.from_time} - {task.to_time}</td>
                    <td>{task.description || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="modal-buttons">
              <button className="btn-cancel" onClick={handleCancel}>
                Cancel
              </button>
              <button className="btn-save" onClick={handleConfirm}>
                Confirm & Create Tasks
              </button>
            </div>
          </div>
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
  )
}

export default VoiceInputModal