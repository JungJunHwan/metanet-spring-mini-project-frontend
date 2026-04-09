import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import { Bike, UserPlus } from 'lucide-react'

// ★ key 이름은 반드시 백엔드 UserCreateReqDto 필드명과 일치해야 함
//   userId(X) → loginId(O),  birthDate(X) → birth(O)
const INITIAL = { loginId: '', password: '', name: '', email: '', phone: '', birth: '', gender: '' }

interface FieldProps {
  label: string
  name: string
  type?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  required?: boolean
}

function Field({ label, name, type = 'text', value, onChange, placeholder, required }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
      />
    </div>
  )
}

export default function Signup() {
  const navigate = useNavigate()
  const [form, setForm] = useState(INITIAL)
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setProfileImage(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const formData = new FormData()
    Object.entries(form).forEach(([k, v]) => formData.append(k, v))
    if (profileImage) formData.append('profileImage', profileImage)
    try {
      await axios.post('/bike/users/signup', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      alert('회원가입이 완료되었습니다!')
      navigate('/login')
    } catch (err: any) {
      setError(err.response?.data?.message || '회원가입 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4 py-12">
      {/* Brand */}
      <Link to="/" className="flex items-center gap-2 mb-8 group">
        <div className="bg-emerald-500 p-2 rounded-xl group-hover:bg-emerald-600 transition-colors">
          <Bike className="text-white w-6 h-6" />
        </div>
        <span className="text-lg font-bold text-slate-800">따릉이 대시보드</span>
      </Link>

      <div className="w-full max-w-md bg-white rounded-2xl ring-1 ring-slate-200 shadow-sm p-8">
        <h2 className="text-xl font-bold text-slate-900 mb-1">회원가입</h2>
        <p className="text-sm text-slate-500 mb-6">새 계정을 만들어 서비스를 이용하세요.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label="아이디" name="loginId" value={form.loginId} onChange={handleChange} required />
          <Field label="비밀번호" name="password" type="password" value={form.password} onChange={handleChange} required />
          <Field label="이름" name="name" value={form.name} onChange={handleChange} required />
          <Field label="이메일" name="email" type="email" value={form.email} onChange={handleChange} required />
          <Field label="연락처" name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="010-0000-0000" required />
          <Field label="생년월일" name="birth" type="date" value={form.birth} onChange={handleChange} required />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">성별</label>
            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
              required
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all bg-white"
            >
              <option value="">선택</option>
              <option value="M">남성</option>
              <option value="F">여성</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">프로필 이미지</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-emerald-700 hover:file:bg-emerald-100"
            />
            {preview && (
              <img src={preview} alt="미리보기" className="mt-2 h-16 w-16 rounded-full object-cover ring-2 ring-emerald-200" />
            )}
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-600 text-center">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600 disabled:opacity-60 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            {loading ? '처리 중...' : '가입하기'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          이미 계정이 있으신가요?{' '}
          <Link to="/login" className="font-semibold text-emerald-600 hover:underline">
            로그인
          </Link>
        </p>
      </div>
    </div>
  )
}
