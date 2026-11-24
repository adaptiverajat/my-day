import { useState, useEffect } from 'react';
import {
  apiFetchColumns,
  apiAddColumn,
  apiUpdateColumn,
  apiDeleteColumn,
  apiReorderColumns
} from './workColumnsApi';
import {
  apiAddItem,
  apiToggleItem,
  apiUpdateItemText,
  apiUpdateItemNotes,
  apiDeleteItem
} from './workItemsApi';

export function useWorkData() {
  const [columns, setColumns] = useState([]);
  const [draggedColumn, setDraggedColumn] = useState(null);

  const loadColumns = async () => {
    try {
      const data = await apiFetchColumns();
      if (data.success) setColumns(data.columns || []);
    } catch (error) {
      console.error('Error loading columns:', error);
    }
  };

  useEffect(() => {
    loadColumns();
  }, []);

  const handleAddColumn = async (title, color) => {
    if (!title.trim()) return;
    try {
      const data = await apiAddColumn(title, color);
      if (data.success) loadColumns();
    } catch (error) {
      console.error('Error adding column:', error);
    }
  };

  const handleUpdateColumn = async (columnId, title, color) => {
    try {
      const data = await apiUpdateColumn(columnId, title, color);
      if (data.success) loadColumns();
    } catch (error) {
      console.error('Error updating column:', error);
    }
  };

  const handleDeleteColumn = async (columnId) => {
    if (!confirm('Are you sure you want to delete this column and all its items?')) return;
    try {
      const data = await apiDeleteColumn(columnId);
      if (data.success) loadColumns();
    } catch (error) {
      console.error('Error deleting column:', error);
    }
  };

  const handleAddItem = async (columnId, text) => {
    if (!text.trim()) return;
    try {
      const data = await apiAddItem(columnId, text);
      if (data.success) loadColumns();
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const handleToggleItem = async (itemId, completed) => {
    try {
      const data = await apiToggleItem(itemId, completed);
      if (data.success) loadColumns();
    } catch (error) {
      console.error('Error toggling item:', error);
    }
  };

  const handleUpdateItemText = async (itemId, text) => {
    try {
      const data = await apiUpdateItemText(itemId, text);
      if (data.success) loadColumns();
    } catch (error) {
      console.error('Error updating item text:', error);
    }
  };

  const handleUpdateItemNotes = async (itemId, notes) => {
    try {
      const data = await apiUpdateItemNotes(itemId, notes);
      if (data.success) loadColumns();
    } catch (error) {
      console.error('Error updating item notes:', error);
    }
  };

  const handleDeleteItem = async (itemId) => {
    try {
      const data = await apiDeleteItem(itemId);
      if (data.success) loadColumns();
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const handleDropColumn = async (targetIndex) => {
    if (draggedColumn === null || draggedColumn === targetIndex) {
      setDraggedColumn(null);
      return;
    }

    const newColumns = [...columns];
    const [draggedData] = newColumns.splice(draggedColumn, 1);
    newColumns.splice(targetIndex, 0, draggedData);
    setColumns(newColumns);
    setDraggedColumn(null);

    try {
      await apiReorderColumns(newColumns.map(col => col.id));
    } catch (error) {
      console.error('Error reordering columns:', error);
      loadColumns();
    }
  };

  return {
    columns,
    draggedColumn,
    setDraggedColumn,
    handleAddColumn,
    handleUpdateColumn,
    handleDeleteColumn,
    handleAddItem,
    handleToggleItem,
    handleUpdateItemText,
    handleUpdateItemNotes,
    handleDeleteItem,
    handleDropColumn
  };
}
