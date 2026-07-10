import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../lib/api'
import { clearToken, getToken } from '../lib/auth'

type TaskStatus = 'Pending' | 'In Progress' | 'Completed'
type TaskPriority = 'Low' | 'Medium' | 'High'

type TaskRow = {
  id: number
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  dueDate: string | null
  userId: number
}

type TaskResponse = {
  tasks: TaskRow[]
}

type OverviewItem = {
  label: string
  value: number
  tone: 'yellow' | 'blue' | 'green' | 'red'
}

type TaskFormState = {
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  dueDate: string
}

type TaskFilter = 'All' | TaskStatus
type SortMode = 'dueDate' | 'priority' | 'status'
type TaskMode = 'create' | 'edit'
const TASKS_PER_PAGE = 4

function formatDueDate(value: string | null) {
  if (!value) return 'No due date'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).format(parsed)
}

async function readResponseError(response: Response, fallback: string) {
  const contentType = response.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    try {
      const data = (await response.json()) as { message?: string }
      return data.message ?? fallback
    } catch {
      return fallback
    }
  }

  try {
    const text = await response.text()
    if (text.includes('<!DOCTYPE') || text.includes('<html')) {
      return 'Task API not reachable. Check the backend server and proxy.'
    }
    return text || fallback
  } catch {
    return fallback
  }
}

function Dashboard() {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState<TaskRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeFilter, setActiveFilter] = useState<TaskFilter>('All')
  const [sortMode, setSortMode] = useState<SortMode>('dueDate')
  const [currentPage, setCurrentPage] = useState(1)
  const [now, setNow] = useState(0)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createError, setCreateError] = useState('')
  const [createLoading, setCreateLoading] = useState(false)
  const [taskMode, setTaskMode] = useState<TaskMode>('create')
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null)
  const [form, setForm] = useState<TaskFormState>({
    title: '',
    description: '',
    status: 'Pending',
    priority: 'Medium',
    dueDate: '',
  })
  const token = getToken()

  useEffect(() => {
    const controller = new AbortController()

    async function loadTasks() {
      if (!token) {
        setError('Missing auth token')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError('')

        const response = await fetch(`${API_BASE_URL}/tasks`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(await readResponseError(response, 'Failed to load tasks'))
        }

        const data = (await response.json()) as TaskResponse

        setTasks(data.tasks ?? [])
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setError(err instanceof Error ? err.message : 'Failed to load tasks')
      } finally {
        setLoading(false)
      }
    }

    void loadTasks()

    return () => controller.abort()
  }, [token])

  useEffect(() => {
    setNow(Date.now())
  }, [])

  const overview = useMemo<OverviewItem[]>(() => {
    const pending = tasks.filter((task) => task.status === 'Pending').length
    const inProgress = tasks.filter((task) => task.status === 'In Progress').length
    const completed = tasks.filter((task) => task.status === 'Completed').length
    const overdue = tasks.filter((task) => {
      if (!task.dueDate || task.status === 'Completed') return false
      return now > 0 && new Date(task.dueDate).getTime() < now
    }).length

    return [
      { label: 'Pending', value: pending, tone: 'yellow' },
      { label: 'In Progress', value: inProgress, tone: 'blue' },
      { label: 'Completed', value: completed, tone: 'green' },
      { label: 'Overdue', value: overdue, tone: 'red' },
    ]
  }, [tasks, now])

  const sortedTasks = useMemo(
    () =>
      [...tasks]
        .filter((task) => activeFilter === 'All' || task.status === activeFilter)
        .sort((a, b) => {
          if (sortMode === 'priority') {
            const order: Record<TaskPriority, number> = { High: 0, Medium: 1, Low: 2 }
            return order[a.priority] - order[b.priority]
          }

          if (sortMode === 'status') {
            const order: Record<TaskStatus, number> = { Pending: 0, 'In Progress': 1, Completed: 2 }
            return order[a.status] - order[b.status]
          }

          const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER
          const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER
          return aDate - bDate
        }),
    [tasks, activeFilter, sortMode],
  )

  const totalPages = Math.max(1, Math.ceil(sortedTasks.length / TASKS_PER_PAGE))

  const paginatedTasks = useMemo(() => {
    const safePage = Math.min(currentPage, totalPages)
    const startIndex = (safePage - 1) * TASKS_PER_PAGE
    return sortedTasks.slice(startIndex, startIndex + TASKS_PER_PAGE)
  }, [sortedTasks, currentPage, totalPages])

  useEffect(() => {
    setCurrentPage(1)
  }, [activeFilter, sortMode])

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages))
  }, [totalPages])

  const handleLogout = () => {
    clearToken()
    navigate('/login')
  }

  const refreshTasks = async () => {
    if (!token) return

    const response = await fetch(`${API_BASE_URL}/tasks`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (response.ok) {
      const data = (await response.json()) as TaskResponse
      setTasks(data.tasks ?? [])
      return
    }

    setError(await readResponseError(response, 'Failed to refresh tasks'))
  }

  const markComplete = async (taskId: number) => {
    if (!token) return

    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/complete`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (response.ok) {
      await refreshTasks()
    }
  }

  const deleteTask = async (taskId: number) => {
    if (!token) return

    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (response.ok) {
      await refreshTasks()
    }
  }

  const openCreateModal = () => {
    setTaskMode('create')
    setEditingTaskId(null)
    setCreateError('')
    setIsCreateOpen(true)
  }

  const openEditModal = (task: TaskRow) => {
    setTaskMode('edit')
    setEditingTaskId(task.id)
    setCreateError('')
    setForm({
      title: task.title,
      description: task.description ?? '',
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ?? '',
    })
    setIsCreateOpen(true)
  }

  const closeCreateModal = () => {
    if (createLoading) return

    setIsCreateOpen(false)
    setTaskMode('create')
    setEditingTaskId(null)
    setCreateError('')
    setForm({
      title: '',
      description: '',
      status: 'Pending',
      priority: 'Medium',
      dueDate: '',
    })
  }

  const goToPreviousPage = () => {
    setCurrentPage((page) => Math.max(1, page - 1))
  }

  const goToNextPage = () => {
    setCurrentPage((page) => Math.min(totalPages, page + 1))
  }

  const createTask = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!token) return

    try {
      setCreateLoading(true)
      setCreateError('')

      const isEditMode = taskMode === 'edit' && editingTaskId !== null
      const response = await fetch(
        isEditMode ? `${API_BASE_URL}/tasks/${editingTaskId}` : `${API_BASE_URL}/tasks`,
        {
          method: isEditMode ? 'PUT' : 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: form.title.trim(),
            description: form.description.trim() || null,
            status: form.status,
            priority: form.priority,
            dueDate: form.dueDate || null,
          }),
        },
      )

      if (!response.ok) {
        throw new Error(await readResponseError(response, isEditMode ? 'Failed to update task' : 'Failed to create task'))
      }

      const data = (await response.json()) as { task?: TaskRow }

      if (data.task) {
        setTasks((current) =>
          isEditMode
            ? current.map((task) => (task.id === data.task?.id ? (data.task as TaskRow) : task))
            : [data.task as TaskRow, ...current],
        )
      } else {
        await refreshTasks()
      }

      closeCreateModal()
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create task')
    } finally {
      setCreateLoading(false)
    }
  }

  return (
    <main className="task-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">✓</span>
          <span>Taskify</span>
        </div>

        <nav className="topnav" aria-label="Primary">
          <button className="topnav-link active" type="button">
            <span className="nav-icon">▣</span>
            Tasks
          </button>
        </nav>

        <button className="profile" type="button" onClick={handleLogout}>
          <span className="avatar">👤</span>
          <span>Test</span>
          <span className="caret">⌄</span>
        </button>
      </header>
              <div className="page-info">
                Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
              </div>
      <section className="board-layout">
        <div className="board-main">
          <div className="hero-row">
            <div>
              <p className="greeting">Hello, Test 👋</p>
              <p className="subcopy">Here&apos;s what&apos;s happening with your tasks today.</p>
            </div>

            <button className="add-task" type="button" onClick={openCreateModal}>
              <span>＋</span> Add Task
            </button>
          </div>

          <div className="filters-row">
            <div className="filter-chips" role="tablist" aria-label="Task filters">
              <button className={`chip ${activeFilter === 'All' ? 'active' : ''}`} type="button" onClick={() => setActiveFilter('All')}>
                All
              </button>
              <button
                className={`chip ${activeFilter === 'Pending' ? 'active' : ''}`}
                type="button"
                onClick={() => setActiveFilter('Pending')}
              >
                Pending
              </button>
              <button
                className={`chip ${activeFilter === 'In Progress' ? 'active' : ''}`}
                type="button"
                onClick={() => setActiveFilter('In Progress')}
              >
                In Progress
              </button>
              <button
                className={`chip ${activeFilter === 'Completed' ? 'active' : ''}`}
                type="button"
                onClick={() => setActiveFilter('Completed')}
              >
                Completed
              </button>
            </div>

            <button
              className="sort-btn"
              type="button"
              onClick={() =>
                setSortMode((current) =>
                  current === 'dueDate' ? 'priority' : current === 'priority' ? 'status' : 'dueDate',
                )
              }
            >
              Sort by: {sortMode === 'dueDate' ? 'Due Date' : sortMode === 'priority' ? 'Priority' : 'Status'}
              <span>⌄</span>
            </button>
          </div>

          <div className="task-list">
            {loading ? <p className="end-copy">Loading tasks...</p> : null}
            {error ? <p className="error-banner">{error}</p> : null}

            {!loading && !error && paginatedTasks.length === 0 ? (
              <p className="end-copy">No tasks found</p>
            ) : null}

            {paginatedTasks.map((task) => (
              <article key={task.id} className={`task-row ${task.status === 'Completed' ? 'done' : ''}`}>
                <button
                  className={`check ${task.status === 'Completed' ? 'checked' : ''}`}
                  type="button"
                  aria-label={`Mark ${task.title} complete`}
                  onClick={() => {
                    if (task.status !== 'Completed') {
                      void markComplete(task.id)
                    }
                  }}
                />

                <div className="task-content">
                  <h3>{task.title}</h3>
                  {task.description ? <p className="task-category">{task.description}</p> : null}
                </div>

                <div className={`priority priority-${task.priority.toLowerCase()}`}>{task.priority}</div>

                <div className="due-date">
                  <span className="calendar">▦</span>
                  {formatDueDate(task.dueDate)}
                </div>

                <div className="task-actions">
                  <button
                    className="edit-btn"
                    type="button"
                    aria-label={`Edit ${task.title}`}
                    onClick={() => openEditModal(task)}
                  >
                    ✎
                  </button>
                  <button
                    className="more-btn"
                    type="button"
                    aria-label={`Delete ${task.title}`}
                    onClick={() => void deleteTask(task.id)}
                  >
                    🗑
                  </button>
                </div>
              </article>
            ))}
          </div>

          {sortedTasks.length > 0 ? (
            <div className="pagination-bar">
              <button className="page-btn" type="button" onClick={goToPreviousPage} disabled={currentPage === 1}>
                Previous
              </button>

              <div className="page-info">
                Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
              </div>

              <button className="page-btn" type="button" onClick={goToNextPage} disabled={currentPage === totalPages}>
                Next
              </button>
            </div>
          ) : null}

          <p className="end-copy">You&apos;ve reached the end</p>
        </div>

        <aside className="board-side">
          <section className="panel overview-panel">
            <h2>Task Overview</h2>
            <div className="donut-wrap">
              <div className="donut">
                <div className="donut-center">
                  <strong>{tasks.length}</strong>
                  <span>Total</span>
                </div>
              </div>

              <ul className="legend">
                {overview.map((item) => (
                  <li key={item.label}>
                    <span className={`legend-dot ${item.tone}`} />
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="panel upcoming-panel">
            <div className="panel-head">
              <h2>Upcoming Tasks</h2>
              <button type="button" className="view-all">
                View all
              </button>
            </div>

            <div className="upcoming-list">
              {sortedTasks.slice(0, 4).map((task) => (
                <article key={task.id} className="upcoming-item">
                  <div>
                    <div className="upcoming-title">
                      <span className={`upcoming-dot ${task.priority.toLowerCase()}`} />
                      {task.title}
                    </div>
                    <p>{formatDueDate(task.dueDate)}</p>
                  </div>
                  <span className={`priority priority-${task.priority.toLowerCase()}`}>{task.priority}</span>
                </article>
              ))}
            </div>
          </section>
        </aside>
      </section>

      {isCreateOpen ? (
        <div className="modal-backdrop" role="presentation" onClick={closeCreateModal}>
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-task-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-head">
              <div>
                <p className="modal-eyebrow">Task</p>
                <h2 id="create-task-title">{taskMode === 'edit' ? 'Edit task' : 'Create task'}</h2>
              </div>
              <button className="close-btn" type="button" onClick={closeCreateModal}>
                ×
              </button>
            </div>

            <form className="modal-form" onSubmit={createTask}>
              <label className="modal-field">
                <span>Title</span>
                <input
                  value={form.title}
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Enter task title"
                  required
                />
              </label>

              <label className="modal-field">
                <span>Description</span>
                <textarea
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  placeholder="Add a short description"
                  rows={4}
                />
              </label>

              <div className="modal-grid">
                <label className="modal-field">
                  <span>Status</span>
                  <select
                    value={form.status}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, status: event.target.value as TaskStatus }))
                    }
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </label>

                <label className="modal-field">
                  <span>Priority</span>
                  <select
                    value={form.priority}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, priority: event.target.value as TaskPriority }))
                    }
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </label>
              </div>

              <label className="modal-field">
                <span>Due date</span>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))}
                />
              </label>

              {createError ? <p className="error-banner">{createError}</p> : null}

              <div className="modal-actions">
                <button className="cancel-btn" type="button" onClick={closeCreateModal}>
                  Cancel
                </button>
                <button className="save-btn" type="submit" disabled={createLoading}>
                  {createLoading ? 'Saving...' : taskMode === 'edit' ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </main>
  )
}

export default Dashboard
