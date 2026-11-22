import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const Finances = () => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [userExists, setUserExists] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isPasswordRetrieval, setIsPasswordRetrieval] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [retrievedPassword, setRetrievedPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [passwordKeydownCount, setPasswordKeydownCount] = useState(0)

  // Finances state
  const [financeData, setFinanceData] = useState([])
  const [selectedMonth, setSelectedMonth] = useState(null)
  const [viewOffset, setViewOffset] = useState(0) // For navigating months (0 = current month first)
  const [showIncomeModal, setShowIncomeModal] = useState(false)
  const [showExpensesModal, setShowExpensesModal] = useState(false)
  const [showSavingsModal, setShowSavingsModal] = useState(false)
  const [showInvestedModal, setShowInvestedModal] = useState(false)
  const [showImportSection, setShowImportSection] = useState(false)
  const [showAssetsSection, setShowAssetsSection] = useState(false)
  const [assets, setAssets] = useState([])
  const [showAssetModal, setShowAssetModal] = useState(false)
  const [editingAssetId, setEditingAssetId] = useState(null)
  const [draggedAssetId, setDraggedAssetId] = useState(null)
  const [addingExcluded, setAddingExcluded] = useState(false)
  const [parsedData, setParsedData] = useState(null)
  const [isParsing, setIsParsing] = useState(false)

  useEffect(() => {
    checkUserExists()
  }, [])

  const checkUserExists = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('http://localhost:3001/api/user/check')
      const data = await response.json()
      
      if (data.success) {
        setUserExists(data.userExists)
        if (data.userExists) {
          setFormData(prev => ({ ...prev, email: data.email || '' }))
        }
      }
    } catch (error) {
      console.error('Error checking user:', error)
      setError('Failed to check user status')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSetup = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!formData.email || !formData.password) {
      setError('Email and password are required')
      return
    }

    try {
      const response = await fetch('http://localhost:3001/api/user/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('Account created successfully!')
        setTimeout(() => {
          setIsAuthenticated(true)
          setSuccess('')
          loadFinanceData()
          loadAssets()
        }, 1000)
      } else {
        setError(data.message || 'Failed to create account')
      }
    } catch (error) {
      console.error('Error creating user:', error)
      setError('Failed to create account')
    }
  }

  const handleLogin = async (e) => {
    if (e && e.preventDefault) e.preventDefault()
    setError('')
    setSuccess('')

    const email = formData.email.trim()
    const password = formData.password

    if (!email || !password) {
      setError('Email and password are required')
      return
    }

    try {
      const response = await fetch('http://localhost:3001/api/user/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password
        })
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('Login successful!')
        setFormData({ ...formData, password: '' })
        setPasswordKeydownCount(0)
        setTimeout(() => {
          setIsAuthenticated(true)
          setSuccess('')
          loadFinanceData()
          loadAssets()
        }, 500)
      } else {
        setError(data.message || 'Login failed')
        setFormData({ ...formData, password: '' })
        setPasswordKeydownCount(0)
      }
    } catch (error) {
      console.error('Error during login:', error)
      setError('Login failed')
    }
  }

  const handlePasswordRetrieval = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!formData.email) {
      setError('Email is required')
      return
    }

    try {
      const response = await fetch(`http://localhost:3001/api/user/password?email=${encodeURIComponent(formData.email)}`)
      const data = await response.json()

      if (data.success) {
        setRetrievedPassword(data.password)
        setSuccess('Password retrieved successfully')
      } else {
        setError(data.message || 'Failed to retrieve password')
      }
    } catch (error) {
      console.error('Error retrieving password:', error)
      setError('Failed to retrieve password')
    }
  }

  const resetForms = () => {
    setFormData({ email: '', password: '' })
    setError('')
    setSuccess('')
    setRetrievedPassword('')
    setIsPasswordRetrieval(false)
  }

  const loadFinanceData = async () => {
    try {
      // First initialize if needed
      await fetch('http://localhost:3001/api/finances/initialize')

      const response = await fetch('http://localhost:3001/api/finances')
      const data = await response.json()
      if (data.success) {
        const months = data.months || generateInitialFinanceData()
        setFinanceData(months)
        // Set selected month to current month and set viewOffset to current month index
        const currentMonthName = new Date().toLocaleString('default', { month: 'long' })
        const currentYear = new Date().getFullYear()
        const currentMonthIndex = months.findIndex(m => m.month === currentMonthName && m.year === currentYear)
        if (currentMonthIndex >= 0) {
          setSelectedMonth(months[currentMonthIndex].id)
          setViewOffset(currentMonthIndex)
        }
      } else {
        setFinanceData(generateInitialFinanceData())
      }
    } catch (error) {
      console.error('Error loading finance data:', error)
      setFinanceData(generateInitialFinanceData())
    }
  }

  const generateInitialFinanceData = () => {
    const months = []
    const currentDate = new Date()
    
    for (let i = 0; i < 12; i++) {
      const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1)
      months.push({
        id: i + 1,
        month: monthDate.toLocaleString('default', { month: 'long' }),
        year: monthDate.getFullYear(),
        income: 0,
        incomeConfirmed: false,
        knownExpenses: [],
        unpredictableExpenses: [],
        savings: 0,
        investedAmount: 0,
        investedType: 'None', // 'Invested', 'Borrowed', 'None'
        investedTransactions: []
      })
    }
    
    return months
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    resetForms()
  }

  const handleParseDocument = async (fileType, content) => {
    setIsParsing(true)
    setError('')
    try {
      const response = await fetch('http://localhost:3001/api/finances/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fileType,
          content
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        setError(errorData.message || `Server error: ${response.status}`)
        return
      }

      const data = await response.json()
      if (data.success) {
        // Convert endDate string to Date object if present
        const parsedDataWithDates = { ...data.parsedData }
        if (parsedDataWithDates.endDate && typeof parsedDataWithDates.endDate === 'string') {
          parsedDataWithDates.endDate = new Date(parsedDataWithDates.endDate)
        }
        setParsedData(parsedDataWithDates)
        setShowIncomeModal(true)
      } else {
        setError(data.message || 'Failed to parse document')
      }
    } catch (error) {
      console.error('Error parsing document:', error)
      setError('Failed to parse document: ' + error.message)
    } finally {
      setIsParsing(false)
    }
  }

  const handleTextImport = (text) => {
    // For text input, we'll do basic parsing without OpenAI
    try {
      // Simple regex-based parsing for income and expenses
      const lines = text.split('\n').filter(line => line.trim())
      
      let income = null // null means "not mentioned" - don't touch existing income
      const expenses = []
      let endDate = null
      let hasIncomeMention = false
      
      lines.forEach(line => {
        const lowerLine = line.toLowerCase()
        
        // Check if this line mentions income/salary/earnings
        if (lowerLine.includes('income') || lowerLine.includes('salary') || lowerLine.includes('earnings') || lowerLine.includes('take home') || lowerLine.includes('net pay')) {
          hasIncomeMention = true
        }
        
        // Look for income patterns - only if income is actually mentioned
        const incomePatterns = [
          /income\s+(?:is|of|:|=|=~|is approximately|around)\s*(?:Rs\.?|₹|\$)?\s*(\d[\d,]*\.?\d*)/i,
          /salary\s+(?:is|of|:|=|=~|is approximately|around)\s*(?:Rs\.?|₹|\$)?\s*(\d[\d,]*\.?\d*)/i,
          /earnings\s+(?:is|of|:|=|=~|is approximately|around)\s*(?:Rs\.?|₹|\$)?\s*(\d[\d,]*\.?\d*)/i,
          /monthly\s+(?:income|salary|pay)\s+(?:is|of|:|=|=~|is approximately|around)\s*(?:Rs\.?|₹|\$)?\s*(\d[\d,]*\.?\d*)/i,
          /take home\s+(?:is|of|:|=|=~|is approximately|around)\s*(?:Rs\.?|₹|\$)?\s*(\d[\d,]*\.?\d*)/i,
          /net\s+(?:is|of|:|=|=~|is approximately|around)\s*(?:Rs\.?|₹|\$)?\s*(\d[\d,]*\.?\d*)/i,
          /(?:Rs\.?|₹|\$)?\s*(\d[\d,]*\.?\d*)\s*(?:monthly|income|salary|per month)/i,
          /income[:\s]*\$?(\d[\d,]*\.?\d*)/i,
          /salary[:\s]*\$?(\d[\d,]*\.?\d*)/i,
          /earnings[:\s]*\$?(\d[\d,]*\.?\d*)/i,
          /monthly[:\s]*\$?(\d[\d,]*\.?\d*)/i,
          /take home[:\s]*\$?(\d[\d,]*\.?\d*)/i,
          /net[:\s]*\$?(\d[\d,]*\.?\d*)/i,
          /^\$?(\d[\d,]*\.?\d*)\s*(?:monthly|income|salary)/i,
          /(\d[\d,]*\.?\d*)\s*(?:monthly|income|salary)/i
        ]
        
        for (const pattern of incomePatterns) {
          const match = line.match(pattern)
          if (match) {
            income = parseFloat(match[1].replace(/,/g, ''))
            break
          }
        }
        
        // Look for end date patterns (until Mar 2027, till December 2026, etc.)
        const endDatePatterns = [
          /(?:until|till|to|through)\s+(\w+)\s+(\d{4})/i,
          /(?:until|till|to|through)\s+(\d{4})/i
        ]
        
        for (const pattern of endDatePatterns) {
          const match = line.match(pattern)
          if (match) {
            if (match[1] && match[2]) {
              // Match like "until Mar 2027"
              const monthName = match[1]
              const year = parseInt(match[2])
              const monthDate = new Date(`${monthName} 1, ${year}`)
              if (!isNaN(monthDate.getTime())) {
                endDate = monthDate
              }
            } else if (match[1]) {
              // Match like "until 2027" - assume end of year
              const year = parseInt(match[1])
              endDate = new Date(year, 11, 31) // December 31st
            }
            break
          }
        }
        
        // Look for expense patterns
        // Skip lines that are just date references like "Till Dec 2027"
        const isDateOnlyLine = /^(?:till|until|to|through|from)\s+\w+\s*\d{0,4}\s*$/i.test(line.trim())
        
        if (!isDateOnlyLine) {
          // Patterns like: "EMI 1 of Rs 24,649", "Rent: 15000", "Groceries is Rs 4000"
          const expensePatterns = [
            // "Add under Known Expense 'EMI 1' of Rs 24,649 till Dec 2027"
            /(?:add\s+(?:under\s+)?(?:known\s+)?(?:expense[s]?)\s+)?["']?(.+?)["']?\s+of\s+(?:Rs\.?|₹|\$)?\s*(\d[\d,]*\.?\d*)/i,
            // "EMI 1 Rs 24,649" or "EMI 1 ₹24,649"
            /(.+?)\s+(?:Rs\.?|₹|\$)\s*(\d[\d,]*\.?\d*)/i,
            // "Rent is Rs 15000" or "Rent costs 15000"
            /(.+?)\s+(?:is|:|=|=~|costs?|approximately|around)\s*(?:Rs\.?|₹|\$)?\s*(\d[\d,]*\.?\d*)/i,
            // "Rent: 15000" or "Rent = 15000"
            /(.+?)[:\s=]+(?:Rs\.?|₹|\$)?\s*(\d[\d,]*\.?\d*)/i,
            // "Rent 15000" (name followed by number at end)
            /(.+?)\s+(?:Rs\.?|₹|\$)?(\d[\d,]*\.?\d*)\s*(?:till|until|to|through)?/i
          ]
          
          for (const pattern of expensePatterns) {
            const match = line.match(pattern)
            if (match) {
              let expenseName = match[1].trim()
              const expenseAmount = parseFloat(match[2].replace(/,/g, ''))
              
              // Clean up expense name - remove leading "Add under Known Expense" etc
              expenseName = expenseName.replace(/^(?:add\s+(?:under\s+)?(?:known\s+)?(?:expense[s]?)\s+)/i, '').trim()
              // Remove leading date keywords like "Till Dec 2027 add monthly expense"
              expenseName = expenseName.replace(/^(?:till|until|to|through|from)\s+\w+\s*\d{0,4}\s*(?:add\s+(?:under\s+)?(?:known\s+)?(?:expense[s]?)\s*)?/i, '').trim()
              // Remove quotes
              expenseName = expenseName.replace(/^["']|["']$/g, '').trim()
              
              // Skip if this is actually an income line
              if (lowerLine.includes('income') || lowerLine.includes('salary') || lowerLine.includes('earnings')) {
                break
              }
              
              // Skip if expense name is just a date reference or too short
              if (/^(?:till|until|to|through|from|dec|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov)\s*\d*$/i.test(expenseName)) {
                break
              }
              
              // Filter out empty names and amounts that are too small
              if (expenseName && expenseName.length > 1 && expenseAmount > 0) {
                expenses.push({ name: expenseName, amount: expenseAmount })
                break
              }
            }
          }
        }
      })
      
      // If we found data, show the modal
      if (income !== null || expenses.length > 0) {
        setParsedData({ income, expenses, endDate })
        setShowIncomeModal(true)
      } else {
        // If no data found, still show modal with empty data for manual entry
        setParsedData({ income: null, expenses: [], endDate: null })
        setShowIncomeModal(true)
      }
    } catch (error) {
      console.error('Error processing text:', error)
      // Show modal with empty data for manual entry
      setParsedData({ income: null, expenses: [], endDate: null })
      setShowIncomeModal(true)
    }
  }

  const handleConfirmIncome = async (monthId, income, endDate = null) => {
    try {
      // Use the first month (current month) if no specific month is selected
      const targetMonthId = monthId || (financeData.length > 0 ? financeData[0].id : null)
      
      if (!targetMonthId) {
        setError('No month available to save income')
        return
      }

      // If there's an end date, apply income to all months up to that date
      if (endDate) {
        const monthsToUpdate = financeData.filter(month => {
          const monthDate = new Date(month.year, new Date(`${month.month} 1, ${month.year}`).getMonth(), 1)
          return monthDate <= endDate
        })

        for (const month of monthsToUpdate) {
          const response = await fetch('http://localhost:3001/api/finances/income', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              monthId: month.id,
              income,
              confirmed: true
            })
          })

          const data = await response.json()
          if (!data.success) {
            console.error(`Failed to update income for ${month.month} ${month.year}:`, data.message)
          }
        }
      } else {
        // Single month update
        const response = await fetch('http://localhost:3001/api/finances/income', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            monthId: targetMonthId,
            income,
            confirmed: true
          })
        })

        const data = await response.json()
        if (!data.success) {
          setError(data.message || 'Failed to save income')
          return
        }
      }

      loadFinanceData()
      setShowIncomeModal(false)
      setParsedData(null)
    } catch (error) {
      console.error('Error saving income:', error)
      setError('Failed to save income')
    }
  }

  const handleConfirmIncomeWithItems = async (monthId, incomeItems, endDate = null) => {
    try {
      const targetMonthId = monthId || (financeData.length > 0 ? financeData[0].id : null)
      
      if (!targetMonthId) {
        setError('No month available to save income')
        return
      }

      const totalIncome = incomeItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)

      // If there's an end date, apply income items to all months up to that date
      if (endDate) {
        const monthsToUpdate = financeData.filter(month => {
          const monthDate = new Date(month.year, new Date(`${month.month} 1, ${month.year}`).getMonth(), 1)
          return monthDate <= endDate
        })

        for (const month of monthsToUpdate) {
          const response = await fetch('http://localhost:3001/api/finances/income', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              monthId: month.id,
              income: totalIncome,
              incomeItems,
              confirmed: true
            })
          })

          const data = await response.json()
          if (!data.success) {
            console.error(`Failed to update income for ${month.month} ${month.year}:`, data.message)
          }
        }
      } else {
        // Single month update
        const response = await fetch('http://localhost:3001/api/finances/income', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            monthId: targetMonthId,
            income: totalIncome,
            incomeItems,
            confirmed: true
          })
        })

        const data = await response.json()
        if (!data.success) {
          setError(data.message || 'Failed to save income')
          return
        }
      }

      await loadFinanceData()
      setShowIncomeModal(false)
      setParsedData(null)
    } catch (error) {
      console.error('Error saving income:', error)
      setError('Failed to save income')
    }
  }

  const handleUpdateExpenses = async (monthId, expenses, endDate = null) => {
    try {
      // Use the first month (current month) if no specific month is selected
      const targetMonthId = monthId || (financeData.length > 0 ? financeData[0].id : null)
      
      if (!targetMonthId) {
        setError('No month available to update expenses')
        return
      }

      // If there's an end date, apply expenses to all months up to that date
      if (endDate) {
        const monthsToUpdate = financeData.filter(month => {
          const monthDate = new Date(month.year, new Date(`${month.month} 1, ${month.year}`).getMonth(), 1)
          return monthDate <= endDate
        })

        for (const month of monthsToUpdate) {
          const response = await fetch('http://localhost:3001/api/finances/expenses', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              monthId: month.id,
              knownExpenses: expenses
            })
          })

          const data = await response.json()
          if (!data.success) {
            console.error(`Failed to update expenses for ${month.month} ${month.year}:`, data.message)
          }
        }
      } else {
        // Single month update
        const response = await fetch('http://localhost:3001/api/finances/expenses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            monthId: targetMonthId,
            knownExpenses: expenses
          })
        })

        const data = await response.json()
        if (!data.success) {
          setError(data.message || 'Failed to update expenses')
          return
        }
      }

      loadFinanceData()
      setShowExpensesModal(false)
    } catch (error) {
      console.error('Error updating expenses:', error)
      setError('Failed to update expenses')
    }
  }

  const handleMergeExpenses = async (monthId, newExpenses, endDate = null) => {
    try {
      // Use the first month (current month) if no specific month is selected
      const targetMonthId = monthId || (financeData.length > 0 ? financeData[0].id : null)
      
      if (!targetMonthId) {
        setError('No month available to update expenses')
        return
      }

      // Determine which months to update
      let monthsToUpdate = [financeData.find(m => m.id === targetMonthId)]
      if (endDate) {
        monthsToUpdate = financeData.filter(month => {
          const monthDate = new Date(month.year, new Date(`${month.month} 1, ${month.year}`).getMonth(), 1)
          return monthDate <= endDate
        })
      }

      // For each month, merge new expenses with existing ones
      for (const month of monthsToUpdate) {
        // Get existing expenses for this month
        const existingExpenses = month.knownExpenses || []
        
        // Merge: add new expenses, but update amount if name already exists
        const mergedExpenses = [...existingExpenses]
        for (const newExp of newExpenses) {
          const existingIndex = mergedExpenses.findIndex(e => e.name.toLowerCase() === newExp.name.toLowerCase())
          if (existingIndex >= 0) {
            // Update existing expense amount
            mergedExpenses[existingIndex] = { ...mergedExpenses[existingIndex], amount: newExp.amount }
          } else {
            // Add new expense
            mergedExpenses.push(newExp)
          }
        }

        const response = await fetch('http://localhost:3001/api/finances/expenses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            monthId: month.id,
            knownExpenses: mergedExpenses
          })
        })

        const data = await response.json()
        if (!data.success) {
          console.error(`Failed to merge expenses for ${month.month} ${month.year}:`, data.message)
        }
      }

      loadFinanceData()
      setShowIncomeModal(false)
      setParsedData(null)
    } catch (error) {
      console.error('Error merging expenses:', error)
      setError('Failed to merge expenses')
    }
  }

  const handleAddUnpredictableExpense = async (monthId, expense) => {
    try {
      const response = await fetch('http://localhost:3001/api/finances/unpredictable-expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          monthId,
          expense
        })
      })

      const data = await response.json()
      if (data.success) {
        loadFinanceData()
        setShowSavingsModal(false)
      }
    } catch (error) {
      console.error('Error adding unpredictable expense:', error)
      setError('Failed to add expense')
    }
  }

  const handleUpdateUnpredictableExpenses = async (monthId, expenses) => {
    try {
      const response = await fetch('http://localhost:3001/api/finances/unpredictable-expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          monthId,
          expenses
        })
      })

      const data = await response.json()
      if (data.success) {
        await loadFinanceData()
        setShowSavingsModal(false)
      } else {
        setError(data.message || 'Failed to update expenses')
      }
    } catch (error) {
      console.error('Error updating unpredictable expenses:', error)
      setError('Failed to update expenses')
    }
  }

  const handleUpdateInvested = async (monthId, type, amount, transactions) => {
    try {
      const response = await fetch('http://localhost:3001/api/finances/invested', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          monthId,
          investedType: type,
          investedAmount: amount,
          investedTransactions: transactions
        })
      })

      const data = await response.json()
      if (data.success) {
        loadFinanceData()
        setShowInvestedModal(false)
      }
    } catch (error) {
      console.error('Error updating invested:', error)
      setError('Failed to update invested')
    }
  }

  // ============ Assets functions ============

  const loadAssets = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/finances/assets')
      const data = await response.json()
      if (data.success) {
        setAssets(data.assets)
      }
    } catch (error) {
      console.error('Error loading assets:', error)
    }
  }

  const handleSaveAsset = async () => {
    const name = document.getElementById('asset-name-input').value.trim()
    const amount = parseFloat(document.getElementById('asset-amount-input').value) || 0
    const category = document.getElementById('asset-category-input').value
    const type = document.getElementById('asset-type-input').value
    const excluded = document.getElementById('asset-excluded-input').value === 'true'
    const percentStr = document.getElementById('asset-percent-input').value.trim()
    const percent = percentStr === '' ? null : parseFloat(percentStr)

    if (!name) {
      setError('Asset name is required')
      return
    }

    try {
      if (editingAssetId) {
        // Update existing
        const response = await fetch(`http://localhost:3001/api/finances/assets/${editingAssetId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, amount, category, type, excluded, percent })
        })
        const data = await response.json()
        if (!data.success) {
          setError(data.message || 'Failed to update asset')
          return
        }
      } else {
        // Add new
        const response = await fetch('http://localhost:3001/api/finances/assets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, amount, category, type, excluded, percent })
        })
        const data = await response.json()
        if (!data.success) {
          setError(data.message || 'Failed to add asset')
          return
        }
      }
      await loadAssets()
      setShowAssetModal(false)
      setEditingAssetId(null)
      setAddingExcluded(false)
      setError('')
    } catch (error) {
      console.error('Error saving asset:', error)
      setError('Failed to save asset')
    }
  }

  const handleDeleteAsset = async (id) => {
    if (!confirm('Are you sure you want to delete this asset?')) return
    try {
      const response = await fetch(`http://localhost:3001/api/finances/assets/${id}`, {
        method: 'DELETE'
      })
      const data = await response.json()
      if (data.success) {
        await loadAssets()
      } else {
        setError(data.message || 'Failed to delete asset')
      }
    } catch (error) {
      console.error('Error deleting asset:', error)
      setError('Failed to delete asset')
    }
  }

  const handleToggleAssetExcluded = async (id, excluded) => {
    try {
      const asset = assets.find(a => a.id === id)
      if (!asset) return
      const response = await fetch(`http://localhost:3001/api/finances/assets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: asset.name,
          amount: asset.amount,
          category: asset.category,
          type: asset.type,
          excluded: excluded,
          percent: asset.percent
        })
      })
      const data = await response.json()
      if (data.success) {
        await loadAssets()
      } else {
        setError(data.message || 'Failed to update asset')
      }
    } catch (error) {
      console.error('Error toggling asset exclusion:', error)
      setError('Failed to update asset')
    }
  }

  const handleReorderAssets = async (reorderedAssetIds) => {
    try {
      const response = await fetch('http://localhost:3001/api/finances/assets/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetIds: reorderedAssetIds })
      })
      const data = await response.json()
      if (data.success) {
        await loadAssets()
      }
    } catch (error) {
      console.error('Error reordering assets:', error)
      await loadAssets()
    }
  }

  const formatIndianCounting = (amount) => {
    const absAmount = Math.abs(amount)
    if (absAmount >= 10000000) {
      const crores = Math.floor(absAmount / 10000000)
      const remainder = absAmount % 10000000
      const lakhs = Math.floor(remainder / 100000)
      if (lakhs > 0) {
        return `${crores} Crore ${lakhs} Lakh`
      }
      return `${crores} Crore`
    }
    if (absAmount >= 100000) {
      const lakhs = Math.floor(absAmount / 100000)
      const remainder = absAmount % 100000
      const thousands = Math.floor(remainder / 1000)
      if (thousands > 0) {
        return `${lakhs} Lakh ${thousands} Thousand`
      }
      return `${lakhs} Lakh`
    }
    if (absAmount >= 1000) {
      const thousands = Math.floor(absAmount / 1000)
      const remainder = absAmount % 1000
      const hundreds = Math.floor(remainder / 100)
      if (hundreds > 0) {
        return `${thousands} Thousand ${hundreds} Hundred`
      }
      return `${thousands} Thousand`
    }
    if (absAmount >= 100) {
      const hundreds = Math.floor(absAmount / 100)
      return `${hundreds} Hundred`
    }
    return ''
  }

  const formatIndianNumber = (amount) => {
    const negative = amount < 0
    const absAmount = Math.abs(amount)
    const numStr = absAmount.toString()
    let formatted
    if (numStr.length <= 3) {
      formatted = numStr
    } else {
      const lastThree = numStr.slice(-3)
      const otherDigits = numStr.slice(0, -3)
      formatted = otherDigits.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree
    }
    return negative ? '-' + formatted : formatted
  }

  const calculateSavings = (month) => {
    const totalKnownExpenses = month.knownExpenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0)
    const totalUnpredictableExpenses = month.unpredictableExpenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0)
    return Number(month.income) - totalKnownExpenses - totalUnpredictableExpenses
  }

  const calculateTotalInvested = (month) => {
    return month.investedTransactions.reduce((sum, trans) => sum + trans.amount, 0)
  }

  if (isLoading) {
    return (
      <div className="finances-page">
        <div className="loading">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="finances-page">
        <div className="finances-auth-container">
          {isPasswordRetrieval ? (
            <div className="password-retrieval">
              <h2>Retrieve Password</h2>
              <div className="form-group">
                <label>Email:</label>
                <input
                  type="email"
                  id="retrieval-email-input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter your email"
                />
              </div>
              <div className="form-notification-area">
                {error && <div className="form-error">{error}</div>}
                {success && <div className="form-success">{success}</div>}
              </div>
              {retrievedPassword && (
                <div className="retrieved-password">
                  <label>Your password:</label>
                  <div className="password-display">{retrievedPassword}</div>
                </div>
              )}
              <div className="modal-buttons">
                <button className="btn-cancel" onClick={() => setIsPasswordRetrieval(false)}>Back to Login</button>
                {!retrievedPassword && (
                  <button className="btn-save" onClick={handlePasswordRetrieval}>Retrieve Password</button>
                )}
              </div>
            </div>
          ) : userExists ? (
            <form className="login-form" onSubmit={(e) => {
              e.preventDefault()
              if (passwordKeydownCount < 3) {
                setError('Please type your password manually')
                return
              }
              handleLogin()
            }}>
              <h2>Login to Access Finances</h2>
              <input
                type="hidden"
                id="login-email-input"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              <div className="form-group">
                <label>Password:</label>
                <input
                  type="password"
                  id="login-password-input"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  onKeyDown={(e) => {
                    setPasswordKeydownCount(c => c + 1)
                    if (e.key === 'Enter' && passwordKeydownCount + 1 >= 3) {
                      e.currentTarget.form?.requestSubmit()
                    }
                  }}
                  onFocus={(e) => {
                    // Wipe any browser auto-filled value on focus
                    if (passwordKeydownCount === 0) {
                      setFormData({ ...formData, password: '' })
                      e.target.value = ''
                    }
                  }}
                  placeholder="password"
                  autoComplete="off"
                  autoFocus
                />
              </div>
              <div className="form-notification-area">
                {error && <div className="form-error">{error}</div>}
                {success && <div className="form-success">{success}</div>}
              </div>
              <div className="modal-buttons">
                <button type="button" className="btn-forgot" onClick={() => setIsPasswordRetrieval(true)}>Forgot Password?</button>
                <button type="button" className="btn-cancel" onClick={() => navigate('/')}>Cancel</button>
                <button
                  type="submit"
                  className="btn-save"
                  disabled={passwordKeydownCount < 3}
                >
                  Login
                </button>
              </div>
            </form>
          ) : (
            <div className="setup-form">
              <h2>Setup Finances Access</h2>
              <p>Create your account to access the Finances section. This will be the only account for this application.</p>
              <div className="form-group">
                <label>Email:</label>
                <input
                  type="email"
                  id="setup-email-input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter your email"
                />
              </div>
              <div className="form-group">
                <label>Password:</label>
                <input
                  type="password"
                  id="setup-password-input"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Create a password"
                />
              </div>
              <div className="form-notification-area">
                {error && <div className="form-error">{error}</div>}
                {success && <div className="form-success">{success}</div>}
              </div>
              <div className="modal-buttons">
                <button className="btn-cancel" onClick={() => navigate('/')}>Cancel</button>
                <button className="btn-save" onClick={handleSetup}>Create Account</button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="finances-page">
      <div className="finances-header">
        <h1>Finances</h1>
        <div className="finances-header-controls">
          <button className="btn-back" onClick={() => navigate('/')}>Back to Calendar</button>
          <button className="btn-logout" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="finances-content">
        <div className="finances-upload-section">
          <button 
            type="button"
            className="import-toggle-btn"
            onClick={() => setShowImportSection(!showImportSection)}
            aria-label={showImportSection ? 'Collapse import section' : 'Expand import section'}
          >
            <span className="import-toggle-icon">{showImportSection ? '▼' : '▶'}</span>
            <span className="import-toggle-text">Import Financial Data</span>
          </button>
          {showImportSection && (
            <>
              <div className="upload-options">
            <div className="upload-option">
              <label>Upload PDF:</label>
              <input type="file" accept=".pdf" id="pdf-input" />
              <button 
                className="btn-import"
                onClick={() => {
                  const fileInput = document.getElementById('pdf-input')
                  const file = fileInput.files[0]
                  if (file) {
                    const reader = new FileReader()
                    reader.onload = (event) => {
                      handleParseDocument('pdf', event.target.result)
                    }
                    reader.readAsDataURL(file)
                  } else {
                    setError('Please select a PDF file first')
                  }
                }}
              >
                Import PDF
              </button>
            </div>
            {/* Excel upload disabled - backend endpoint not implemented */}
            {/* <div className="upload-option">
              <label>Upload Excel:</label>
              <input type="file" accept=".xlsx,.xls" id="excel-input" />
              <button 
                className="btn-import"
                onClick={() => {
                  const fileInput = document.getElementById('excel-input')
                  const file = fileInput.files[0]
                  if (file) {
                    const reader = new FileReader()
                    reader.onload = (event) => {
                      handleParseDocument('excel', event.target.result)
                    }
                    reader.readAsDataURL(file)
                  } else {
                    setError('Please select an Excel file first')
                  }
                }}
              >
                Import Excel
              </button>
            </div> */}
            <div className="upload-option">
              <label>Paste Text:</label>
              <textarea 
                placeholder="Paste financial data here..."
                rows={4}
                id="text-input"
              />
              <button 
                className="btn-import"
                onClick={() => {
                  const textInput = document.getElementById('text-input')
                  if (textInput.value.trim()) {
                    handleTextImport(textInput.value)
                  } else {
                    setError('Please enter some text first')
                  }
                }}
              >
                Import Text
              </button>
            </div>
          </div>
          {isParsing && <div className="parsing-indicator">Parsing document with AI...</div>}
          {error && <div className="form-error">{error}</div>}
            </>
          )}
        </div>

        {/* Assets Section */}
        <div className="finances-assets-section">
          <button 
            type="button"
            className="import-toggle-btn"
            onClick={() => setShowAssetsSection(!showAssetsSection)}
          >
            <span className="import-toggle-icon">{showAssetsSection ? '▼' : '▶'}</span>
            <span className="import-toggle-text">Assets</span>
          </button>
          {showAssetsSection && (
            <>
              {/* Active Assets (included in totals) */}
              <div className="assets-subsection-header">Assets (included in net worth)</div>
              <div 
                className="assets-grid assets-drop-zone"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  const id = parseInt(e.dataTransfer.getData('text/plain'))
                  if (!id) return
                  const asset = assets.find(a => a.id === id)
                  if (!asset) return
                  // If dropped from excluded section, just toggle to active (no reorder)
                  if (asset.excluded) {
                    handleToggleAssetExcluded(id, false)
                    setDraggedAssetId(null)
                    return
                  }
                  // Same section - reorder
                  const dropTarget = e.target.closest('.asset-card')
                  if (dropTarget) {
                    const targetId = parseInt(dropTarget.dataset.assetId)
                    if (targetId && targetId !== id) {
                      const activeIds = assets.filter(a => !a.excluded).map(a => a.id)
                      const fromIndex = activeIds.indexOf(id)
                      const toIndex = activeIds.indexOf(targetId)
                      if (fromIndex !== -1 && toIndex !== -1) {
                        activeIds.splice(fromIndex, 1)
                        activeIds.splice(toIndex, 0, id)
                        handleReorderAssets(activeIds)
                      }
                    }
                  }
                  setDraggedAssetId(null)
                }}
              >
                {assets.filter(a => !a.excluded).length === 0 && (
                  <div className="no-assets">No assets added yet — drag here to include in net worth</div>
                )}
                {assets.filter(a => !a.excluded).map(asset => (
                  <div 
                    key={asset.id} 
                    data-asset-id={asset.id}
                    className={`asset-card asset-${asset.type} asset-${asset.category}${draggedAssetId === asset.id ? ' dragging' : ''}`}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', asset.id)
                      setDraggedAssetId(asset.id)
                    }}
                    onDragEnd={() => setDraggedAssetId(null)}
                  >
                    <div className="asset-card-name" title={asset.name}>{asset.name.length > 20 ? asset.name.slice(0, 20) + '...' : asset.name}</div>
                    {asset.updated_at && (
                      <div className="asset-card-updated" title={new Date(asset.updated_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}>Last Updated: {new Date(asset.updated_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                    )}
                    <div className="asset-card-amount">
                      {asset.type === 'liability' ? '-' : ''}₹{formatIndianNumber(Math.abs(Number(asset.amount)))}
                    </div>
                    {formatIndianCounting(asset.amount) && (
                      <div className="asset-card-indian">{formatIndianCounting(asset.amount)}</div>
                    )}
                    <div className="asset-card-tags">
                      <span className={`asset-tag tag-${asset.category}`}>{asset.category}</span>
                      <span className={`asset-tag tag-${asset.type}`}>{asset.type}</span>
                      {asset.percent !== null && asset.percent !== undefined && (
                        <span className="asset-tag tag-percent">{asset.percent}%</span>
                      )}
                    </div>
                    <div className="asset-card-actions">
                      <button
                        type="button"
                        className="btn-edit-asset"
                        onClick={() => {
                          setEditingAssetId(asset.id)
                          setShowAssetModal(true)
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn-remove-expense"
                        onClick={() => handleDeleteAsset(asset.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals (only from non-excluded assets) */}
              <div className="assets-totals">
                {(() => {
                  const activeAssets = assets.filter(a => !a.excluded && a.type !== 'insurance')
                  const movableTotal = activeAssets
                    .filter(a => a.category === 'movable')
                    .reduce((sum, a) => sum + (a.type === 'liability' ? -Number(a.amount) : Number(a.amount)), 0)
                  const immovableTotal = activeAssets
                    .filter(a => a.category === 'immovable')
                    .reduce((sum, a) => sum + (a.type === 'liability' ? -Number(a.amount) : Number(a.amount)), 0)
                  const netWorth = movableTotal + immovableTotal
                  return (
                    <>
                      <div className="asset-total">
                        <span className="asset-total-label">Movable:</span>
                        <span className="asset-total-value">₹{formatIndianNumber(movableTotal)}</span>
                        {formatIndianCounting(movableTotal) && (
                          <span className="asset-total-indian">{formatIndianCounting(movableTotal)}</span>
                        )}
                      </div>
                      <div className="asset-total">
                        <span className="asset-total-label">Immovable:</span>
                        <span className="asset-total-value">₹{formatIndianNumber(immovableTotal)}</span>
                        {formatIndianCounting(immovableTotal) && (
                          <span className="asset-total-indian">{formatIndianCounting(immovableTotal)}</span>
                        )}
                      </div>
                      <div className="asset-total asset-total-networth">
                        <span className="asset-total-label">Net Worth:</span>
                        <span className="asset-total-value">₹{formatIndianNumber(netWorth)}</span>
                        {formatIndianCounting(netWorth) && (
                          <span className="asset-total-indian">{formatIndianCounting(netWorth)}</span>
                        )}
                      </div>
                    </>
                  )
                })()}
              </div>

              <button
                type="button"
                className="btn-add-asset"
                onClick={() => {
                  setEditingAssetId(null)
                  setAddingExcluded(false)
                  setShowAssetModal(true)
                }}
              >
                Add Asset
              </button>

              {/* Excluded Assets (not included in totals) */}
              <div className="assets-subsection-header assets-subheader-excluded">Excluded Assets (not counted in net worth)</div>
              <div 
                className="assets-grid assets-drop-zone assets-drop-zone-excluded"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  const id = parseInt(e.dataTransfer.getData('text/plain'))
                  if (!id) return
                  const asset = assets.find(a => a.id === id)
                  if (!asset) return
                  // If dropped from active section, just toggle to excluded (no reorder)
                  if (!asset.excluded) {
                    handleToggleAssetExcluded(id, true)
                    setDraggedAssetId(null)
                    return
                  }
                  // Same section - reorder
                  const dropTarget = e.target.closest('.asset-card')
                  if (dropTarget) {
                    const targetId = parseInt(dropTarget.dataset.assetId)
                    if (targetId && targetId !== id) {
                      const excludedIds = assets.filter(a => a.excluded).map(a => a.id)
                      const fromIndex = excludedIds.indexOf(id)
                      const toIndex = excludedIds.indexOf(targetId)
                      if (fromIndex !== -1 && toIndex !== -1) {
                        excludedIds.splice(fromIndex, 1)
                        excludedIds.splice(toIndex, 0, id)
                        handleReorderAssets(excludedIds)
                      }
                    }
                  }
                  setDraggedAssetId(null)
                }}
              >
                {assets.filter(a => a.excluded).length === 0 && (
                  <div className="no-assets">Drag assets here to exclude from net worth</div>
                )}
                {assets.filter(a => a.excluded).map(asset => (
                  <div 
                    key={asset.id} 
                    data-asset-id={asset.id}
                    className={`asset-card asset-${asset.type} asset-${asset.category} asset-excluded${draggedAssetId === asset.id ? ' dragging' : ''}`}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', asset.id)
                      setDraggedAssetId(asset.id)
                    }}
                    onDragEnd={() => setDraggedAssetId(null)}
                  >
                    <div className="asset-card-name" title={asset.name}>{asset.name.length > 20 ? asset.name.slice(0, 20) + '...' : asset.name}</div>
                    {asset.updated_at && (
                      <div className="asset-card-updated" title={new Date(asset.updated_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}>Last Updated: {new Date(asset.updated_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                    )}
                    <div className="asset-card-amount">
                      {asset.type === 'liability' ? '-' : ''}₹{formatIndianNumber(Math.abs(Number(asset.amount)))}
                    </div>
                    {formatIndianCounting(asset.amount) && (
                      <div className="asset-card-indian">{formatIndianCounting(asset.amount)}</div>
                    )}
                    <div className="asset-card-tags">
                      <span className={`asset-tag tag-${asset.category}`}>{asset.category}</span>
                      <span className={`asset-tag tag-${asset.type}`}>{asset.type}</span>
                      {asset.percent !== null && asset.percent !== undefined && (
                        <span className="asset-tag tag-percent">{asset.percent}%</span>
                      )}
                    </div>
                    <div className="asset-card-actions">
                      <button
                        type="button"
                        className="btn-edit-asset"
                        onClick={() => {
                          setEditingAssetId(asset.id)
                          setShowAssetModal(true)
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn-remove-expense"
                        onClick={() => handleDeleteAsset(asset.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="assets-totals">
                {(() => {
                  const excludedAssets = assets.filter(a => a.excluded && a.type !== 'insurance')
                  const assetsTotal = excludedAssets
                    .filter(a => a.type === 'asset')
                    .reduce((sum, a) => sum + Number(a.amount), 0)
                  const liabilityTotal = excludedAssets
                    .filter(a => a.type === 'liability')
                    .reduce((sum, a) => sum + Number(a.amount), 0)
                  return (
                    <>
                      <div className="asset-total">
                        <span className="asset-total-label">Assets:</span>
                        <span className="asset-total-value asset-total-positive">₹{formatIndianNumber(assetsTotal)}</span>
                        {formatIndianCounting(assetsTotal) && (
                          <span className="asset-total-indian">{formatIndianCounting(assetsTotal)}</span>
                        )}
                      </div>
                      <div className="asset-total">
                        <span className="asset-total-label">Liabilities:</span>
                        <span className="asset-total-value asset-total-negative">₹{formatIndianNumber(liabilityTotal)}</span>
                        {formatIndianCounting(liabilityTotal) && (
                          <span className="asset-total-indian">{formatIndianCounting(liabilityTotal)}</span>
                        )}
                      </div>
                    </>
                  )
                })()}
              </div>
              <button
                type="button"
                className="btn-add-asset btn-add-excluded-asset"
                onClick={() => {
                  setEditingAssetId(null)
                  setAddingExcluded(true)
                  setShowAssetModal(true)
                }}
              >
                Add Excluded Asset
              </button>
            </>
          )}
        </div>

        <div className="finances-table-container">
          <div className="table-navigation">
            <button
              className="nav-month-btn"
              onClick={() => setViewOffset(Math.max(0, viewOffset - 1))}
              disabled={viewOffset === 0}
            >
              ↑ Previous
            </button>
            <span className="nav-month-info">
              Showing from: {financeData[viewOffset]?.month} {financeData[viewOffset]?.year}
            </span>
            <button
              className="nav-month-btn"
              onClick={() => setViewOffset(Math.min(financeData.length - 1, viewOffset + 1))}
              disabled={viewOffset >= financeData.length - 1}
            >
              ↓ Next
            </button>
          </div>
          <table className="finances-table">
            <thead>
              <tr>
                <th className="col-timeline">Timeline</th>
                <th className="col-income">Monthly Income</th>
                <th className="col-expenses">Known Expenses</th>
                <th className="col-savings">Savings</th>
                <th className="col-invested">Invested</th>
              </tr>
            </thead>
            <tbody>
              {financeData.slice(viewOffset).map((month, index) => (
                <tr key={month.id} className={selectedMonth === month.id ? 'selected-month' : ''}>
                  <td className="col-timeline">
                    <div className="timeline-cell">
                      <div className="month-name">{month.month}</div>
                      <div className="year-name">{month.year}</div>
                    </div>
                  </td>
                  <td className="col-income">
                    <div className="income-cell">
                      <div className="income-amount">
                        ₹{Number(month.income).toLocaleString()}
                      </div>
                      <div className="income-items-list">
                        {(month.incomeItems || []).map((item, itemIndex) => (
                          <div key={itemIndex} className="income-item">
                            <span className="income-item-name">{item.name}</span>
                            <span className="income-item-amount">₹{Number(item.amount).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                      <div className="income-status">
                        {month.incomeConfirmed ? '✓ Confirmed' : '⚠ Pending'}
                      </div>
                      <button 
                        className="btn-edit-income"
                        onClick={() => {
                          setSelectedMonth(month.id)
                          const existingItems = month.incomeItems && month.incomeItems.length > 0
                            ? month.incomeItems
                            : (month.income > 0 ? [{ name: 'Salary', amount: month.income }] : [{ name: 'Salary', amount: 0 }])
                          setParsedData({ 
                            income: month.income || 0, 
                            incomeItems: existingItems,
                            expenses: [], 
                            endDate: null,
                            isIncomeEdit: true
                          })
                          setShowIncomeModal(true)
                        }}
                      >
                        {month.incomeConfirmed ? 'Update' : 'Confirm'}
                      </button>
                    </div>
                  </td>
                  <td className="col-expenses">
                    <div className="expenses-cell">
                      <div className="expenses-list">
                        {month.knownExpenses.length > 0 ? (
                          month.knownExpenses.map((expense, expIndex) => (
                            <div key={expIndex} className="expense-item">
                              <span className="expense-name">{expense.name}</span>
                              <span className="expense-amount">₹{Number(expense.amount).toLocaleString()}</span>
                            </div>
                          ))
                        ) : (
                          <div className="no-expenses">No expenses set</div>
                        )}
                      </div>
                      <div className="expenses-total">
                        Total: ₹{month.knownExpenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0).toLocaleString()}
                      </div>
                      <button 
                        className="btn-update-expenses"
                        onClick={() => {
                          setSelectedMonth(month.id)
                          setShowExpensesModal(true)
                        }}
                      >
                        Update Expenses
                      </button>
                    </div>
                  </td>
                  <td className="col-savings">
                    <div className="savings-cell">
                      <div className="savings-balance">
                        Balance: ₹{calculateSavings(month).toLocaleString()}
                      </div>
                      <div className="savings-list">
                        {month.unpredictableExpenses.length > 0 ? (
                          month.unpredictableExpenses.map((expense, expIndex) => (
                            <div key={expIndex} className="unpredictable-expense-item">
                              <span className="expense-name">{expense.name}</span>
                              <span className="expense-amount">-₹{Number(expense.amount).toLocaleString()}</span>
                            </div>
                          ))
                        ) : (
                          <div className="no-unpredictable">No unpredictable expenses</div>
                        )}
                      </div>
                      <button 
                        className="btn-add-unpredictable"
                        onClick={() => {
                          setSelectedMonth(month.id)
                          setShowSavingsModal(true)
                        }}
                      >
                        Add Expense
                      </button>
                    </div>
                  </td>
                  <td className="col-invested">
                    <div className="invested-cell">
                      <div className="invested-header">
                        <div className="invested-type">{month.investedType}</div>
                        <div className="invested-total">
                          ₹{calculateTotalInvested(month).toLocaleString()}
                        </div>
                      </div>
                      <div className="invested-list">
                        {month.investedTransactions.length > 0 ? (
                          month.investedTransactions.map((transaction, transIndex) => (
                            <div key={transIndex} className="invested-transaction-item">
                              <span className="transaction-type">{transaction.type}</span>
                              <span className="transaction-amount">₹{Number(transaction.amount).toLocaleString()}</span>
                            </div>
                          ))
                        ) : (
                          <div className="no-transactions">No transactions</div>
                        )}
                      </div>
                      <button 
                        className="btn-update-invested"
                        onClick={() => {
                          setSelectedMonth(month.id)
                          setShowInvestedModal(true)
                        }}
                      >
                        Update
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Income Confirmation Modal */}
      {showIncomeModal && (
        <div className="modal-overlay" onClick={() => setShowIncomeModal(false)}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{parsedData?.isIncomeEdit ? 'Update Monthly Income' : (parsedData?.income !== null && parsedData?.income !== undefined ? 'Confirm Monthly Income and Expenses' : 'Confirm Expenses')}</h3>
            
            {parsedData?.endDate && (
              <div className="end-date-info">
                <p><strong>Apply until:</strong> {parsedData.endDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                <p><em>This will apply to all months from current month until {parsedData.endDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</em></p>
              </div>
            )}
            
            {(parsedData?.income !== null && parsedData?.income !== undefined) && (
              <div className="form-group">
                <label>Monthly Income Items:</label>
                <div className="expenses-edit-list" id="income-items-container">
                  {(parsedData?.incomeItems || [{ name: 'Salary', amount: parsedData?.income || 0 }]).map((item, index) => (
                    <div key={index} className="expense-edit-item">
                      <input
                        type="text"
                        defaultValue={item.name}
                        placeholder="Income source name"
                        className="expense-name-input"
                        id={`income-item-name-${index}`}
                      />
                      <input
                        type="number"
                        defaultValue={item.amount}
                        placeholder="Amount"
                        className="expense-amount-input"
                        id={`income-item-amount-${index}`}
                      />
                      <button 
                        type="button"
                        className="btn-remove-expense"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          const newItems = [...(parsedData?.incomeItems || [{ name: 'Salary', amount: parsedData?.income || 0 }])]
                          newItems.splice(index, 1)
                          setParsedData({ ...parsedData, incomeItems: newItems })
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button 
                    type="button"
                    className="btn-add-expense"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      const currentItems = parsedData?.incomeItems || [{ name: 'Salary', amount: parsedData?.income || 0 }]
                      const newItems = [...currentItems, { name: 'New Income', amount: 0 }]
                      setParsedData({ ...parsedData, incomeItems: newItems })
                    }}
                  >
                    Add Income Source
                  </button>
                </div>
              </div>
            )}

            {/* Only show expenses section when not in income-only edit mode */}
            {!parsedData?.isIncomeEdit && (
              <div className="form-group">
                <label>Known Expenses:</label>
                <div className="expenses-edit-list" id="parsed-expenses-container">
                  {(parsedData?.expenses || []).map((expense, index) => (
                    <div key={index} className="expense-edit-item">
                      <input
                        type="text"
                        defaultValue={expense.name}
                        placeholder="Expense name"
                        className="expense-name-input"
                        id={`parsed-expense-name-${index}`}
                      />
                      <input
                        type="number"
                        defaultValue={expense.amount}
                        placeholder="Amount"
                        className="expense-amount-input"
                        id={`parsed-expense-amount-${index}`}
                      />
                      <button 
                        type="button"
                        className="btn-remove-expense"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          const newExpenses = [...(parsedData?.expenses || [])]
                          newExpenses.splice(index, 1)
                          setParsedData({ ...parsedData, expenses: newExpenses })
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button 
                    type="button"
                    className="btn-add-expense"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      const newExpenses = [...(parsedData?.expenses || []), { name: 'New Expense', amount: 0 }]
                      setParsedData({ ...parsedData, expenses: newExpenses })
                    }}
                  >
                    Add Expense
                  </button>
                </div>
              </div>
            )}

            <div className="modal-buttons">
              <button className="btn-cancel" onClick={() => setShowIncomeModal(false)}>Cancel</button>
              <button 
                className="btn-save" 
                onClick={() => {
                  // Collect income items from the table
                  const incomeContainer = document.getElementById('income-items-container')
                  let incomeItems = []
                  let totalIncome = 0
                  if (incomeContainer) {
                    const incomeRows = incomeContainer.querySelectorAll('.expense-edit-item')
                    incomeItems = Array.from(incomeRows).map(item => ({
                      name: item.querySelector('.expense-name-input').value,
                      amount: parseFloat(item.querySelector('.expense-amount-input').value) || 0
                    }))
                    totalIncome = incomeItems.reduce((sum, item) => sum + item.amount, 0)
                  }

                  // Update parsed data with edited values
                  setParsedData({ ...parsedData, income: totalIncome, incomeItems })
                  
                  // Use the selected month for income edit, or first month for imports
                  const targetMonthId = selectedMonth || (financeData.length > 0 ? financeData[0].id : null)
                  
                  if (parsedData?.isIncomeEdit) {
                    // Income-only edit - save income items to the selected month only
                    handleConfirmIncomeWithItems(targetMonthId, incomeItems, null)
                    setShowIncomeModal(false)
                  } else {
                    // Import flow - only save income if it was mentioned in the prompt
                    if (totalIncome > 0 || (incomeItems.length > 0)) {
                      handleConfirmIncomeWithItems(targetMonthId, incomeItems, parsedData?.endDate)
                    }
                    
                    // Only update expenses if there are actually expenses to save
                    const container = document.getElementById('parsed-expenses-container')
                    if (container) {
                      const expenseItems = container.querySelectorAll('.expense-edit-item')
                      const expenses = Array.from(expenseItems).map(item => ({
                        name: item.querySelector('.expense-name-input').value,
                        amount: parseFloat(item.querySelector('.expense-amount-input').value) || 0
                      }))
                      if (expenses.length > 0) {
                        handleMergeExpenses(targetMonthId, expenses, parsedData?.endDate)
                      }
                    }
                  }
                }}
              >
                {parsedData?.isIncomeEdit ? 'Save Income' : 'Confirm and Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expenses Update Modal */}
      {showExpensesModal && selectedMonth && (
        <div className="modal-overlay" onClick={() => setShowExpensesModal(false)}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Update Known Expenses</h3>

            {/* Smart Remove - removes matching expenses across ALL months */}
            <div className="smart-remove-section">
              <label>Smart Remove (across all months):</label>
              <div className="smart-remove-row">
                <input
                  type="text"
                  id="smart-remove-name"
                  placeholder="Enter expense name to remove (e.g. 'Till Dec')"
                  className="smart-remove-input"
                />
                <button
                  type="button"
                  className="btn-smart-remove"
                  onClick={async (e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    const nameToRemove = document.getElementById('smart-remove-name').value.trim()
                    if (!nameToRemove) {
                      alert('Please enter an expense name to remove')
                      return
                    }
                    if (!confirm(`Remove all expenses matching "${nameToRemove}" across ALL months?`)) {
                      return
                    }
                    let removedCount = 0
                    for (const month of financeData) {
                      const filtered = month.knownExpenses.filter(exp => {
                        const matches = exp.name.toLowerCase().includes(nameToRemove.toLowerCase())
                        if (matches) removedCount++
                        return !matches
                      })
                      if (filtered.length !== month.knownExpenses.length) {
                        await fetch('http://localhost:3001/api/finances/expenses', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            monthId: month.id,
                            knownExpenses: filtered
                          })
                        })
                      }
                    }
                    document.getElementById('smart-remove-name').value = ''
                    await loadFinanceData()
                    alert(`Removed ${removedCount} expense(s) matching "${nameToRemove}"`)
                  }}
                >
                  Smart Remove
                </button>
              </div>
              <div className="smart-remove-hint">
                This removes all expenses containing the entered name from every month.
              </div>
            </div>

            <div className="expenses-edit-list" id="expenses-edit-container">
              {financeData.find(m => m.id === selectedMonth)?.knownExpenses.map((expense, index) => (
                <div key={index} className="expense-edit-item">
                  <input
                    type="text"
                    defaultValue={expense.name}
                    placeholder="Expense name"
                    className="expense-name-input"
                    id={`edit-expense-name-${index}`}
                  />
                  <input
                    type="number"
                    defaultValue={expense.amount}
                    placeholder="Amount"
                    className="expense-amount-input"
                    id={`edit-expense-amount-${index}`}
                  />
                  <button 
                    type="button"
                    className="btn-remove-expense"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      const month = financeData.find(m => m.id === selectedMonth)
                      const newExpenses = month.knownExpenses.filter((_, i) => i !== index)
                      // Update local state without saving to server yet
                      const updatedFinanceData = financeData.map(m => 
                        m.id === selectedMonth ? { ...m, knownExpenses: newExpenses } : m
                      )
                      setFinanceData(updatedFinanceData)
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <div className="expense-edit-actions">
                <button 
                  type="button"
                  className="btn-add-expense"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    const month = financeData.find(m => m.id === selectedMonth)
                    const newExpenses = [...month.knownExpenses, { name: 'New Expense', amount: 0 }]
                    const updatedFinanceData = financeData.map(m => 
                      m.id === selectedMonth ? { ...m, knownExpenses: newExpenses } : m
                    )
                    setFinanceData(updatedFinanceData)
                  }}
                >
                  Add Expense
                </button>
              </div>
            </div>
            <div className="modal-buttons">
              <button className="btn-cancel" onClick={() => setShowExpensesModal(false)}>Cancel</button>
              <button 
                className="btn-save" 
                onClick={() => {
                  const container = document.getElementById('expenses-edit-container')
                  const expenseItems = container.querySelectorAll('.expense-edit-item')
                  const newExpenses = Array.from(expenseItems).map(item => ({
                    name: item.querySelector('.expense-name-input').value,
                    amount: parseFloat(item.querySelector('.expense-amount-input').value) || 0
                  }))
                  handleUpdateExpenses(selectedMonth, newExpenses)
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Savings/Unpredictable Expenses Modal */}
      {showSavingsModal && (
        <div className="modal-overlay" onClick={() => setShowSavingsModal(false)}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Update Unpredictable Expenses</h3>
            <div className="expenses-edit-list" id="unpredictable-edit-container">
              {(financeData.find(m => m.id === selectedMonth)?.unpredictableExpenses || []).map((expense, index) => (
                <div key={index} className="expense-edit-item">
                  <input
                    type="text"
                    defaultValue={expense.name}
                    placeholder="Expense description"
                    className="expense-name-input"
                    id={`unpredictable-edit-name-${index}`}
                  />
                  <input
                    type="number"
                    defaultValue={expense.amount}
                    placeholder="Amount"
                    className="expense-amount-input"
                    id={`unpredictable-edit-amount-${index}`}
                  />
                  <button
                    type="button"
                    className="btn-remove-expense"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      const month = financeData.find(m => m.id === selectedMonth)
                      const newExpenses = month.unpredictableExpenses.filter((_, i) => i !== index)
                      const updatedFinanceData = financeData.map(m =>
                        m.id === selectedMonth ? { ...m, unpredictableExpenses: newExpenses } : m
                      )
                      setFinanceData(updatedFinanceData)
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <div className="expense-edit-actions">
                <button
                  type="button"
                  className="btn-add-expense"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    const month = financeData.find(m => m.id === selectedMonth)
                    const newExpenses = [...(month.unpredictableExpenses || []), { name: 'New Expense', amount: 0 }]
                    const updatedFinanceData = financeData.map(m =>
                      m.id === selectedMonth ? { ...m, unpredictableExpenses: newExpenses } : m
                    )
                    setFinanceData(updatedFinanceData)
                  }}
                >
                  Add Expense
                </button>
              </div>
            </div>
            <div className="modal-buttons">
              <button className="btn-cancel" onClick={() => setShowSavingsModal(false)}>Cancel</button>
              <button
                className="btn-save"
                onClick={async () => {
                  const container = document.getElementById('unpredictable-edit-container')
                  const expenseItems = container.querySelectorAll('.expense-edit-item')
                  const newExpenses = Array.from(expenseItems).map(item => ({
                    name: item.querySelector('.expense-name-input').value,
                    amount: parseFloat(item.querySelector('.expense-amount-input').value) || 0
                  }))
                  await handleUpdateUnpredictableExpenses(selectedMonth, newExpenses)
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invested Modal */}
      {showInvestedModal && (
        <div className="modal-overlay" onClick={() => setShowInvestedModal(false)}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Update Investment Status</h3>
            
            {/* Existing transactions - editable */}
            <div className="form-group">
              <label>Existing Transactions:</label>
              <div className="expenses-edit-list" id="invested-edit-container">
                {(financeData.find(m => m.id === selectedMonth)?.investedTransactions || []).map((transaction, index) => (
                  <div key={index} className="expense-edit-item">
                    <select
                      defaultValue={transaction.type}
                      className="expense-name-input"
                      id={`invested-edit-type-${index}`}
                    >
                      <option value="Invested">Invested</option>
                      <option value="Borrowed">Borrowed</option>
                      <option value="None">None</option>
                    </select>
                    <input
                      type="number"
                      defaultValue={transaction.amount}
                      placeholder="Amount"
                      className="expense-amount-input"
                      id={`invested-edit-amount-${index}`}
                    />
                    <button
                      type="button"
                      className="btn-remove-expense"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        const month = financeData.find(m => m.id === selectedMonth)
                        const newTransactions = month.investedTransactions.filter((_, i) => i !== index)
                        // Update local state without saving to server yet
                        const updatedFinanceData = financeData.map(m => 
                          m.id === selectedMonth ? { ...m, investedTransactions: newTransactions } : m
                        )
                        setFinanceData(updatedFinanceData)
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {(financeData.find(m => m.id === selectedMonth)?.investedTransactions || []).length === 0 && (
                  <div className="no-unpredictable">No transactions yet</div>
                )}
                {((financeData.find(m => m.id === selectedMonth)?.investedTransactions || []).length > 0) && (
                  <button
                    type="button"
                    className="btn-remove-all-expenses"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      if (confirm('Are you sure you want to remove all transactions for this month?')) {
                        const updatedFinanceData = financeData.map(m => 
                          m.id === selectedMonth ? { ...m, investedTransactions: [] } : m
                        )
                        setFinanceData(updatedFinanceData)
                      }
                    }}
                  >
                    Remove All
                  </button>
                )}
              </div>
            </div>

            {/* Add new transaction */}
            <div className="form-group">
              <label>Add New Transaction:</label>
              <div className="expense-edit-item">
                <select id="invested-type" className="expense-name-input">
                  <option value="Invested">Invested</option>
                  <option value="Borrowed">Borrowed</option>
                  <option value="None">None</option>
                </select>
                <input type="number" id="invested-amount" placeholder="Amount" className="expense-amount-input" />
              </div>
            </div>

            <div className="modal-buttons">
              <button className="btn-cancel" onClick={() => setShowInvestedModal(false)}>Cancel</button>
              <button 
                className="btn-save" 
                onClick={() => {
                  // Collect edited existing transactions
                  const editContainer = document.getElementById('invested-edit-container')
                  const editItems = editContainer.querySelectorAll('.expense-edit-item')
                  const existingTransactions = Array.from(editItems).map(item => ({
                    type: item.querySelector('select').value,
                    amount: parseFloat(item.querySelector('.expense-amount-input').value) || 0
                  }))

                  // Collect new transaction if amount is entered
                  const newType = document.getElementById('invested-type').value
                  const newAmount = parseFloat(document.getElementById('invested-amount').value) || 0
                  
                  let allTransactions = [...existingTransactions]
                  if (newAmount > 0) {
                    allTransactions.push({ type: newType, amount: newAmount })
                  }

                  // Determine the primary type (most common non-None type)
                  const nonNoneTypes = allTransactions.filter(t => t.type !== 'None')
                  const primaryType = nonNoneTypes.length > 0 ? nonNoneTypes[0].type : 'None'
                  
                  handleUpdateInvested(selectedMonth, primaryType, 0, allTransactions)
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Asset Add/Edit Modal */}
      {showAssetModal && (
        <div className="modal-overlay" onClick={() => { setShowAssetModal(false); setEditingAssetId(null); setAddingExcluded(false) }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editingAssetId ? 'Edit Asset' : 'Add Asset'}</h3>
            <div className="form-group">
              <label>Name:</label>
              <input
                type="text"
                id="asset-name-input"
                defaultValue={editingAssetId ? assets.find(a => a.id === editingAssetId)?.name : ''}
                placeholder="Asset name (e.g. Car, House, Gold)"
              />
            </div>
            <div className="form-group">
              <label>Amount (₹):</label>
              <input
                type="number"
                id="asset-amount-input"
                defaultValue={editingAssetId ? assets.find(a => a.id === editingAssetId)?.amount : 0}
                placeholder="Worth in INR"
              />
            </div>
            <div className="form-group">
              <label>Category:</label>
              <select id="asset-category-input" defaultValue={editingAssetId ? assets.find(a => a.id === editingAssetId)?.category : 'movable'}>
                <option value="movable">Movable</option>
                <option value="immovable">Immovable</option>
              </select>
            </div>
            <div className="form-group">
              <label>Type:</label>
              <select id="asset-type-input" defaultValue={editingAssetId ? assets.find(a => a.id === editingAssetId)?.type : 'asset'}>
                <option value="asset">Asset</option>
                <option value="liability">Liability</option>
                <option value="insurance">Insurance</option>
              </select>
            </div>
            <div className="form-group">
              <label>Excluded from net worth:</label>
              <select id="asset-excluded-input" defaultValue={editingAssetId ? (assets.find(a => a.id === editingAssetId)?.excluded ? 'true' : 'false') : (addingExcluded ? 'true' : 'false')}>
                <option value="false">No (include in totals)</option>
                <option value="true">Yes (exclude from totals)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Percent (optional):</label>
              <input
                type="number"
                id="asset-percent-input"
                step="0.01"
                defaultValue={editingAssetId ? (assets.find(a => a.id === editingAssetId)?.percent !== null && assets.find(a => a.id === editingAssetId)?.percent !== undefined ? assets.find(a => a.id === editingAssetId)?.percent : '') : ''}
                placeholder="e.g. 15.5 (leave empty if not applicable)"
              />
            </div>
            <div className="form-notification-area">
              {error && <div className="form-error">{error}</div>}
            </div>
            <div className="modal-buttons">
              <button className="btn-cancel" onClick={() => { setShowAssetModal(false); setEditingAssetId(null); setAddingExcluded(false) }}>Cancel</button>
              <button className="btn-save" onClick={handleSaveAsset}>
                {editingAssetId ? 'Update' : 'Add'} Asset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Finances