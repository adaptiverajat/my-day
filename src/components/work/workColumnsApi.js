export async function apiFetchColumns() {
  const response = await fetch('http://localhost:3001/api/work/columns');
  return response.json();
}

export async function apiAddColumn(title, color) {
  const response = await fetch('http://localhost:3001/api/work/columns', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, color })
  });
  return response.json();
}

export async function apiUpdateColumn(columnId, title, color) {
  const response = await fetch(`http://localhost:3001/api/work/columns/${columnId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, color })
  });
  return response.json();
}

export async function apiDeleteColumn(columnId) {
  const response = await fetch(`http://localhost:3001/api/work/columns/${columnId}`, {
    method: 'DELETE'
  });
  return response.json();
}

export async function apiReorderColumns(columnIds) {
  const response = await fetch('http://localhost:3001/api/work/columns/reorder', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ columnIds })
  });
  return response.json();
}
