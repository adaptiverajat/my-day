import { useState } from 'react'
import { LOCAL_STORAGE_KEY } from './jivandishaHelpers'
import { processBatchPdfFile } from './batchPdfProcessor'

export function useJivanDishaBatch(dbConnected, setLocations) {
  const [batchModalOpen, setBatchModalOpen] = useState(false)
  const [batchCountry, setBatchCountry] = useState('IN')
  const [batchFiles, setBatchFiles] = useState([])
  const [isBatchProcessing, setIsBatchProcessing] = useState(false)
  const [batchProcessedCount, setBatchProcessedCount] = useState(0)

  const handleBatchFileSelect = (e) => {
    const selected = Array.from(e.target.files || []).filter(
      (f) => f.name.toLowerCase().endsWith('.pdf') || f.type === 'application/pdf'
    )
    if (selected.length === 0) return

    const newItems = selected.map((file, idx) => ({
      id: `${Date.now()}_${idx}_${file.name}`,
      file,
      name: file.name,
      size: file.size,
      status: 'pending',
      result: null,
      error: null
    }))
    setBatchFiles((prev) => [...prev, ...newItems])
    if (e.target) e.target.value = ''
  }

  const handleRemoveBatchFile = (id) => {
    if (isBatchProcessing) return
    setBatchFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const handleClearBatchFiles = () => {
    if (isBatchProcessing) return
    setBatchFiles([])
    setBatchProcessedCount(0)
  }

  const runBatchImport = async () => {
    if (batchFiles.length === 0 || isBatchProcessing) return

    setIsBatchProcessing(true)
    const newlyAdded = []

    for (let i = 0; i < batchFiles.length; i++) {
      const item = batchFiles[i]
      if (item.status === 'success') continue

      setBatchFiles((prev) =>
        prev.map((f, idx) => (idx === i ? { ...f, status: 'processing', error: null } : f))
      )

      try {
        const { location, resultSummary } = await processBatchPdfFile(item, batchCountry, dbConnected)
        newlyAdded.push(location)

        setBatchFiles((prev) =>
          prev.map((f, idx) =>
            idx === i
              ? { ...f, status: 'success', result: resultSummary }
              : f
          )
        )
      } catch (err) {
        console.error(`Batch import error for ${item.name}:`, err)
        setBatchFiles((prev) =>
          prev.map((f, idx) =>
            idx === i
              ? { ...f, status: 'error', error: err.message || 'Failed to parse/import PDF' }
              : f
          )
        )
      }

      setBatchProcessedCount(i + 1)
    }

    if (newlyAdded.length > 0) {
      setLocations((prev) => {
        const combined = [...newlyAdded, ...prev]
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(combined))
        return combined
      })
    }

    setIsBatchProcessing(false)
  }

  const batchPendingCount = batchFiles.filter((f) => f.status === 'pending').length
  const batchSuccessCount = batchFiles.filter((f) => f.status === 'success').length

  return {
    batchModalOpen,
    setBatchModalOpen,
    batchCountry,
    setBatchCountry,
    batchFiles,
    isBatchProcessing,
    batchProcessedCount,
    batchPendingCount,
    batchSuccessCount,
    handleBatchFileSelect,
    handleRemoveBatchFile,
    handleClearBatchFiles,
    runBatchImport
  }
}
