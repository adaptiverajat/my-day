import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLogoMenu from './AppLogoMenu';
import WorkColumnCard from './work/WorkColumnCard';
import WorkAddColumnModal from './work/WorkAddColumnModal';
import { useWorkData } from './work/useWorkData';

const Work = () => {
  const navigate = useNavigate();
  const [showAddColumnModal, setShowAddColumnModal] = useState(false);

  const {
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
  } = useWorkData();

  return (
    <div className="work-page">
      <div className="work-header">
        <AppLogoMenu title="Work" currentScreen="work" />
        <div className="work-header-controls">
          <button className="btn-back" onClick={() => navigate('/')}>Back to Calendar</button>
          <button className="btn-add-column" onClick={() => setShowAddColumnModal(true)}>
            + Add Vertical
          </button>
        </div>
      </div>

      <div className="work-content">
        <div className="work-columns-container">
          {columns.map((column, index) => (
            <WorkColumnCard
              key={column.id}
              column={column}
              index={index}
              isDragging={draggedColumn === index}
              onDragStart={(e) => {
                setDraggedColumn(index);
                e.dataTransfer.effectAllowed = 'move';
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
              }}
              onDrop={(e) => {
                e.preventDefault();
                handleDropColumn(index);
              }}
              onDragEnd={() => setDraggedColumn(null)}
              onUpdateColumn={handleUpdateColumn}
              onDeleteColumn={handleDeleteColumn}
              onAddItem={handleAddItem}
              onToggleItem={handleToggleItem}
              onUpdateItemText={handleUpdateItemText}
              onUpdateItemNotes={handleUpdateItemNotes}
              onDeleteItem={handleDeleteItem}
            />
          ))}

          {columns.length === 0 && (
            <div className="work-empty-state">
              <p>No work columns yet. Click "Add Vertical" to create one.</p>
            </div>
          )}
        </div>
      </div>

      <WorkAddColumnModal
        show={showAddColumnModal}
        onAdd={handleAddColumn}
        onClose={() => setShowAddColumnModal(false)}
      />
    </div>
  );
};

export default Work;
