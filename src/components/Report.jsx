import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { getWeekDays, getMonthDays, getYearMonths, getTasksForDate, getTasksForMonth } from '../utils/dateUtils'
import HealthAssessmentModal from './HealthAssessmentModal'
import HealthAdviceSection from './HealthAdviceSection'

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="custom-tooltip">
        <p className="tooltip-title">{data.name}</p>
        <p className="tooltip-value">{data.value} hours</p>
        {data.tasks && data.tasks.length > 0 && (
          <div className="tooltip-tasks">
            <p className="tooltip-tasks-title">Tasks:</p>
            <ul className="tooltip-tasks-list">
              {data.tasks.map((task, index) => (
                <li key={index}>{task}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }
  return null
}

const Report = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [reportData, setReportData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [aiCategories, setAiCategories] = useState(null)
  const [dailyStats, setDailyStats] = useState([])
  const [showHealthModal, setShowHealthModal] = useState(false)
  const [healthHistory, setHealthHistory] = useState(() => {
    // Try to load health history from localStorage
    const saved = localStorage.getItem('healthHistory')
    return saved ? JSON.parse(saved) : []
  })

  // Get data from navigation state or use defaults
  const currentDate = location.state?.currentDate || new Date()
  const currentView = location.state?.currentView || 'week'
  
  // We need to fetch tasks for the report
  const [tasks, setTasks] = useState([])

  useEffect(() => {
    fetchTasksForReport()
  }, [currentDate, currentView])

  // Check if health data is available when component mounts
  useEffect(() => {
    if (reportData) {
      // Show health modal on first load to encourage logging
      if (healthHistory.length === 0 || !hasLoggedToday()) {
        setShowHealthModal(true)
      }
    }
  }, [reportData])

  const fetchTasksForReport = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:3001/api/tasks')
      const data = await response.json()
      
      if (data.success) {
        setTasks(data.tasks)
        generateReport(data.tasks)
      } else {
        setError(data.message || 'Failed to fetch tasks')
        setLoading(false)
      }
    } catch (err) {
      setError('Failed to fetch tasks: ' + err.message)
      setLoading(false)
    }
  }

  const generateReport = (taskData) => {
    setLoading(true)
    setError(null)

    try {
      let reportTasks = []
      let dateRange = []

      switch (currentView) {
        case 'week':
          dateRange = getWeekDays(currentDate)
          reportTasks = dateRange.flatMap(date => getTasksForDate(taskData, date))
          break
        case 'day':
          dateRange = [currentDate]
          reportTasks = getTasksForDate(taskData, currentDate)
          break
        case 'month':
          dateRange = getMonthDays(currentDate).filter(d => d)
          reportTasks = dateRange.flatMap(date => getTasksForDate(taskData, date))
          break
        case 'year':
          dateRange = getYearMonths(currentDate)
          reportTasks = dateRange.flatMap(month => getTasksForMonth(taskData, month))
          break
        default:
          dateRange = getWeekDays(currentDate)
          reportTasks = dateRange.flatMap(date => getTasksForDate(taskData, date))
      }

      // Calculate time statistics
      const timeStats = calculateTimeStats(reportTasks, currentView)
      const dailyStatistics = calculateDailyStats(reportTasks, dateRange)
      
      setReportData({
        view: currentView,
        dateRange,
        tasks: reportTasks,
        stats: timeStats
      })
      
      setDailyStats(dailyStatistics)

      // Generate AI categorization
      generateAICategorization(reportTasks)
    } catch (err) {
      setError('Failed to generate report: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const hasLoggedToday = () => {
    if (healthHistory.length === 0) return false
    const today = new Date().toDateString()
    return healthHistory.some(log => new Date(log.date).toDateString() === today)
  }

  const handleHealthLogSubmit = (logData) => {
    // Check if there's already a log for this date and update it
    const dateString = new Date(logData.date).toDateString()
    const existingIndex = healthHistory.findIndex(
      log => new Date(log.date).toDateString() === dateString
    )

    let updatedHistory
    if (existingIndex >= 0) {
      updatedHistory = [...healthHistory]
      updatedHistory[existingIndex] = logData
    } else {
      updatedHistory = [...healthHistory, logData]
    }

    // Keep only last 60 days of history
    if (updatedHistory.length > 60) {
      updatedHistory = updatedHistory.slice(-60)
    }

    setHealthHistory(updatedHistory)
    localStorage.setItem('healthHistory', JSON.stringify(updatedHistory))
    setShowHealthModal(false)
  }

  const calculateTimeStats = (tasks, view) => {
    let totalMinutes = 0
    const categoryBreakdown = {}

    tasks.forEach(task => {
      const [fromHours, fromMinutes] = task.from_time.split(':').map(Number)
      const [toHours, toMinutes] = task.to_time.split(':').map(Number)
      const duration = (toHours * 60 + toMinutes) - (fromHours * 60 + fromMinutes)
      totalMinutes += duration

      // Simple categorization for backup
      const category = task.title.split(' ')[0]
      categoryBreakdown[category] = (categoryBreakdown[category] || 0) + duration
    })

    // Calculate available time based on view
    let availableMinutes = 0
    const workingHoursPerDay = 9 * 60 // 9 hours in minutes

    switch (view) {
      case 'day':
        availableMinutes = workingHoursPerDay
        break
      case 'week':
        availableMinutes = workingHoursPerDay * 5 // 5 working days
        break
      case 'month':
        availableMinutes = workingHoursPerDay * 22 // ~22 working days
        break
      case 'year':
        availableMinutes = workingHoursPerDay * 260 // ~260 working days
        break
      default:
        availableMinutes = workingHoursPerDay * 5
    }

    const freeMinutes = availableMinutes - totalMinutes
    const utilizationRate = (totalMinutes / availableMinutes) * 100

    return {
      totalMinutes,
      totalHours: (totalMinutes / 60).toFixed(1),
      availableMinutes,
      availableHours: (availableMinutes / 60).toFixed(1),
      freeMinutes,
      freeHours: (freeMinutes / 60).toFixed(1),
      utilizationRate: utilizationRate.toFixed(1),
      categoryBreakdown,
      taskCount: tasks.length
    }
  }

  const calculateDailyStats = (tasks, dateRange) => {
    const MORNING_START = 6.5 * 60 // 6:30 AM in minutes = 390
    const MORNING_END = 11.5 * 60 // 11:30 AM in minutes = 690
    const WINDOW_DURATION = MORNING_END - MORNING_START // 300 minutes = 5 hours
    
    const stats = []
    
    dateRange.forEach(date => {
      if (!date) return
      
      const dayTasks = getTasksForDate(tasks, date)
      let busyMinutes = 0
      
      dayTasks.forEach(task => {
        const [fromHours, fromMinutes] = task.from_time.split(':').map(Number)
        const [toHours, toMinutes] = task.to_time.split(':').map(Number)
        const taskStart = fromHours * 60 + fromMinutes
        const taskEnd = toHours * 60 + toMinutes
        
        // Check if task overlaps with 6:30am to 11:30am window
        if (taskEnd > MORNING_START && taskStart < MORNING_END) {
          // Calculate overlap
          const overlapStart = Math.max(taskStart, MORNING_START)
          const overlapEnd = Math.min(taskEnd, MORNING_END)
          busyMinutes += (overlapEnd - overlapStart)
        }
      })
      
      const freeMinutes = Math.max(0, WINDOW_DURATION - busyMinutes)
      
      stats.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        busyHours: (busyMinutes / 60).toFixed(1),
        freeHours: (freeMinutes / 60).toFixed(1)
      })
    })
    
    return stats
  }

  const generateAICategorization = async (tasks) => {
    try {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY
      if (!apiKey) {
        setAiCategories({ error: 'OpenAI API key not found in .env file' })
        return
      }

      const taskList = tasks.map(t => `${t.title} (${t.from_time}-${t.to_time})`).join('\n')
      
      const prompt = `Categorize these tasks into 3 levels of detail for time management analysis. Return ONLY a JSON object with this structure:
{
  "broadCategories": {
    "Work": { hours: 10, tasks: ["Task 1", "Task 2"] },
    "Personal": { hours: 5, tasks: ["Task 3"] }
  },
  "detailedCategories": {
    "Coding": { hours: 6, tasks: ["Task 1"] },
    "Meetings": { hours: 4, tasks: ["Task 2"] },
    "Exercise": { hours: 2, tasks: ["Task 3"] }
  },
  "individualTasks": {
    "Task 1": 3,
    "Task 2": 4,
    "Task 3": 1
  }
}

Tasks:
${taskList}

Use broad categories like: Work, Personal, Health, Learning, Entertainment, etc.
Use detailed categories that are more specific within each broad category.
Individual tasks should show each task's hours.`

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You are a helpful time management assistant. Always return valid JSON with the exact structure specified.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 800,
          temperature: 0.3
        })
      })

      const data = await response.json()
      if (data.error) {
        setAiCategories({ error: data.error.message })
      } else {
        try {
          const content = data.choices[0].message.content
          const jsonMatch = content.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            const categories = JSON.parse(jsonMatch[0])
            setAiCategories(categories)
          } else {
            setAiCategories({ error: 'Could not parse AI response' })
          }
        } catch (parseError) {
          setAiCategories({ error: 'Failed to parse AI response' })
        }
      }
    } catch (err) {
      setAiCategories({ error: 'Failed to generate AI categorization: ' + err.message })
    }
  }

  const getCategoryData = () => {
    if (aiCategories && !aiCategories.error) {
      // Handle new 3-level structure
      if (aiCategories.broadCategories) {
        return Object.entries(aiCategories.broadCategories).map(([name, data]) => ({
          name,
          value: parseFloat(data.hours),
          tasks: data.tasks || []
        }))
      }
      
      // Fallback to old structure
      return Object.entries(aiCategories).map(([name, value]) => ({
        name,
        value: parseFloat(value),
        tasks: []
      }))
    }
    
    // Fallback to simple categorization
    if (reportData?.stats.categoryBreakdown) {
      return Object.entries(reportData.stats.categoryBreakdown)
        .map(([name, minutes]) => ({
          name,
          value: parseFloat((minutes / 60).toFixed(1)),
          tasks: []
        }))
        .sort((a, b) => b.value - a.value)
    }
    
    return []
  }

  const getDetailedCategoryData = () => {
    if (aiCategories && !aiCategories.error && aiCategories.detailedCategories) {
      return Object.entries(aiCategories.detailedCategories).map(([name, data]) => ({
        name,
        value: parseFloat(data.hours),
        tasks: data.tasks || []
      }))
    }
    
    // Fallback to simple categorization
    if (reportData?.stats.categoryBreakdown) {
      return Object.entries(reportData.stats.categoryBreakdown)
        .map(([name, minutes]) => ({
          name,
          value: parseFloat((minutes / 60).toFixed(1)),
          tasks: []
        }))
        .sort((a, b) => b.value - a.value)
    }
    
    return []
  }

  const getIndividualTaskData = () => {
    if (aiCategories && !aiCategories.error && aiCategories.individualTasks) {
      return Object.entries(aiCategories.individualTasks).map(([name, hours]) => ({
        name,
        value: parseFloat(hours)
      }))
    }
    
    // Fallback to individual tasks
    if (reportData?.tasks) {
      return reportData.tasks.map(task => {
        const [fromHours, fromMinutes] = task.from_time.split(':').map(Number)
        const [toHours, toMinutes] = task.to_time.split(':').map(Number)
        const duration = (toHours * 60 + toMinutes) - (fromHours * 60 + fromMinutes)
        return {
          name: task.title,
          value: parseFloat((duration / 60).toFixed(1))
        }
      }).sort((a, b) => b.value - a.value)
    }
    
    return []
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B6B']

  if (loading) {
    return (
      <div className="report-page">
        <div className="report-container">
          <button className="back-button" onClick={() => navigate('/')}>← Back to Calendar</button>
          <h2>Generating Report...</h2>
          <div className="loading-spinner"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="report-page">
        <div className="report-container">
          <button className="back-button" onClick={() => navigate('/')}>← Back to Calendar</button>
          <h2>Error</h2>
          <p className="error-message">{error}</p>
        </div>
      </div>
    )
  }

  const categoryData = getCategoryData()
  const detailedCategoryData = getDetailedCategoryData()
  const individualTaskData = getIndividualTaskData()

  return (
    <div className="report-page">
      <div className="report-container">
        <button className="back-button" onClick={() => navigate('/')}>← Back to Calendar</button>
        
        <h1>Time Management Report</h1>
        <p className="report-subtitle">
          {currentView.charAt(0).toUpperCase() + currentView.slice(1)} View - {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>

        <div className="charts-container">
          <div className="chart-section">
            <h2>Broad Categories</h2>
            {aiCategories?.error ? (
              <p className="error-message">{aiCategories.error}</p>
            ) : categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p>No task data available</p>
            )}
          </div>

          <div className="chart-section">
            <h2>Detailed Categories</h2>
            {aiCategories?.error ? (
              <p className="error-message">{aiCategories.error}</p>
            ) : detailedCategoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={detailedCategoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {detailedCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p>No task data available</p>
            )}
          </div>

          <div className="chart-section">
            <h2>Individual Tasks</h2>
            {aiCategories?.error ? (
              <p className="error-message">{aiCategories.error}</p>
            ) : individualTaskData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={individualTaskData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => percent > 5 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {individualTaskData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value} hours`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p>No task data available</p>
            )}
          </div>
        </div>

        <div className="stats-section">
          <h2>Daily Statistics (6:30 AM - 11:30 AM)</h2>
          <table className="stats-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Busy Hours</th>
                <th>Free Hours</th>
              </tr>
            </thead>
            <tbody>
              {dailyStats.map((stat, index) => (
                <tr key={index}>
                  <td>{stat.date}</td>
                  <td>{stat.busyHours}h</td>
                  <td>{stat.freeHours}h</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="summary-section">
          <h2>Summary</h2>
          <div className="summary-cards">
            <div className="summary-card">
              <h3>Total Work Time</h3>
              <p className="summary-value">{reportData?.stats.totalHours}h</p>
            </div>
            <div className="summary-card">
              <h3>Total Free Time</h3>
              <p className="summary-value">{reportData?.stats.freeHours}h</p>
            </div>
            <div className="summary-card">
              <h3>Utilization Rate</h3>
              <p className="summary-value">{reportData?.stats.utilizationRate}%</p>
            </div>
            <div className="summary-card">
              <h3>Total Tasks</h3>
              <p className="summary-value">{reportData?.stats.taskCount}</p>
            </div>
          </div>
        </div>

        <HealthAdviceSection healthHistory={healthHistory} />

        <div className="report-actions">
          <button className="refresh-button" onClick={() => fetchTasksForReport()}>Refresh Report</button>
          <button className="health-button" onClick={() => setShowHealthModal(true)}>
            📋 Log Today's Health
          </button>
        </div>

        {showHealthModal && (
          <HealthAssessmentModal 
            date={currentDate}
            onClose={() => setShowHealthModal(false)}
            onSubmit={handleHealthLogSubmit}
          />
        )}
      </div>
    </div>
  )
}

export default Report