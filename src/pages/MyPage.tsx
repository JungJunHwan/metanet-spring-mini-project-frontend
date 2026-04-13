import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ajax as axios } from '../api/ajax'
import { useTranslation } from 'react-i18next'
import { Bike, User, Pencil, Trash2, LogOut, Save, X } from 'lucide-react'

interface UserInfo {
  userId: string
  name: string
  email: string
  phone: string
  birth: string
  gender: string
  profileImage?: string | null
}

interface FormState {
  name: string
  email: string
  phone: string
  birth: string
  gender: string
  password: string
}

function resolveProfileImage(data: UserInfo['profileImage']): string | null {
  if (!data) return null
  if (typeof data === 'string' && (data.startsWith('/') || data.startsWith('http'))) return data
  if (typeof data === 'string' && data.startsWith('data:')) return data
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

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0">
      <div className="w-20 h-3 bg-slate-100 rounded animate-pulse shrink-0" />
      <div className="h-3 bg-slate-100 rounded animate-pulse w-36" />
    </div>
  )
}

export default function MyPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const token = localStorage.getItem('token')
  const userId = localStorage.getItem('userId')

  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState<FormState>({ name: '', email: '', phone: '', birth: '', gender: '', password: '' })
  const [newImage, setNewImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fetchUserInfo = useCallback(async (signal?: AbortSignal) => {
    if (!token || !userId) { navigate('/login'); return }
    try {
      const { data } = await axios.get<UserInfo>(`/bike/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal,
      })
      if (!mountedRef.current) return
      setUserInfo(data)
      setForm({
        name: data.name ?? '',
        email: data.email ?? '',
        phone: data.phone ?? '',
        birth: data.birth ? new Date(data.birth).toISOString().split('T')[0] : '',
        gender: data.gender ?? '',
        password: '',
      })
    } catch (err: unknown) {
      if ((err as any)?.code === 'ERR_CANCELED') return
      if (mountedRef.current) setError(t('auth.mypage.loadError'))
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [userId, token, navigate, t])

  useEffect(() => {
    const controller = new AbortController()
    fetchUserInfo(controller.signal)
    return () => { controller.abort() }
  }, [fetchUserInfo])

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
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      })
      alert(t('auth.mypage.updateSuccess'))
      setEditMode(false); setNewImage(null); setImagePreview(null)
      await fetchUserInfo()
    } catch (err: any) {
      setError(err.response?.data?.message || t('auth.mypage.updateError'))
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    const savedToken = token
    localStorage.removeItem('token')
    localStorage.removeItem('userId')
    navigate('/login')
    if (savedToken) {
      axios.post('/bike/auth/logout', {}, {
        headers: { Authorization: `Bearer ${savedToken}` },
      }).catch(() => {})
    }
  }

  const handleWithdraw = async () => {
    if (!window.confirm(t('auth.mypage.withdrawConfirm'))) return
    try {
      await axios.delete(`/bike/users/${userId}`, { headers: { Authorization: `Bearer ${token}` } })
      alert(t('auth.mypage.withdrawSuccess'))
      localStorage.removeItem('token'); localStorage.removeItem('userId')
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.message || t('auth.mypage.withdrawError'))
    }
  }

  const profileSrc = imagePreview ?? resolveProfileImage(userInfo?.profileImage)

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center p-4 py-12">
      {/* Brand */}
      <Link to="/" className="flex items-center gap-2 mb-8 group self-start md:self-center">
        <div className="bg-emerald-500 p-2 rounded-xl group-hover:bg-emerald-600 transition-colors">
          <Bike className="text-white w-6 h-6" />
        </div>
        <span className="text-lg font-bold text-slate-800">{t('auth.brand')}</span>
      </Link>

      <div className="w-full max-w-md bg-white rounded-2xl ring-1 ring-slate-200 shadow-sm p-8">

        {/* Profile Header */}
        <div className="flex items-center gap-4 pb-6 mb-6 border-b border-slate-100">
          {loading ? (
            <div className="h-16 w-16 rounded-full bg-slate-100 animate-pulse shrink-0" />
          ) : profileSrc ? (
            <img src={profileSrc} alt={t('auth.fields.imagePreviewAlt')} className="h-16 w-16 rounded-full object-cover ring-2 ring-emerald-200 shrink-0" />
          ) : (
            <div className="h-16 w-16 rounded-full bg-emerald-500 flex items-center justify-center ring-2 ring-emerald-200 shrink-0">
              <User className="h-8 w-8 text-white" />
            </div>
          )}

          <div className="flex flex-col gap-1.5 min-w-0">
            {loading ? (
              <>
                <div className="h-4 w-28 bg-slate-100 rounded animate-pulse" />
                <div className="h-3 w-20 bg-slate-100 rounded animate-pulse" />
              </>
            ) : (
              <>
                <h2 className="text-lg font-bold text-slate-900">{userInfo?.name}</h2>
                <p className="text-sm text-slate-500">@{userInfo?.userId}</p>
              </>
            )}
          </div>
        </div>

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-600 text-center">{error}</p>
        )}

        {loading ? (
          <div className="mb-6">
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
        ) : !editMode ? (
          <>
            <div className="mb-6">
              <InfoRow label={t('auth.fields.email')} value={userInfo?.email} />
              <InfoRow label={t('auth.fields.phone')} value={userInfo?.phone} />
              <InfoRow
                label={t('auth.fields.birth')}
                value={userInfo?.birth ? new Date(userInfo.birth).toLocaleDateString('ko-KR') : undefined}
              />
              <InfoRow
                label={t('auth.fields.gender')}
                value={
                  userInfo?.gender === 'M'
                    ? t('auth.fields.genderMale')
                    : userInfo?.gender === 'F'
                    ? t('auth.fields.genderFemale')
                    : undefined
                }
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setEditMode(true)}
                className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" /> {t('auth.mypage.editButton')}
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" /> {t('auth.mypage.logout')}
              </button>
              <button
                onClick={handleWithdraw}
                className="ml-auto flex items-center gap-1.5 rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" /> {t('auth.mypage.withdraw')}
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleUpdate} className="flex flex-col gap-4">
            {([
              { labelKey: 'auth.fields.name',  name: 'name',  type: 'text'  },
              { labelKey: 'auth.fields.email', name: 'email', type: 'email' },
              { labelKey: 'auth.fields.phone', name: 'phone', type: 'tel'   },
              { labelKey: 'auth.fields.birth', name: 'birth', type: 'date'  },
            ] as const).map(({ labelKey, name, type }) => (
              <div key={name} className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {t(labelKey)}
                </label>
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
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {t('auth.fields.gender')}
              </label>
              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 bg-white"
              >
                <option value="">{t('auth.fields.genderSelect')}</option>
                <option value="M">{t('auth.fields.genderMale')}</option>
                <option value="F">{t('auth.fields.genderFemale')}</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {t('auth.fields.newPassword')}
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {t('auth.fields.profileImageChange')}
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-emerald-700 hover:file:bg-emerald-100"
              />
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt={t('auth.fields.imagePreviewAlt')}
                  className="mt-2 h-14 w-14 rounded-full object-cover ring-2 ring-emerald-200"
                />
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
                {saving ? t('auth.mypage.saving') : t('auth.mypage.save')}
              </button>
              <button
                type="button"
                onClick={() => { setEditMode(false); setImagePreview(null); setNewImage(null) }}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <X className="h-3.5 w-3.5" /> {t('auth.mypage.cancel')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
