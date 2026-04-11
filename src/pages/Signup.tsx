import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ajax as axios } from '../api/ajax'
import { useTranslation } from 'react-i18next'
import { Bike, UserPlus } from 'lucide-react'

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
  const { t } = useTranslation()
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
      await axios.post('http://localhost:8080/bike/users/signup', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      alert(t('auth.signup.success'))
      navigate('/login')
    } catch (err: any) {
      setError(err.response?.data || t('auth.signup.errorDefault'))
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
        <span className="text-lg font-bold text-slate-800">{t('auth.brand')}</span>
      </Link>

      <div className="w-full max-w-md bg-white rounded-2xl ring-1 ring-slate-200 shadow-sm p-8">
        <h2 className="text-xl font-bold text-slate-900 mb-1">{t('auth.signup.title')}</h2>
        <p className="text-sm text-slate-500 mb-6">{t('auth.signup.subtitle')}</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field
            label={t('auth.fields.id')}
            name="loginId"
            value={form.loginId}
            onChange={handleChange}
            required
          />
          <Field
            label={t('auth.fields.password')}
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            required
          />
          <Field
            label={t('auth.fields.name')}
            name="name"
            value={form.name}
            onChange={handleChange}
            required
          />
          <Field
            label={t('auth.fields.email')}
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
          />
          <Field
            label={t('auth.fields.phone')}
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            placeholder={t('auth.fields.phonePlaceholder')}
            required
          />
          <Field
            label={t('auth.fields.birth')}
            name="birth"
            type="date"
            value={form.birth}
            onChange={handleChange}
            required
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {t('auth.fields.gender')}
            </label>
            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
              required
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all bg-white"
            >
              <option value="">{t('auth.fields.genderSelect')}</option>
              <option value="M">{t('auth.fields.genderMale')}</option>
              <option value="F">{t('auth.fields.genderFemale')}</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {t('auth.fields.profileImage')}
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-emerald-700 hover:file:bg-emerald-100"
            />
            {preview && (
              <img
                src={preview}
                alt={t('auth.fields.imagePreviewAlt')}
                className="mt-2 h-16 w-16 rounded-full object-cover ring-2 ring-emerald-200"
              />
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
            {loading ? t('auth.signup.submitting') : t('auth.signup.submit')}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          {t('auth.signup.hasAccount')}{' '}
          <Link to="/login" className="font-semibold text-emerald-600 hover:underline">
            {t('auth.signup.loginLink')}
          </Link>
        </p>
      </div>
    </div>
  )
}
