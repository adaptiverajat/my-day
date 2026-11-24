export async function apiAddItem(columnId, text) {
  const response = await fetch('http://localhost:3001/api/work/items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ columnId, text, completed: false, notes: '' })
  });
  return response.json();
}

export async function apiToggleItem(itemId, completed) {
  const response = await fetch(`http://localhost:3001/api/work/items/${itemId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ completed })
  });
  return response.json();
}

export async function apiUpdateItemText(itemId, text) {
  const response = await fetch(`http://localhost:3001/api/work/items/${itemId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });
  return response.json();
}

export async function apiUpdateItemNotes(itemId, notes) {
  const response = await fetch(`http://localhost:3001/api/work/items/${itemId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes })
  });
  return response.json();
}

export async function apiDeleteItem(itemId) {
  const response = await fetch(`http://localhost:3001/api/work/items/${itemId}`, {
    method: 'DELETE'
  });
  return response.json();
}
