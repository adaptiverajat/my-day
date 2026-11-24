import React from 'react';

export default function DatabaseStatusBanner({ databaseReady, databaseError, onRetry }) {
  if (databaseReady) return null;

  return (
    <div role={databaseError ? 'alert' : 'status'}>
      {databaseError ? (
        <>
          Database unavailable: {databaseError} <button onClick={onRetry}>Retry</button>
        </>
      ) : (
        'Connecting to the database…'
      )}
    </div>
  );
}
