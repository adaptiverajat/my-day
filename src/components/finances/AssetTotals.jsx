import React from 'react'
import { formatIndianNumber, formatIndianCounting } from './financesHelpers'

export function ActiveAssetTotals({ assets }) {
  const activeAssets = assets.filter(a => !a.excluded && a.type !== 'insurance')
  const movableTotal = activeAssets
    .filter(a => a.category === 'movable')
    .reduce((sum, a) => sum + (a.type === 'liability' ? -Number(a.amount) : Number(a.amount)), 0)
  const immovableTotal = activeAssets
    .filter(a => a.category === 'immovable')
    .reduce((sum, a) => sum + (a.type === 'liability' ? -Number(a.amount) : Number(a.amount)), 0)
  const netWorth = movableTotal + immovableTotal

  return (
    <div className="assets-totals">
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
    </div>
  )
}

export function ExcludedAssetTotals({ assets }) {
  const excludedAssets = assets.filter(a => a.excluded && a.type !== 'insurance')
  const assetsTotal = excludedAssets
    .filter(a => a.type === 'asset')
    .reduce((sum, a) => sum + Number(a.amount), 0)
  const liabilityTotal = excludedAssets
    .filter(a => a.type === 'liability')
    .reduce((sum, a) => sum + Number(a.amount), 0)

  return (
    <div className="assets-totals">
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
    </div>
  )
}
