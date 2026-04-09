import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import { Bike, User, Pencil, Trash2, LogOut, Save, X } from 'lucide-react'

interface UserInfo {
  userId: string
  name: string
  email: string
  phone: string
  birth: string        // 백엔드 UserResDto 필드명 그대로
  gender: string
  profileImage?: string | null
}

interface FormState {
  name: string
  email: string
  phone: string
  birth: string        // 백엔드 UserUpdateReqDto 필드명 그대로
  gender: string
  password: string
}

function resolveProfileImage(data: UserInfo['profileImage']): string | null {
  if (!data) return null
  // 백엔드가 "/bike/users/{id}/profile-image" URL 경로를 내려줄 때 → 그대로 src 로 사용
  if (typeof data === 'string' && (data.startsWith('/') || data.startsWith('http'))) return data
  // 이미 완성된 Data URI 인 경우
  if (typeof data === 'string' && data.startsWith('data:')) return data
  // raw base64 문자열인 경우
  if (typeof data === 'string') return `data:image/jpeg;base64,${data}`
  return null
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0">
      <span className="w-20 shrink-0 text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
      <span className="text-sm text-slate-800">{value || '—'}</span>
    </div>
  )
}

export default function MyPage() {
  const navigate = useNavigate()
  const token = localStorage.getItem('token')
  const userId = localStorage.getItem('userId')

  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState<FormState>({ name: '', email: '', phone: '', birth: '', gender: '', password: '' })
  const [newImage, setNewImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const authHeader = { Authorization: `Bearer ${token}` }

  const fetchUserInfo = useCallback(async () => {
    if (!token || !userId) { navigate('/login'); return }
    try {
      const { data } = await axios.get<UserInfo>(`/bike/users/${userId}`, { headers: authHeader })
      setUserInfo(data)
      setForm({ name: data.name ?? '', email: data.email ?? '', phone: data.phone ?? '', birth: data.birth ?? '', gender: data.gender ?? '', password: '' })
    } catch {
      setError('사용자 정보를 불러오는 데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }, [userId, token]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchUserInfo() }, [fetchUserInfo])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setNewImage(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true); setError('')
    const formData = new FormData()
    Object.entries(form).forEach(([k, v]) => { if (v) formData.append(k, v) })
    if (newImage) formData.append('profileImage', newImage)
    try {
      await axios.patch(`/bike/users/${userId}`, formData, {
        headers: { ...authHeader, 'Content-Type': 'multipart/form-data' },
      })
      alert('정보가 수정되었습니다.')
      setEditMode(false); setNewImage(null); setImagePreview(null)
      await fetchUserInfo()
    } catch (err: any) {
      setError(err.response?.data?.message || '정보 수정 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    try { await axios.post('/bike/auth/logout', {}, { headers: authHeader }) } catch {}
    localStorage.removeItem('token'); localStorage.removeItem('userId')
    navigate('/login')
  }

  const handleWithdraw = async () => {
    if (!window.confirm('정말로 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return
    try {
      await axios.delete(`/bike/users/${userId}`, { headers: authHeader })
      alert('회원 탈퇴가 완료되었습니다.')
      localStorage.removeItem('token'); localStorage.removeItem('userId')
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.message || '회원 탈퇴 중 오류가 발생했습니다.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <p className="text-slate-500 text-sm">불러오는 중...</p>
      </div>
    )
  }

  const profileSrc = imagePreview ?? resolveProfileImage(userInfo?.profileImage)

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center p-4 py-12">
      {/* Brand */}
      <Link to="/" className="flex items-center gap-2 mb-8 group self-start md:self-center">
        <div className="bg-emerald-500 p-2 rounded-xl group-hover:bg-emerald-600 transition-colors">
          <Bike className="text-white w-6 h-6" />
        </div>
        <span className="text-lg font-bold text-slate-800">따릉이 대시보드</span>
      </Link>

      <div className="w-full max-w-md bg-white rounded-2xl ring-1 ring-slate-200 shadow-sm p-8">
        {/* Profile Header */}
        <div className="flex items-center gap-4 pb-6 mb-6 border-b border-slate-100">
          {profileSrc ? (
            <img src={profileSrc} alt="프로필" className="h-16 w-16 rounded-full object-cover ring-2 ring-emerald-200 shrink-0" />
          ) : (
            <div className="h-16 w-16 rounded-full bg-emerald-500 flex items-center justify-center ring-2 ring-emerald-200 shrink-0">
              <User className="h-8 w-8 text-white" />
            </div>
          )}
          <div>
            <h2 className="text-lg font-bold text-slate-900">{userInfo?.name}</h2>
            <p className="text-sm text-slate-500">@{userInfo?.userId}</p>
          </div>
        </div>

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-600 text-center">{error}</p>
        )}

        {!editMode ? (
          <>
            <div className="mb-6">
              <InfoRow label="이메일" value={userInfo?.email} />
              <InfoRow label="연락처" value={userInfo?.phone} />
              <InfoRow label="생년월일" value={userInfo?.birth ? new Date(userInfo.birth).toLocaleDateString('ko-KR') : undefined} />
              <InfoRow label="성별" value={userInfo?.gender === 'M' ? '남성' : userInfo?.gender === 'F' ? '여성' : undefined} />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setEditMode(true)}
                className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" /> 정보 수정
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" /> 로그아웃
              </button>
              <button
                onClick={handleWithdraw}
                className="ml-auto flex items-center gap-1.5 rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" /> 회원 탈퇴
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleUpdate} className="flex flex-col gap-4">
            {[
              { label: '이름', name: 'name', type: 'text' },
              { label: '이메일', name: 'email', type: 'email' },
              { label: '연락처', name: 'phone', type: 'tel' },
              { label: '생년월일', name: 'birth', type: 'date' },
            ].map(({ label, name, type }) => (
              <div key={name} className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</label>
                <input
                  type={type}
                  name={name}
                  value={(form as any)[name]}
                  onChange={handleChange}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
                />
              </div>
            ))}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">성별</label>
              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 bg-white"
              >
                <option value="">선택</option>
                <option value="M">남성</option>
                <option value="F">여성</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">새 비밀번호 (변경 시에만)</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">프로필 이미지 변경</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-emerald-700 hover:file:bg-emerald-100"
              />
              {imagePreview && (
                <img src={imagePreview} alt="미리보기" className="mt-2 h-14 w-14 rounded-full object-cover ring-2 ring-emerald-200" />
              )}
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-600 text-center">{error}</p>
            )}

            <div className="flex gap-2 mt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-600 disabled:opacity-60 transition-colors"
              >
                <Save className="h-3.5 w-3.5" />
                {saving ? '저장 중...' : '저장'}
              </button>
              <button
                type="button"
                onClick={() => { setEditMode(false); setImagePreview(null); setNewImage(null) }}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <X className="h-3.5 w-3.5" /> 취소
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
