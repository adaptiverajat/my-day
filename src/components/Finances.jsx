import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  formatIndianCounting,
  formatIndianNumber,
  calculateSavings,
  calculateTotalInvested
} from './finances/financesHelpers'
import FinancesAuth from './finances/FinancesAuth'
import FinancesImportSection from './finances/FinancesImportSection'
import FinancesAssetsSection from './finances/FinancesAssetsSection'
import FinancesTable from './finances/FinancesTable'
import {
  IncomeModal,
  ExpensesModal,
  SavingsModal,
  InvestedModal
} from './finances/FinancesModals'
import AppLogoMenu from './AppLogoMenu'

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
      await fetch('http://localhost:3001/api/finances/initialize')

      const response = await fetch('http://localhost:3001/api/finances')
      const data = await response.json()
      if (data.success) {
        const months = data.months || generateInitialFinanceData()
        setFinanceData(months)
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
        investedType: 'None',
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
    try {
      const lines = text.split('\n').filter(line => line.trim())
      
      let income = null
      const expenses = []
      let endDate = null
      let hasIncomeMention = false
      
      lines.forEach(line => {
        const lowerLine = line.toLowerCase()
        
        if (lowerLine.includes('income') || lowerLine.includes('salary') || lowerLine.includes('earnings') || lowerLine.includes('take home') || lowerLine.includes('net pay')) {
          hasIncomeMention = true
        }
        
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
        
        const endDatePatterns = [
          /(?:until|till|to|through)\s+(\w+)\s+(\d{4})/i,
          /(?:until|till|to|through)\s+(\d{4})/i
        ]
        
        for (const pattern of endDatePatterns) {
          const match = line.match(pattern)
          if (match) {
            if (match[1] && match[2]) {
              const monthName = match[1]
              const year = parseInt(match[2], 10)
              const monthDate = new Date(`${monthName} 1, ${year}`)
              if (!isNaN(monthDate.getTime())) {
                endDate = monthDate
              }
            } else if (match[1]) {
              const year = parseInt(match[1], 10)
              endDate = new Date(year, 11, 31)
            }
            break
          }
        }
        
        const isDateOnlyLine = /^(?:till|until|to|through|from)\s+\w+\s*\d{0,4}\s*$/i.test(line.trim())
        
        if (!isDateOnlyLine) {
          const expensePatterns = [
            /(?:add\s+(?:under\s+)?(?:known\s+)?(?:expense[s]?)\s+)?["']?(.+?)["']?\s+of\s+(?:Rs\.?|₹|\$)?\s*(\d[\d,]*\.?\d*)/i,
            /(.+?)\s+(?:Rs\.?|₹|\$)\s*(\d[\d,]*\.?\d*)/i,
            /(.+?)\s+(?:is|:|=|=~|costs?|approximately|around)\s*(?:Rs\.?|₹|\$)?\s*(\d[\d,]*\.?\d*)/i,
            /(.+?)[:\s=]+(?:Rs\.?|₹|\$)?\s*(\d[\d,]*\.?\d*)/i,
            /(.+?)\s+(?:Rs\.?|₹|\$)?(\d[\d,]*\.?\d*)\s*(?:till|until|to|through)?/i
          ]
          
          for (const pattern of expensePatterns) {
            const match = line.match(pattern)
            if (match) {
              let expenseName = match[1].trim()
              const expenseAmount = parseFloat(match[2].replace(/,/g, ''))
              
              expenseName = expenseName.replace(/^(?:add\s+(?:under\s+)?(?:known\s+)?(?:expense[s]?)\s+)/i, '').trim()
              expenseName = expenseName.replace(/^(?:till|until|to|through|from)\s+\w+\s*\d{0,4}\s*(?:add\s+(?:under\s+)?(?:known\s+)?(?:expense[s]?)\s*)?/i, '').trim()
              expenseName = expenseName.replace(/^["']|["']$/g, '').trim()
              
              if (lowerLine.includes('income') || lowerLine.includes('salary') || lowerLine.includes('earnings')) {
                break
              }
              
              if (/^(?:till|until|to|through|from|dec|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov)\s*\d*$/i.test(expenseName)) {
                break
              }
              
              if (expenseName && expenseName.length > 1 && expenseAmount > 0) {
                expenses.push({ name: expenseName, amount: expenseAmount })
                break
              }
            }
          }
        }
      })
      
      if (income !== null || expenses.length > 0) {
        setParsedData({ income, expenses, endDate })
        setShowIncomeModal(true)
      } else {
        setParsedData({ income: null, expenses: [], endDate: null })
        setShowIncomeModal(true)
      }
    } catch (error) {
      console.error('Error processing text:', error)
      setParsedData({ income: null, expenses: [], endDate: null })
      setShowIncomeModal(true)
    }
  }

  const handleConfirmIncome = async (monthId, income, endDate = null) => {
    try {
      const targetMonthId = monthId || (financeData.length > 0 ? financeData[0].id : null)
      
      if (!targetMonthId) {
        setError('No month available to save income')
        return
      }

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
      const targetMonthId = monthId || (financeData.length > 0 ? financeData[0].id : null)
      
      if (!targetMonthId) {
        setError('No month available to update expenses')
        return
      }

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
      const targetMonthId = monthId || (financeData.length > 0 ? financeData[0].id : null)
      
      if (!targetMonthId) {
        setError('No month available to update expenses')
        return
      }

      let monthsToUpdate = [financeData.find(m => m.id === targetMonthId)]
      if (endDate) {
        monthsToUpdate = financeData.filter(month => {
          const monthDate = new Date(month.year, new Date(`${month.month} 1, ${month.year}`).getMonth(), 1)
          return monthDate <= endDate
        })
      }

      for (const month of monthsToUpdate) {
        const existingExpenses = month.knownExpenses || []
        const mergedExpenses = [...existingExpenses]
        for (const newExp of newExpenses) {
          const existingIndex = mergedExpenses.findIndex(e => e.name.toLowerCase() === newExp.name.toLowerCase())
          if (existingIndex >= 0) {
            mergedExpenses[existingIndex] = { ...mergedExpenses[existingIndex], amount: newExp.amount }
          } else {
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

  if (isLoading) {
    return (
      <div className="finances-page">
        <div className="loading">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <FinancesAuth
        isPasswordRetrieval={isPasswordRetrieval}
        setIsPasswordRetrieval={setIsPasswordRetrieval}
        userExists={userExists}
        formData={formData}
        setFormData={setFormData}
        retrievedPassword={retrievedPassword}
        error={error}
        setError={setError}
        success={success}
        passwordKeydownCount={passwordKeydownCount}
        setPasswordKeydownCount={setPasswordKeydownCount}
        handlePasswordRetrieval={handlePasswordRetrieval}
        handleLogin={handleLogin}
        handleSetup={handleSetup}
        navigate={navigate}
      />
    )
  }

  return (
    <div className="finances-page">
      <div className="finances-header">
        <AppLogoMenu
          title="Finances"
          currentScreen="finances"
        />
        <div className="finances-header-controls">
          <button type="button" className="btn-back" onClick={() => navigate('/')}>Back to Calendar</button>
          <button type="button" className="btn-logout" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="finances-content">
        <FinancesImportSection
          showImportSection={showImportSection}
          setShowImportSection={setShowImportSection}
          handleParseDocument={handleParseDocument}
          handleTextImport={handleTextImport}
          isParsing={isParsing}
          error={error}
          setError={setError}
        />

        <FinancesAssetsSection
          showAssetsSection={showAssetsSection}
          setShowAssetsSection={setShowAssetsSection}
          assets={assets}
          draggedAssetId={draggedAssetId}
          setDraggedAssetId={setDraggedAssetId}
          handleToggleAssetExcluded={handleToggleAssetExcluded}
          handleReorderAssets={handleReorderAssets}
          handleDeleteAsset={handleDeleteAsset}
          showAssetModal={showAssetModal}
          setShowAssetModal={setShowAssetModal}
          editingAssetId={editingAssetId}
          setEditingAssetId={setEditingAssetId}
          addingExcluded={addingExcluded}
          setAddingExcluded={setAddingExcluded}
          handleSaveAsset={handleSaveAsset}
          error={error}
        />

        <FinancesTable
          financeData={financeData}
          viewOffset={viewOffset}
          setViewOffset={setViewOffset}
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          setParsedData={setParsedData}
          setShowIncomeModal={setShowIncomeModal}
          setShowExpensesModal={setShowExpensesModal}
          setShowSavingsModal={setShowSavingsModal}
          setShowInvestedModal={setShowInvestedModal}
        />
      </div>

      {/* Modals */}
      <IncomeModal
        showIncomeModal={showIncomeModal}
        setShowIncomeModal={setShowIncomeModal}
        parsedData={parsedData}
        setParsedData={setParsedData}
        selectedMonth={selectedMonth}
        financeData={financeData}
        handleConfirmIncomeWithItems={handleConfirmIncomeWithItems}
        handleMergeExpenses={handleMergeExpenses}
      />

      <ExpensesModal
        showExpensesModal={showExpensesModal}
        setShowExpensesModal={setShowExpensesModal}
        selectedMonth={selectedMonth}
        financeData={financeData}
        setFinanceData={setFinanceData}
        loadFinanceData={loadFinanceData}
        handleUpdateExpenses={handleUpdateExpenses}
      />

      <SavingsModal
        showSavingsModal={showSavingsModal}
        setShowSavingsModal={setShowSavingsModal}
        selectedMonth={selectedMonth}
        financeData={financeData}
        setFinanceData={setFinanceData}
        handleUpdateUnpredictableExpenses={handleUpdateUnpredictableExpenses}
      />

      <InvestedModal
        showInvestedModal={showInvestedModal}
        setShowInvestedModal={setShowInvestedModal}
        selectedMonth={selectedMonth}
        financeData={financeData}
        setFinanceData={setFinanceData}
        handleUpdateInvested={handleUpdateInvested}
      />
    </div>
  )
}

export default Finances