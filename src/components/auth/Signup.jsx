import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'

const INITIAL = {
  userId: '',
  password: '',
  name: '',
  email: '',
  phone: '',
  birthDate: '',
  gender: '',
}

export default function Signup() {
  const navigate = useNavigate()
  const [form, setForm] = useState(INITIAL)
  const [profileImage, setProfileImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setProfileImage(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData()
    Object.entries(form).forEach(([key, val]) => formData.append(key, val))
    if (profileImage) formData.append('profileImage', profileImage)

    try {
      await axios.post('/bike/users/signup', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      alert('회원가입이 완료되었습니다!')
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.message || '회원가입 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>회원가입</h2>

        <form onSubmit={handleSubmit} style={styles.form}>
          <Field label="아이디" name="userId" value={form.userId} onChange={handleChange} required />
          <Field label="비밀번호" name="password" type="password" value={form.password} onChange={handleChange} required />
          <Field label="이름" name="name" value={form.name} onChange={handleChange} required />
          <Field label="이메일" name="email" type="email" value={form.email} onChange={handleChange} required />
          <Field label="연락처" name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="010-0000-0000" required />
          <Field label="생년월일" name="birthDate" type="date" value={form.birthDate} onChange={handleChange} required />

          <div style={styles.group}>
            <label style={styles.label}>성별</label>
            <select name="gender" value={form.gender} onChange={handleChange} style={styles.input} required>
              <option value="">선택</option>
              <option value="MALE">남성</option>
              <option value="FEMALE">여성</option>
            </select>
          </div>

          <div style={styles.group}>
            <label style={styles.label}>프로필 이미지</label>
            <input type="file" accept="image/*" onChange={handleImageChange} style={{ marginTop: '0.25rem' }} />
            {preview && (
              <img src={preview} alt="미리보기" style={styles.preview} />
            )}
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" style={styles.submitBtn} disabled={loading}>
            {loading ? '처리 중...' : '가입하기'}
          </button>
        </form>

        <p style={styles.footer}>
          이미 계정이 있으신가요? <Link to="/login">로그인</Link>
        </p>
      </div>
    </div>
  )
}

function Field({ label, name, type = 'text', value, onChange, placeholder, required }) {
  return (
    <div style={styles.group}>
      <label style={styles.label}>{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        style={styles.input}
      />
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
    padding: '2rem',
  },
  card: {
    background: '#fff',
    borderRadius: '8px',
    padding: '2rem',
    width: '100%',
    maxWidth: '480px',
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
    gap: '1rem',
  },
  group: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    fontSize: '0.85rem',
    color: '#555',
    marginBottom: '0.25rem',
    fontWeight: 600,
  },
  input: {
    padding: '0.6rem 0.8rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '0.95rem',
    outline: 'none',
  },
  preview: {
    marginTop: '0.5rem',
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid #e94560',
  },
  error: {
    color: '#e94560',
    fontSize: '0.85rem',
    textAlign: 'center',
  },
  submitBtn: {
    marginTop: '0.5rem',
    padding: '0.75rem',
    background: '#e94560',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    cursor: 'pointer',
    fontWeight: 700,
  },
  footer: {
    marginTop: '1rem',
    textAlign: 'center',
    fontSize: '0.9rem',
    color: '#666',
  },
}
