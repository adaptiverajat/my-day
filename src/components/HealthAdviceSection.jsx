import { useState, useEffect } from 'react'

const HealthAdviceSection = ({ healthHistory = [] }) => {
  const [healthAdvice, setHealthAdvice] = useState(null)
  const [healthStats, setHealthStats] = useState(null)

  useEffect(() => {
    if (healthHistory && healthHistory.length > 0) {
      calculateStatsAndAdvice()
    } else {
      setHealthStats(null)
      setHealthAdvice(null)
    }
  }, [healthHistory])

  const calculateStatsAndAdvice = () => {
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
      const sleepDur = parseFloat(day.sleepDuration) || 0
      stats.sleepPattern.push(sleepDur)
      totalSleep += sleepDur

      const workoutDur = parseFloat(day.workoutDuration) || 0
      if (workoutDur > 0) {
        stats.workoutDays++
        totalWorkout += workoutDur
      }
      stats.workoutPattern.push(workoutDur)

      const meals = day.meals ? day.meals.length : (day.mealTimes ? day.mealTimes.length : 0)
      totalMeals += meals
      stats.mealPattern.push(meals)
    })

    stats.avgSleep = (totalSleep / stats.totalDays).toFixed(1)
    stats.avgWorkout = stats.workoutDays > 0 ? (totalWorkout / stats.workoutDays).toFixed(1) : 0
    stats.avgMealsPerDay = (totalMeals / stats.totalDays).toFixed(1)
    stats.workoutFrequency = ((stats.workoutDays / stats.totalDays) * 100).toFixed(0)

    setHealthStats(stats)

    // Generate local, rule-based evidence-backed health advice
    const avgSleepNum = parseFloat(stats.avgSleep) || 0
    const workoutFreqNum = parseInt(stats.workoutFrequency, 10) || 0
    const avgMealsNum = parseFloat(stats.avgMealsPerDay) || 0

    // 1. Sleep Quality Assessment
    let sleepAssessment = ''
    if (avgSleepNum >= 7 && avgSleepNum <= 8.5) {
      sleepAssessment = `Optimal sleep duration (${avgSleepNum}h average). Your rest duration aligns with recommended adult targets (7-9 hours), fostering physical restoration and mental acuity.`
    } else if (avgSleepNum > 8.5) {
      sleepAssessment = `Longer sleep duration (${avgSleepNum}h average). Ensure consistent bedtime and wake times to maintain an optimal circadian rhythm.`
    } else if (avgSleepNum > 0 && avgSleepNum < 7) {
      sleepAssessment = `Below recommended sleep duration (${avgSleepNum}h average). Target 7-8 hours per night to prevent cumulative sleep debt and improve daytime energy levels.`
    } else {
      sleepAssessment = 'Sleep logs not recorded consistently. Track sleep to monitor recovery.'
    }

    // 2. Exercise Assessment
    let exerciseAssessment = ''
    if (workoutFreqNum >= 60) {
      exerciseAssessment = `Excellent exercise consistency (${stats.workoutDays} of ${stats.totalDays} days, ${workoutFreqNum}%). Regular physical activity supports cardiovascular resilience and metabolic health.`
    } else if (workoutFreqNum >= 35) {
      exerciseAssessment = `Moderate physical activity (${workoutFreqNum}% of days, avg ${stats.avgWorkout}h/session). Consider adding 1-2 active sessions per week to reach 4-5 active days.`
    } else if (workoutFreqNum > 0) {
      exerciseAssessment = `Light physical activity (${workoutFreqNum}% of days). Aiming for at least 30 minutes of moderate activity on 3-4 days per week will significantly boost vitality.`
    } else {
      exerciseAssessment = 'No exercise logged in this period. Incorporating short daily walks or mobility exercises is recommended.'
    }

    // 3. Nutrition Assessment
    let nutritionAssessment = ''
    if (avgMealsNum >= 2.5 && avgMealsNum <= 3.5) {
      nutritionAssessment = `Balanced meal frequency (${avgMealsNum} meals/day average). Consistent meal timing stabilizes blood sugar and energy throughout the day.`
    } else if (avgMealsNum > 3.5) {
      nutritionAssessment = `Frequent meals/snacks (${avgMealsNum} meals/day average). Ensure healthy nutrient density and balanced portions.`
    } else if (avgMealsNum > 0) {
      nutritionAssessment = `Lower meal frequency (${avgMealsNum} meals/day average). Ensure adequate protein and micronutrient intake across meals.`
    } else {
      nutritionAssessment = 'Nutrition not logged. Consider tracking meals to monitor dietary timing.'
    }

    // 4. Overall Health Score (1 to 10)
    let score = 5
    if (avgSleepNum >= 7 && avgSleepNum <= 9) score += 2
    else if (avgSleepNum >= 6) score += 1

    if (workoutFreqNum >= 60) score += 2
    else if (workoutFreqNum >= 30) score += 1

    if (avgMealsNum >= 2 && avgMealsNum <= 4) score += 1

    score = Math.min(10, Math.max(1, score))

    const adviceText = [
      `1. Sleep Quality Assessment: ${sleepAssessment}`,
      `2. Exercise & Activity: ${exerciseAssessment}`,
      `3. Nutrition & Meal Routine: ${nutritionAssessment}`,
      `4. Overall Lifestyle Score: ${score}/10 based on recorded sleep, activity, and nutrition habits.`,
      `5. Positive Patterns to Maintain: Keep up regular tracking and daily routine consistency across weekdays and weekends.`,
      `6. Key Recommendations:`,
      `- Maintain consistent sleep schedule by sleeping and waking within a 30-minute window daily.`,
      `- Aim for at least 150 minutes of moderate physical activity or 75 minutes of vigorous exercise weekly.`,
      `- Hydrate adequately and keep meal intervals evenly spaced throughout your active day.`
    ].join('\n')

    setHealthAdvice(adviceText)
  }

  if (!healthHistory || healthHistory.length === 0) {
    return (
      <div className="health-advice-section">
        <h2>🏥 Health & Wellness Assessment</h2>
        <p className="health-no-data">No health data logged yet. Start tracking daily activities to build your health report.</p>
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
