import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import Input from '../components/Input'
import { API_BASE_URL } from '../lib/api'
import { saveToken } from '../lib/auth'

function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message ?? 'Login failed')
      }

      saveToken(data.token)
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="shell auth-shell">
      <section className="hero-panel">
        <p className="eyebrow">Auth App</p>
        <h1>Welcome back</h1>
        <p className="muted">
          Sign in with your email and password. This now talks to the backend.
        </p>
      </section>

      <section className="auth-card">
        <form className="form" onSubmit={handleSubmit}>
          <Input
            label="Email"
            type="email"
            placeholder="test@example.com"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            className="field-input"
          />

          <Input
            label="Password"
            type="password"
            placeholder="Enter your password"
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            className="field-input"
          />

          {error ? <p className="error-text">{error}</p> : null}

          <Button
            text={loading ? 'Logging in...' : 'Login'}
            type="submit"
            onClick={() => {}}
            className="primary-btn"
            disabled={loading}
          />
        </form>

        <p className="switch-copy">
          Don't have an account? <Link to="/register">Create one</Link>
        </p>
      </section>
    </main>
  )
}

export default Login
