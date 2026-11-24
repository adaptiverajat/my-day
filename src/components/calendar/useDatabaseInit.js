import { useState, useEffect } from 'react';

export function useDatabaseInit() {
  const [databaseReady, setDatabaseReady] = useState(false);
  const [databaseError, setDatabaseError] = useState('');

  const setupDatabase = async () => {
    try {
      setDatabaseError('');
      const response = await fetch('http://localhost:3001/api/setup-database');
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || data.message || 'Database setup failed');
      }
      setDatabaseReady(true);
    } catch (error) {
      console.error('Error setting up database:', error);
      setDatabaseError(error.message);
    }
  };

  useEffect(() => {
    setupDatabase();
  }, []);

  return { databaseReady, databaseError, setupDatabase };
}
