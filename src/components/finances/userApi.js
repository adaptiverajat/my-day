export async function checkUserApi() {
  const res = await fetch('http://localhost:3001/api/user/check')
  return res.json()
}

export async function createUserApi(email, password) {
  const res = await fetch('http://localhost:3001/api/user/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  return res.json()
}

export async function loginUserApi(email, password) {
  const res = await fetch('http://localhost:3001/api/user/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  return res.json()
}

export async function retrievePasswordApi(email) {
  const res = await fetch(`http://localhost:3001/api/user/password?email=${encodeURIComponent(email)}`)
  return res.json()
}
