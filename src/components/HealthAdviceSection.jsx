import { useState, useEffect } from 'react'

const HealthAdviceSection = ({ healthHistory = [] }) => {
  const [healthAdvice, setHealthAdvice] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [healthStats, setHealthStats] = useState(null)

  useEffect(() => {
    if (healthHistory && healthHistory.length > 0) {
      calculateStats()
      generateHealthAdvice()
    }
  }, [healthHistory])

  const calculateStats = () => {
    if (healthHistory.length === 0) return

    const stats = {
      totalDays: healthHistory.length,
      avgSleep: 0,
      avgWorkout: 0,
      workoutDays: 0,
      avgMealsPerDay: 0,
      dates: [],
      sleepPattern: [],
      workoutPattern: [],
      mealPattern: []
    }

    let totalSleep = 0
    let totalWorkout = 0
    let totalMeals = 0

    healthHistory.forEach(day => {
      stats.dates.push(new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
      stats.sleepPattern.push(day.sleepDuration)
      totalSleep += day.sleepDuration

      if (day.workoutDuration > 0) {
        stats.workoutDays++
        totalWorkout += day.workoutDuration
      }
      stats.workoutPattern.push(day.workoutDuration)

      // Handle both old format (array of strings) and new format (array of objects)
      const meals = day.meals ? day.meals.length : (day.mealTimes ? day.mealTimes.length : 0)
      totalMeals += meals
      stats.mealPattern.push(meals)
    })

    stats.avgSleep = (totalSleep / stats.totalDays).toFixed(1)
    stats.avgWorkout = stats.workoutDays > 0 ? (totalWorkout / stats.workoutDays).toFixed(1) : 0
    stats.avgMealsPerDay = (totalMeals / stats.totalDays).toFixed(1)
    stats.workoutFrequency = ((stats.workoutDays / stats.totalDays) * 100).toFixed(0)

    setHealthStats(stats)
  }

  const generateHealthAdvice = async () => {
    try {
      setLoading(true)
      setError(null)

      const apiKey = import.meta.env.VITE_OPENAI_API_KEY
      if (!apiKey) {
        setError('OpenAI API key not configured')
        return
      }

      // Format health history for AI analysis
      const historyText = healthHistory.map(day => {
        const date = new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
        
        // Format meals - handle both old format (array of times) and new format (array of objects)
        let mealsText = ''
        if (day.meals && day.meals.length > 0) {
          mealsText = day.meals.map(meal => `${meal.time} (${meal.detail})`).join(', ')
        } else if (day.mealTimes) {
          mealsText = day.mealTimes.join(', ')
        }
        
        return `${date}: Sleep ${day.sleepDuration}h at ${day.sleepTime}, Workout ${day.workoutDuration || 0}h${day.workoutTime ? ' at ' + day.workoutTime : ''}, Meals: ${mealsText}`
      }).join('\n')

      const prompt = `You are a health and wellness advisor analyzing daily health tracking data. Based on the following ${healthHistory.length}-day health history, provide a comprehensive assessment and recommendations for improving lifestyle habits.

Health Tracking History:
${historyText}

Please provide:
1. Sleep Quality Assessment (pattern, consistency, sufficiency)
2. Exercise Assessment (frequency, consistency, recommendations)
3. Nutrition Assessment (meal timing, meal frequency, spacing)
4. Overall Health Score (1-10 based on patterns)
5. Positive Patterns to Maintain
6. Areas Needing Improvement (specific and actionable)
7. Top 3 Lifestyle Recommendations (realistic and specific)

Focus on observable patterns in the historical data rather than general advice.`

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a professional health and wellness advisor. Analyze daily health data and provide evidence-based, practical, and encouraging health advice based on observed patterns.'
            },
            { role: 'user', content: prompt }
          ],
          max_tokens: 1200,
          temperature: 0.7
        })
      })

      const data = await response.json()
      if (data.error) {
        setError(`OpenAI Error: ${data.error.message}`)
      } else {
        const content = data.choices[0].message.content
        setHealthAdvice(content)
      }
    } catch (err) {
      setError(`Failed to generate health advice: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  if (!healthHistory || healthHistory.length === 0) {
    return (
      <div className="health-advice-section">
        <h2>🏥 Health & Wellness Assessment</h2>
        <p className="health-no-data">No health data logged yet. Start tracking daily activities to build your health report.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="health-advice-section">
        <h2>🏥 Health & Wellness Assessment</h2>
        <div className="loading-message">
          <p>Analyzing {healthHistory.length} days of health data...</p>
          <div className="loading-spinner"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="health-advice-section">
        <h2>🏥 Health & Wellness Assessment</h2>
        <div className="error-box">
          <p className="error-message">{error}</p>
          <p className="error-hint">Make sure VITE_OPENAI_API_KEY is set in your .env file</p>
        </div>
      </div>
    )
  }

  return (
    <div className="health-advice-section">
      <h2>🏥 Health & Wellness Assessment</h2>
      
      {healthStats && (
        <div className="health-stats-cards">
          <div className="health-stat-card">
            <h5>Days Tracked</h5>
            <p className="stat-value">{healthStats.totalDays}</p>
          </div>
          <div className="health-stat-card">
            <h5>Avg Sleep</h5>
            <p className="stat-value">{healthStats.avgSleep}h</p>
          </div>
          <div className="health-stat-card">
            <h5>Workout Frequency</h5>
            <p className="stat-value">{healthStats.workoutFrequency}%</p>
          </div>
          <div className="health-stat-card">
            <h5>Avg Meals/Day</h5>
            <p className="stat-value">{healthStats.avgMealsPerDay}</p>
          </div>
        </div>
      )}

      {healthAdvice && (
        <div className="health-advice-content">
          {healthAdvice.split('\n').map((line, index) => {
            if (line.trim() === '') return <br key={index} />
            if (line.match(/^\d+\./)) {
              return (
                <div key={index} className="advice-item">
                  {line}
                </div>
              )
            }
            if (line.match(/^-/)) {
              return (
                <div key={index} className="advice-bullet">
                  {line}
                </div>
              )
            }
            return (
              <p key={index} className="advice-paragraph">
                {line}
              </p>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default HealthAdviceSection
