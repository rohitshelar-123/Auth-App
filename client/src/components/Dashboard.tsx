import { useNavigate } from 'react-router-dom'

type DashboardProps = {
  onLogout: () => void
}

function Dashboard({ onLogout }: DashboardProps) {
  const navigate = useNavigate()

  return (
    <main className="shell dashboard-shell">
      <section className="dashboard-card">
        <p className="eyebrow">Signed in</p>
        <h1>Welcome back, Rohit</h1>
        <p className="muted">
          This is your simple post-login screen for now. We can connect the API next.
        </p>
        <div className="dashboard-grid">
          <div className="dashboard-tile">
            <span className="tile-label">Status</span>
            <strong>Active</strong>
          </div>
          <div className="dashboard-tile">
            <span className="tile-label">Plan</span>
            <strong>Starter</strong>
          </div>
          <div className="dashboard-tile">
            <span className="tile-label">Tasks</span>
            <strong>3 pending</strong>
          </div>
        </div>
        <button
          className="ghost-btn"
          onClick={() => {
            onLogout()
            navigate('/login')
          }}
          type="button"
        >
          Log out
        </button>
      </section>
    </main>
  )
}

export default Dashboard
