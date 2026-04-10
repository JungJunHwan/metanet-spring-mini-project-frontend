import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { LogIn, UserPlus, User, LogOut, Globe } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function AuthNav() {
  const navigate = useNavigate()
  const token = localStorage.getItem('token')
  const { t, i18n } = useTranslation()

  const handleLogout = () => {
    // ① 백엔드 응답 대기 없이 즉시 인증 정보 초기화 → 사용자 체감 속도 향상
    const savedToken = token
    localStorage.removeItem('token')
    localStorage.removeItem('userId')
    // axios 전역 헤더에 남아 있는 인증 토큰도 즉시 제거
    delete axios.defaults.headers.common['Authorization']
    navigate('/login')
    // ② 서버 세션 무효화는 백그라운드로 처리 (fire-and-forget)
    if (savedToken) {
      axios.post('/bike/auth/logout', {}, {
        headers: { Authorization: `Bearer ${savedToken}` },
      }).catch(() => {})
    }
  }

  const toggleLang = () => {
    i18n.changeLanguage(i18n.language === 'ko' ? 'en' : 'ko')
  }

  const LangToggle = (
    <button
      onClick={toggleLang}
      className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-500 shadow-sm transition-colors hover:border-emerald-300 hover:text-emerald-600"
      title="언어 전환 / Switch Language"
    >
      <Globe className="h-3.5 w-3.5" />
      {i18n.language === 'ko' ? 'EN' : 'KO'}
    </button>
  )

  if (token) {
    return (
      <div className="flex items-center gap-2">
        {LangToggle}
        <Link
          to="/mypage"
          className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm transition-colors hover:bg-emerald-50"
        >
          <User className="h-3.5 w-3.5" />
          {t('nav.mypage')}
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-600"
        >
          <LogOut className="h-3.5 w-3.5" />
          {t('nav.logout')}
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {LangToggle}
      <Link
        to="/login"
        className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm transition-colors hover:bg-emerald-50"
      >
        <LogIn className="h-3.5 w-3.5" />
        {t('nav.login')}
      </Link>
      <Link
        to="/signup"
        className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-600"
      >
        <UserPlus className="h-3.5 w-3.5" />
        {t('nav.signup')}
      </Link>
    </div>
  )
}
