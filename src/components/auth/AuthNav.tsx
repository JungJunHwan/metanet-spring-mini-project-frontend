import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ajax as axios } from '../../api/ajax'
import { LogIn, UserPlus, User, LogOut, Globe, Users } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useTranslation } from 'react-i18next'

export function AuthNav() {
  const navigate = useNavigate()
  const token = localStorage.getItem('token')
  const { t, i18n } = useTranslation()
  const [userCount, setUserCount] = useState<number>(0)
  const [ping, setPing] = useState(0)

  useEffect(() => {
    // SSE 연결 (vite proxy를 통해 /sse/connect로 요청)
    const eventSource = new EventSource('/sse/connect')

    eventSource.addEventListener('userCount', (event) => {
      const count = parseInt(event.data)
      if (!isNaN(count)) {
        setUserCount(count)
        setPing(p => p + 1) // 알림 수신 시마다 애니메이션 트리거
      }
    })

    eventSource.onerror = (error) => {
      console.error('SSE Error:', error)
      // 서버 재시작 등으로 인한 일시적 단절 시 브라우저 내장 자동 재연결 기능이 동작하도록 close()를 제거합니다.
    }

    return () => {
      eventSource.close()
    }
  }, [])

  const handleLogout = () => {
    // ① 백엔드 응답 대기 없이 즉시 인증 정보 초기화 → 사용자 체감 속도 향상
    const savedToken = token
    localStorage.removeItem('token')
    localStorage.removeItem('userId')
    // Custom AJAX 유틸리티는 동적으로 localStorage를 사용하므로 defaults 삭제 불필요
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
    <div className="flex items-center gap-2">
      <motion.div 
        key={ping}
        initial={{ scale: 1, backgroundColor: '#ffffff' }}
        animate={{ 
          scale: [1, 1.1, 1],
          backgroundColor: ['#ffffff', '#ecfdf5', '#ffffff'],
          borderColor: ['#e2e8f0', '#10b981', '#e2e8f0']
        }}
        transition={{ duration: 0.5 }}
        className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold text-emerald-600 shadow-sm"
        title={t('nav.activeUsers', { count: userCount })}
      >
        <Users className="h-3.5 w-3.5" />
        <span>{userCount}</span>
      </motion.div>
      <button
        onClick={toggleLang}
        className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-500 shadow-sm transition-colors hover:border-emerald-300 hover:text-emerald-600"
        title="언어 전환 / Switch Language"
      >
        <Globe className="h-3.5 w-3.5" />
        {i18n.language === 'ko' ? 'EN' : 'KO'}
      </button>
    </div>
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
