import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ajax as axios } from '../api/ajax'
import { useTranslation } from 'react-i18next'
import { Bike, LogIn } from 'lucide-react'

export default function Login() {
  const { t } = useTranslation()
  const [form, setForm] = useState({ loginId: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await axios.post('/bike/users/login', form)
      localStorage.setItem('token', data.token)
      localStorage.setItem('userId', String(data.userId))
      // replace: 히스토리 스택에 Login을 남기지 않아 뒤로가기 방지
      window.location.replace('/')
    } catch (err: any) {
      setError(err.response?.data?.message || t('auth.login.errorDefault'))
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4">
      {/* Brand */}
      <Link to="/" className="flex items-center gap-2 mb-8 group">
        <div className="bg-emerald-500 p-2 rounded-xl group-hover:bg-emerald-600 transition-colors">
          <Bike className="text-white w-6 h-6" />
        </div>
        <span className="text-lg font-bold text-slate-800">{t('auth.brand')}</span>
      </Link>

      <div className="w-full max-w-sm bg-white rounded-2xl ring-1 ring-slate-200 shadow-sm p-8">
        <h2 className="text-xl font-bold text-slate-900 mb-1">{t('auth.login.title')}</h2>
        <p className="text-sm text-slate-500 mb-6">{t('auth.login.subtitle')}</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {t('auth.fields.id')}
            </label>
            <input
              type="text"
              name="loginId"
              value={form.loginId}
              onChange={handleChange}
              placeholder={t('auth.fields.idPlaceholder')}
              required
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {t('auth.fields.password')}
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder={t('auth.fields.passwordPlaceholder')}
              required
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
            />
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
            <LogIn className="w-4 h-4" />
            {loading ? t('auth.login.submitting') : t('auth.login.submit')}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          {t('auth.login.noAccount')}{' '}
          <Link to="/signup" className="font-semibold text-emerald-600 hover:underline">
            {t('auth.login.signupLink')}
          </Link>
        </p>
      </div>
    </div>
  )
}
