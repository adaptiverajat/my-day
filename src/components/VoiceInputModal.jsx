import { useState } from 'react'

const VoiceInputModal = ({ show, onClose, currentDate, onTasksCreated }) => {
  const [input, setInput] = useState('')
  const [parsedTasks, setParsedTasks] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [icsFile, setIcsFile] = useState(null)

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
      setIcsFile(null)
    } catch (err) {
      setError('Failed to create tasks: ' + err.message)
    }
  }

  const handleCancel = () => {
    setInput('')
    setParsedTasks(null)
    setError(null)
    setIcsFile(null)
    onClose()
  }

  const handleFileSelect = (event) => {
    const file = event.target.files[0]
    if (file && file.name.endsWith('.ics')) {
      setIcsFile(file)
      setError(null)
    } else {
      setError('Please select a valid .ics file')
    }
  }

  const parseICSFile = (icsContent) => {
    const events = []
    const lines = icsContent.split('\n')
    let currentEvent = null
    let inEvent = false

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      if (line === 'BEGIN:VEVENT') {
        inEvent = true
        currentEvent = {}
      } else if (line === 'END:VEVENT') {
        if (currentEvent && currentEvent.summary && currentEvent.dtstart) {
          events.push(currentEvent)
        }
        inEvent = false
        currentEvent = null
      } else if (inEvent && currentEvent) {
        if (line.startsWith('SUMMARY:')) {
          currentEvent.summary = line.substring(8)
        } else if (line.startsWith('DESCRIPTION:')) {
          currentEvent.description = line.substring(12)
        } else if (line.startsWith('DTSTART:')) {
          currentEvent.dtstart = line.substring(8)
        } else if (line.startsWith('DTEND:')) {
          currentEvent.dtend = line.substring(6)
        } else if (line.startsWith('DTSTART;')) {
          // Handle DTSTART with parameters (like TZID)
          const parts = line.split(':')
          if (parts.length > 1) {
            currentEvent.dtstart = parts[1]
          }
        } else if (line.startsWith('DTEND;')) {
          // Handle DTEND with parameters (like TZID)
          const parts = line.split(':')
          if (parts.length > 1) {
            currentEvent.dtend = parts[1]
          }
        }
      }
    }

    return events
  }

  const formatICSDate = (icsDate) => {
    // ICS format: YYYYMMDDTHHMMSS or YYYYMMDD
    if (icsDate.includes('T')) {
      // Format with time: YYYYMMDDTHHMMSS
      const datePart = icsDate.substring(0, 8)
      const timePart = icsDate.substring(9, 15)
      
      const year = datePart.substring(0, 4)
      const month = datePart.substring(4, 6)
      const day = datePart.substring(6, 8)
      const hour = timePart.substring(0, 2)
      const minute = timePart.substring(2, 4)
      
      return {
        date: `${year}-${month}-${day}`,
        time: `${hour}:${minute}`
      }
    } else {
      // Format without time: YYYYMMDD
      const year = icsDate.substring(0, 4)
      const month = icsDate.substring(4, 6)
      const day = icsDate.substring(6, 8)
      
      return {
        date: `${year}-${month}-${day}`,
        time: '09:00' // Default time
      }
    }
  }

  const handleICSImport = async () => {
    if (!icsFile) {
      setError('Please select an .ics file first')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const icsContent = e.target.result
          const events = parseICSFile(icsContent)
          
          if (events.length === 0) {
            setError('No events found in the ICS file')
            setLoading(false)
            return
          }

          const tasks = events.map(event => {
            const startData = formatICSDate(event.dtstart)
            const endData = event.dtend ? formatICSDate(event.dtend) : null
            
            // Calculate end time (default to 1 hour if not specified)
            let endTime = '10:00'
            if (endData && endData.time) {
              endTime = endData.time
            } else {
              // Parse start time and add 1 hour
              const [startHour, startMin] = startData.time.split(':')
              const endHour = (parseInt(startHour) + 1).toString().padStart(2, '0')
              endTime = `${endHour}:${startMin}`
            }

            return {
              title: event.summary || 'Meeting',
              description: event.description || '',
              date: startData.date,
              from_time: startData.time,
              to_time: endTime,
              color: '#e3f2fd'
            }
          })

          setParsedTasks(tasks)
          setLoading(false)
        } catch (parseError) {
          setError('Failed to parse ICS file: ' + parseError.message)
          setLoading(false)
        }
      }
      
      reader.onerror = () => {
        setError('Failed to read file')
        setLoading(false)
      }
      
      reader.readAsText(icsFile)
    } catch (err) {
      setError('Failed to import ICS file: ' + err.message)
      setLoading(false)
    }
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

        <div className="ics-import-section">
          <div className="form-group">
            <label>Or import meetings from .ICS file:</label>
            <input
              type="file"
              accept=".ics"
              onChange={handleFileSelect}
              className="ics-file-input"
            />
          </div>
          {icsFile && (
            <button 
              className="btn-import-ics" 
              onClick={handleICSImport}
              disabled={loading}
            >
              {loading ? 'Importing...' : 'Import ICS File'}
            </button>
          )}
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