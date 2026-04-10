import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ajax as axios } from '../api/ajax'
import { Bike, LogIn } from 'lucide-react'

export default function Login() {
  // ★ key 이름은 반드시 백엔드 UserLoginReqDto 필드명과 일치해야 함
  //   userId(X) → loginId(O)
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
      // React Router의 상태 머신(스케줄러)을 우회하고 즉시 페이지 전환
      // replace: 히스토리 스택에 Login을 남기지 않아 뒤로가기 방지
      window.location.replace('/')
      // 성공 시 setLoading(false) 불필요 — 컴포넌트가 즉시 파괴됨
    } catch (err: any) {
      setError(err.response?.data?.message || '아이디 또는 비밀번호를 확인해주세요.')
      setLoading(false)  // 실패 경로에서만 로딩 해제
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4">
      {/* Brand */}
      <Link to="/" className="flex items-center gap-2 mb-8 group">
        <div className="bg-emerald-500 p-2 rounded-xl group-hover:bg-emerald-600 transition-colors">
          <Bike className="text-white w-6 h-6" />
        </div>
        <span className="text-lg font-bold text-slate-800">따릉이 대시보드</span>
      </Link>

      <div className="w-full max-w-sm bg-white rounded-2xl ring-1 ring-slate-200 shadow-sm p-8">
        <h2 className="text-xl font-bold text-slate-900 mb-1">로그인</h2>
        <p className="text-sm text-slate-500 mb-6">계정에 로그인하여 대시보드를 이용하세요.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">아이디</label>
            <input
              type="text"
              name="loginId"
              value={form.loginId}
              onChange={handleChange}
              placeholder="아이디를 입력하세요"
              required
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">비밀번호</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="비밀번호를 입력하세요"
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
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          계정이 없으신가요?{' '}
          <Link to="/signup" className="font-semibold text-emerald-600 hover:underline">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  )
}
