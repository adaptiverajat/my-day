import { useState } from 'react'
import { parseFinancialText } from '../../utils/financesTextParser'

export function useFinancesDocumentImport(setError, setShowIncomeModal) {
  const [isParsing, setIsParsing] = useState(false)
  const [parsedData, setParsedData] = useState(null)

  const handleParseDocument = async (fileType, content) => {
    setIsParsing(true)
    setError('')
    try {
      const response = await fetch('http://localhost:3001/api/finances/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileType, content })
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
    } catch (err) {
      console.error('Error parsing document:', err)
      setError('Failed to parse document: ' + err.message)
    } finally {
      setIsParsing(false)
    }
  }

  const handleTextImport = (text) => {
    try {
      const { income, expenses, endDate } = parseFinancialText(text)
      if (income !== null || expenses.length > 0) {
        setParsedData({ income, expenses, endDate })
      } else {
        setParsedData({ income: null, expenses: [], endDate: null })
      }
    } catch (err) {
      console.error('Error processing text:', err)
      setParsedData({ income: null, expenses: [], endDate: null })
    } finally {
      setShowIncomeModal(true)
    }
  }

  return {
    isParsing,
    parsedData,
    setParsedData,
    handleParseDocument,
    handleTextImport
  }
}
