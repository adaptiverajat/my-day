import React from 'react'

export default function BatchProgressBar({
  batchFiles,
  isBatchProcessing,
  batchProcessedCount,
  batchSuccessCount
}) {
  if (batchFiles.length === 0) return null

  const progressPercent = Math.round((batchSuccessCount / batchFiles.length) * 100)

  return (
    <div className="jd-batch-progress-card">
      <div className="jd-batch-progress-header">
        <span>
          {isBatchProcessing
            ? `⏳ Processing ${batchProcessedCount + 1} of ${batchFiles.length} files...`
            : batchSuccessCount > 0
            ? `🎉 Finished: ${batchSuccessCount} of ${batchFiles.length} locations added`
            : `${batchFiles.length} PDF file${batchFiles.length > 1 ? 's' : ''} ready to import`}
        </span>
        <span>{progressPercent}%</span>
      </div>
      <div className="jd-batch-progress-track">
        <div
          className="jd-batch-progress-fill"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  )
}
