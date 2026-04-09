import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

export default function NavBar() {
  const navigate = useNavigate()
  const token = localStorage.getItem('token')

  const handleLogout = async () => {
    try {
      await axios.post('/bike/auth/logout', {}, {
        headers: { Authorization: `Bearer ${token}` },
      })
    } catch {
      // 로그아웃 API 실패해도 로컬 정리 진행
    } finally {
      localStorage.removeItem('token')
      localStorage.removeItem('userId')
      navigate('/login')
    }
  }

  return (
    <nav style={styles.nav}>
      <Link to="/" style={styles.brand}>🚲 BikeApp</Link>
      <div style={styles.menu}>
        {token ? (
          <>
            <Link to="/mypage" style={styles.link}>마이페이지</Link>
            <button onClick={handleLogout} style={styles.btn}>로그아웃</button>
          </>
        ) : (
          <>
            <Link to="/login" style={styles.link}>로그인</Link>
            <Link to="/signup" style={styles.link}>회원가입</Link>
          </>
        )}
      </div>
    </nav>
  )
}

const styles = {
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.75rem 2rem',
    background: '#1a1a2e',
    color: '#fff',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  brand: {
    color: '#e94560',
    fontWeight: 700,
    fontSize: '1.3rem',
    textDecoration: 'none',
  },
  menu: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
  },
  link: {
    color: '#ccc',
    textDecoration: 'none',
    fontSize: '0.95rem',
  },
  btn: {
    background: '#e94560',
    color: '#fff',
    border: 'none',
    padding: '0.4rem 1rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.95rem',
  },
}
