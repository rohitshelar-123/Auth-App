import { Link, useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import Input from '../components/Input'

function Login() {
  const navigate = useNavigate()

  return (
    <main className="shell auth-shell">
      <section className="hero-panel">
        <p className="eyebrow">Auth App</p>
        <h1>Welcome back</h1>
        <p className="muted">
          Sign in with your email and password. This is UI only for now.
        </p>
      </section>

      <section className="auth-card">
        <form
          className="form"
          onSubmit={(event) => {
            event.preventDefault()
            navigate('/dashboard')
          }}
        >
          <Input
            label="Email"
            type="email"
            placeholder="rohit@example.com"
            value=""
            onChange={() => {}}
            className="field-input"
          />

          <Input
            label="Password"
            type="password"
            placeholder="Enter your password"
            value=""
            onChange={() => {}}
            className="field-input"
          />

          <Button text="Login" type="submit" onClick={() => {}} className="primary-btn" />
        </form>

        <p className="switch-copy">
          Don't have an account? <Link to="/register">Create one</Link>
        </p>
      </section>
    </main>
  )
}

export default Login
