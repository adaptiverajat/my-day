import { useState } from 'react'

const HealthAssessmentModal = ({ onClose, onSubmit, date }) => {
  const [selectedDate, setSelectedDate] = useState(date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0])
  const [sleepTime, setSleepTime] = useState('')
  const [sleepDuration, setSleepDuration] = useState('')
  const [workoutTime, setWorkoutTime] = useState('')
  const [workoutDuration, setWorkoutDuration] = useState('')
  const [meals, setMeals] = useState([])
  const [currentMealTime, setCurrentMealTime] = useState('')
  const [currentMealDetail, setCurrentMealDetail] = useState('')
  const [errors, setErrors] = useState({})

  const getFormattedDate = (dateString) => {
    const d = new Date(dateString + 'T00:00:00')
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  const handleAddMeal = () => {
    if (!currentMealTime || !currentMealDetail) {
      setErrors(prev => ({ ...prev, mealInput: 'Please enter both time and meal detail' }))
      return
    }

    const newMeal = {
      time: currentMealTime,
      detail: currentMealDetail
    }

    setMeals([...meals, newMeal])
    setCurrentMealTime('')
    setCurrentMealDetail('')
    setErrors(prev => ({ ...prev, mealInput: '' }))
  }

  const handleRemoveMeal = (index) => {
    setMeals(meals.filter((_, i) => i !== index))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const newErrors = {}

    if (!sleepTime) {
      newErrors.sleepTime = 'Please enter sleep time'
    }
    if (!sleepDuration || parseFloat(sleepDuration) <= 0 || parseFloat(sleepDuration) > 24) {
      newErrors.sleepDuration = 'Please enter valid sleep duration hours (0-24)'
    }
    if (!workoutTime) {
      newErrors.workoutTime = 'Please enter workout time (or "none" if no workout)'
    }
    if (workoutTime && workoutTime.toLowerCase() !== 'none' && (!workoutDuration || parseFloat(workoutDuration) < 0 || parseFloat(workoutDuration) > 24)) {
      newErrors.workoutDuration = 'Please enter valid workout duration hours'
    }
    if (meals.length === 0) {
      newErrors.meals = 'Please add at least one meal'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    const logDate = new Date(selectedDate + 'T00:00:00')

    onSubmit({
      date: logDate,
      sleepTime,
      sleepDuration: parseFloat(sleepDuration),
      workoutTime: workoutTime.toLowerCase() === 'none' ? null : workoutTime,
      workoutDuration: workoutTime.toLowerCase() === 'none' ? 0 : parseFloat(workoutDuration || 0),
      meals: meals
    })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="health-modal" onClick={(e) => e.stopPropagation()}>
        <div className="health-modal-header">
          <h2>Daily Health Tracking</h2>
          <button className="help-close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="health-modal-content">
          <form onSubmit={handleSubmit}>
            <div className="form-section date-section">
              <h4>📅 Date</h4>
              <div className="form-group">
                <label htmlFor="logDate">Select Date to Log</label>
                <input
                  id="logDate"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
                <p className="date-display">Logging for: <strong>{getFormattedDate(selectedDate)}</strong></p>
              </div>
            </div>

            <div className="form-section">
              <h4>💤 Sleep</h4>
              <div className="form-group">
                <label htmlFor="sleepTime">Sleep Time</label>
                <input
                  id="sleepTime"
                  type="text"
                  value={sleepTime}
                  onChange={(e) => setSleepTime(e.target.value)}
                  placeholder="e.g., 11:00 PM"
                  className={errors.sleepTime ? 'input-error' : ''}
                />
                {errors.sleepTime && <span className="error-text">{errors.sleepTime}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="sleepDuration">Sleep Duration (hours)</label>
                <input
                  id="sleepDuration"
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  value={sleepDuration}
                  onChange={(e) => setSleepDuration(e.target.value)}
                  placeholder="e.g., 7.5"
                  className={errors.sleepDuration ? 'input-error' : ''}
                />
                {errors.sleepDuration && <span className="error-text">{errors.sleepDuration}</span>}
              </div>
            </div>

            <div className="form-section">
              <h4>🏋️ Workout</h4>
              <div className="form-group">
                <label htmlFor="workoutTime">Workout Time (or "none")</label>
                <input
                  id="workoutTime"
                  type="text"
                  value={workoutTime}
                  onChange={(e) => setWorkoutTime(e.target.value)}
                  placeholder="e.g., 6:00 AM or none"
                  className={errors.workoutTime ? 'input-error' : ''}
                />
                {errors.workoutTime && <span className="error-text">{errors.workoutTime}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="workoutDuration">Workout Duration (hours)</label>
                <input
                  id="workoutDuration"
                  type="number"
                  step="0.25"
                  min="0"
                  max="24"
                  value={workoutDuration}
                  onChange={(e) => setWorkoutDuration(e.target.value)}
                  placeholder="e.g., 1"
                  className={errors.workoutDuration ? 'input-error' : ''}
                  disabled={workoutTime.toLowerCase() === 'none'}
                />
                {errors.workoutDuration && <span className="error-text">{errors.workoutDuration}</span>}
              </div>
            </div>

            <div className="form-section">
              <h4>🍽️ Meals</h4>
              <div className="form-group">
                <label htmlFor="mealTime">Meal Time</label>
                <input
                  id="mealTime"
                  type="text"
                  value={currentMealTime}
                  onChange={(e) => setCurrentMealTime(e.target.value)}
                  placeholder="e.g., 8:00 AM"
                />
              </div>

              <div className="form-group">
                <label htmlFor="mealDetail">Meal Details</label>
                <input
                  id="mealDetail"
                  type="text"
                  value={currentMealDetail}
                  onChange={(e) => setCurrentMealDetail(e.target.value)}
                  placeholder="e.g., Oatmeal with berries"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddMeal()
                    }
                  }}
                />
              </div>

              <button type="button" className="btn-add-meal" onClick={handleAddMeal}>
                + Add Meal
              </button>

              {errors.mealInput && <span className="error-text">{errors.mealInput}</span>}

              {meals.length > 0 && (
                <div className="meals-list">
                  <h5>Added Meals:</h5>
                  <div className="meals-items">
                    {meals.map((meal, index) => (
                      <div key={index} className="meal-item">
                        <div className="meal-info">
                          <span className="meal-time">{meal.time}</span>
                          <span className="meal-detail">{meal.detail}</span>
                        </div>
                        <button 
                          type="button" 
                          className="meal-remove-btn"
                          onClick={() => handleRemoveMeal(index)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {errors.meals && <span className="error-text">{errors.meals}</span>}
            </div>

            <div className="modal-buttons">
              <button type="button" className="btn-cancel" onClick={onClose}>
                Skip
              </button>
              <button type="submit" className="btn-save">
                Save Daily Log
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default HealthAssessmentModal
