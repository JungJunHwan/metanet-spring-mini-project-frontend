import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

export default function MyPage() {
  const navigate = useNavigate()
  const token = localStorage.getItem('token')
  const userId = localStorage.getItem('userId')

  const [userInfo, setUserInfo] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState({})
  const [newImage, setNewImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const authHeader = { Authorization: `Bearer ${token}` }

  const fetchUserInfo = useCallback(async () => {
    if (!token || !userId) {
      navigate('/login')
      return
    }
    try {
      const { data } = await axios.get(`/bike/users/${userId}`, { headers: authHeader })
      setUserInfo(data)
      setForm({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        birthDate: data.birthDate || '',
        gender: data.gender || '',
        password: '',
      })
    } catch {
      setError('사용자 정보를 불러오는 데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }, [userId, token]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchUserInfo()
  }, [fetchUserInfo])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setNewImage(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    const formData = new FormData()
    Object.entries(form).forEach(([key, val]) => {
      if (val) formData.append(key, val)
    })
    if (newImage) formData.append('profileImage', newImage)

    try {
      await axios.patch(`/bike/users/${userId}`, formData, {
        headers: { ...authHeader, 'Content-Type': 'multipart/form-data' },
      })
      alert('정보가 수정되었습니다.')
      setEditMode(false)
      setNewImage(null)
      setImagePreview(null)
      await fetchUserInfo()
    } catch (err) {
      setError(err.response?.data?.message || '정보 수정 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    try {
      await axios.post('/bike/auth/logout', {}, { headers: authHeader })
    } catch {
      // 실패해도 로컬 정리
    } finally {
      localStorage.removeItem('token')
      localStorage.removeItem('userId')
      navigate('/login')
    }
  }

  const handleWithdraw = async () => {
    if (!window.confirm('정말로 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return

    try {
      await axios.delete(`/bike/users/${userId}`, { headers: authHeader })
      alert('회원 탈퇴가 완료되었습니다.')
      localStorage.removeItem('token')
      localStorage.removeItem('userId')
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || '회원 탈퇴 중 오류가 발생했습니다.')
    }
  }

  // Base64 문자열 또는 byte 배열 → data URI 변환
  const resolveProfileImage = (data) => {
    if (!data) return null
    // 이미 data URI면 그대로 반환
    if (typeof data === 'string' && data.startsWith('data:')) return data
    // 순수 Base64 문자열
    if (typeof data === 'string') return `data:image/jpeg;base64,${data}`
    // byte 배열(숫자 배열)
    if (Array.isArray(data)) {
      const bytes = new Uint8Array(data)
      const binary = bytes.reduce((acc, b) => acc + String.fromCharCode(b), '')
      return `data:image/jpeg;base64,${btoa(binary)}`
    }
    return null
  }

  if (loading) return <p style={{ textAlign: 'center', marginTop: '3rem' }}>불러오는 중...</p>

  const profileSrc = imagePreview || resolveProfileImage(userInfo?.profileImage)

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.avatarWrap}>
            {profileSrc ? (
              <img src={profileSrc} alt="프로필" style={styles.avatar} />
            ) : (
              <div style={styles.avatarPlaceholder}>
                {userInfo?.name?.[0] ?? '?'}
              </div>
            )}
          </div>
          <div>
            <h2 style={styles.userName}>{userInfo?.name}</h2>
            <p style={styles.userId}>@{userInfo?.userId}</p>
          </div>
        </div>

        {error && <p style={styles.error}>{error}</p>}

        {!editMode ? (
          <div style={styles.infoSection}>
            <InfoRow label="이메일" value={userInfo?.email} />
            <InfoRow label="연락처" value={userInfo?.phone} />
            <InfoRow label="생년월일" value={userInfo?.birthDate} />
            <InfoRow label="성별" value={userInfo?.gender === 'MALE' ? '남성' : userInfo?.gender === 'FEMALE' ? '여성' : '-'} />

            <div style={styles.btnGroup}>
              <button onClick={() => setEditMode(true)} style={styles.editBtn}>정보 수정</button>
              <button onClick={handleLogout} style={styles.logoutBtn}>로그아웃</button>
              <button onClick={handleWithdraw} style={styles.withdrawBtn}>회원 탈퇴</button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleUpdate} style={styles.form}>
            <FormField label="이름" name="name" value={form.name} onChange={handleChange} />
            <FormField label="이메일" name="email" type="email" value={form.email} onChange={handleChange} />
            <FormField label="연락처" name="phone" type="tel" value={form.phone} onChange={handleChange} />
            <FormField label="생년월일" name="birthDate" type="date" value={form.birthDate} onChange={handleChange} />

            <div style={styles.group}>
              <label style={styles.label}>성별</label>
              <select name="gender" value={form.gender} onChange={handleChange} style={styles.input}>
                <option value="">선택</option>
                <option value="MALE">남성</option>
                <option value="FEMALE">여성</option>
              </select>
            </div>

            <FormField label="새 비밀번호 (변경 시에만 입력)" name="password" type="password" value={form.password} onChange={handleChange} />

            <div style={styles.group}>
              <label style={styles.label}>프로필 이미지 변경</label>
              <input type="file" accept="image/*" onChange={handleImageChange} />
              {imagePreview && (
                <img src={imagePreview} alt="미리보기" style={styles.previewThumb} />
              )}
            </div>

            {error && <p style={styles.error}>{error}</p>}

            <div style={styles.btnGroup}>
              <button type="submit" style={styles.editBtn} disabled={saving}>
                {saving ? '저장 중...' : '저장'}
              </button>
              <button
                type="button"
                onClick={() => { setEditMode(false); setImagePreview(null); setNewImage(null) }}
                style={styles.logoutBtn}
              >
                취소
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', padding: '0.6rem 0', borderBottom: '1px solid #f0f0f0' }}>
      <span style={{ width: '90px', color: '#888', fontSize: '0.85rem', fontWeight: 600 }}>{label}</span>
      <span style={{ color: '#222', fontSize: '0.95rem' }}>{value || '-'}</span>
    </div>
  )
}

function FormField({ label, name, type = 'text', value, onChange }) {
  return (
    <div style={styles.group}>
      <label style={styles.label}>{label}</label>
      <input type={type} name={name} value={value} onChange={onChange} style={styles.input} />
    </div>
  )
}

const styles = {
  page: {
    minHeight: 'calc(100vh - 56px)',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    background: '#f0f2f5',
    padding: '2rem',
  },
  card: {
    background: '#fff',
    borderRadius: '8px',
    padding: '2rem',
    width: '100%',
    maxWidth: '520px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.2rem',
    marginBottom: '1.5rem',
    paddingBottom: '1rem',
    borderBottom: '1px solid #eee',
  },
  avatarWrap: { flexShrink: 0 },
  avatar: {
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid #e94560',
  },
  avatarPlaceholder: {
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    background: '#e94560',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.8rem',
    fontWeight: 700,
  },
  userName: { margin: 0, color: '#1a1a2e' },
  userId: { margin: '0.2rem 0 0', color: '#888', fontSize: '0.9rem' },
  infoSection: { display: 'flex', flexDirection: 'column' },
  form: { display: 'flex', flexDirection: 'column', gap: '0.9rem' },
  group: { display: 'flex', flexDirection: 'column' },
  label: { fontSize: '0.82rem', color: '#555', fontWeight: 600, marginBottom: '0.25rem' },
  input: { padding: '0.6rem 0.8rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.95rem' },
  previewThumb: {
    marginTop: '0.5rem',
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid #e94560',
  },
  btnGroup: {
    display: 'flex',
    gap: '0.75rem',
    marginTop: '1.5rem',
    flexWrap: 'wrap',
  },
  editBtn: {
    padding: '0.6rem 1.2rem',
    background: '#1a1a2e',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 600,
  },
  logoutBtn: {
    padding: '0.6rem 1.2rem',
    background: '#888',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 600,
  },
  withdrawBtn: {
    padding: '0.6rem 1.2rem',
    background: '#e94560',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 600,
    marginLeft: 'auto',
  },
  error: { color: '#e94560', fontSize: '0.85rem', textAlign: 'center' },
}
