import { useState, useEffect } from 'react'
import { checkUserApi, createUserApi, loginUserApi, retrievePasswordApi } from './userApi'

export function useFinancesAuth(onAuthenticated) {
  const [isLoading, setIsLoading] = useState(true)
  const [userExists, setUserExists] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isPasswordRetrieval, setIsPasswordRetrieval] = useState(false)
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [retrievedPassword, setRetrievedPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [passwordKeydownCount, setPasswordKeydownCount] = useState(0)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      setIsLoading(true)
      const data = await checkUserApi()
      if (data.success) {
        setUserExists(data.userExists)
        if (data.userExists) setFormData(prev => ({ ...prev, email: data.email || '' }))
      }
    } catch (err) {
      console.error('Error checking user:', err)
      setError('Failed to check user status')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSetup = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!formData.email || !formData.password) return setError('Email and password are required')
    try {
      const data = await createUserApi(formData.email, formData.password)
      if (data.success) {
        setSuccess('Account created successfully!')
        setTimeout(() => {
          setIsAuthenticated(true)
          setSuccess('')
          if (onAuthenticated) onAuthenticated()
        }, 1000)
      } else {
        setError(data.message || 'Failed to create account')
      }
    } catch (err) {
      console.error('Error creating user:', err)
      setError('Failed to create account')
    }
  }

  const handleLogin = async (e) => {
    if (e?.preventDefault) e.preventDefault()
    setError('')
    setSuccess('')
    const { email, password } = formData
    if (!email.trim() || !password) return setError('Email and password are required')
    try {
      const data = await loginUserApi(email.trim(), password)
      setFormData(prev => ({ ...prev, password: '' }))
      setPasswordKeydownCount(0)
      if (data.success) {
        setSuccess('Login successful!')
        setTimeout(() => {
          setIsAuthenticated(true)
          setSuccess('')
          if (onAuthenticated) onAuthenticated()
        }, 500)
      } else {
        setError(data.message || 'Login failed')
      }
    } catch (err) {
      console.error('Error during login:', err)
      setError('Login failed')
    }
  }

  const handlePasswordRetrieval = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!formData.email) return setError('Email is required')
    try {
      const data = await retrievePasswordApi(formData.email)
      if (data.success) {
        setRetrievedPassword(data.password)
        setSuccess('Password retrieved successfully')
      } else {
        setError(data.message || 'Failed to retrieve password')
      }
    } catch (err) {
      console.error('Error retrieving password:', err)
      setError('Failed to retrieve password')
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setFormData({ email: '', password: '' })
    setError('')
    setSuccess('')
    setRetrievedPassword('')
    setIsPasswordRetrieval(false)
  }

  return {
    isLoading,
    userExists,
    isAuthenticated,
    isPasswordRetrieval,
    setIsPasswordRetrieval,
    formData,
    setFormData,
    retrievedPassword,
    error,
    setError,
    success,
    passwordKeydownCount,
    setPasswordKeydownCount,
    handleSetup,
    handleLogin,
    handlePasswordRetrieval,
    handleLogout
  }
}
