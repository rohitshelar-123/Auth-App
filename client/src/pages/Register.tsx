import { Link, useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import Input from '../components/Input'

function Register() {
  const navigate = useNavigate()

  return (
    <main className="shell auth-shell">
      <section className="hero-panel">
        <p className="eyebrow">Auth App</p>
        <h1>Create your account</h1>
        <p className="muted">
          Sign up with your name, email, and password. This is UI only for now.
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
            label="Name"
            type="text"
            placeholder="John"
            value=""
            onChange={() => { }}
            className="field-input"
          />

          <Input
            label="Email"
            type="email"
            placeholder="example@gmail.com"
            value=""
            onChange={() => { }}
            className="field-input"
          />

          <Input
            label="Password"
            type="password"
            placeholder="Create a password"
            value=""
            onChange={() => { }}
            className="field-input"
          />

          <Button
            text="Create account"
            type="submit"
            onClick={() => { }}
            className="primary-btn"
          />
        </form>

        <p className="switch-copy">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </section>
    </main>
  )
}

export default Register
