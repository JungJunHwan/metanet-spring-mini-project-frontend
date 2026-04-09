import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ userId: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data } = await axios.post('/bike/auth/login', form)
      localStorage.setItem('token', data.token)
      localStorage.setItem('userId', data.userId)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || '아이디 또는 비밀번호를 확인해주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>로그인</h2>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.group}>
            <label style={styles.label}>아이디</label>
            <input
              type="text"
              name="userId"
              value={form.userId}
              onChange={handleChange}
              placeholder="아이디를 입력하세요"
              required
              style={styles.input}
            />
          </div>

          <div style={styles.group}>
            <label style={styles.label}>비밀번호</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="비밀번호를 입력하세요"
              required
              style={styles.input}
            />
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" style={styles.submitBtn} disabled={loading}>
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <p style={styles.footer}>
          계정이 없으신가요? <Link to="/signup">회원가입</Link>
        </p>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: 'calc(100vh - 56px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f0f2f5',
  },
  card: {
    background: '#fff',
    borderRadius: '8px',
    padding: '2.5rem',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
  },
  title: {
    marginBottom: '1.5rem',
    textAlign: 'center',
    color: '#1a1a2e',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.2rem',
  },
  group: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    fontSize: '0.85rem',
    color: '#555',
    marginBottom: '0.3rem',
    fontWeight: 600,
  },
  input: {
    padding: '0.65rem 0.8rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '0.95rem',
    outline: 'none',
  },
  error: {
    color: '#e94560',
    fontSize: '0.85rem',
    textAlign: 'center',
    margin: 0,
  },
  submitBtn: {
    padding: '0.75rem',
    background: '#e94560',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    cursor: 'pointer',
    fontWeight: 700,
    marginTop: '0.5rem',
  },
  footer: {
    marginTop: '1.2rem',
    textAlign: 'center',
    fontSize: '0.9rem',
    color: '#666',
  },
}
