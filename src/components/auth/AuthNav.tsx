import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { LogIn, UserPlus, User, LogOut } from 'lucide-react'

export function AuthNav() {
  const navigate = useNavigate()
  const token = localStorage.getItem('token')

  const handleLogout = async () => {
    try {
      await axios.post('/bike/auth/logout', {}, {
        headers: { Authorization: `Bearer ${token}` },
      })
    } catch {
      // 실패해도 로컬 정리 진행
    } finally {
      localStorage.removeItem('token')
      localStorage.removeItem('userId')
      navigate('/login')
    }
  }

  if (token) {
    return (
      <div className="flex items-center gap-2">
        <Link
          to="/mypage"
          className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm transition-colors hover:bg-emerald-50"
        >
          <User className="h-3.5 w-3.5" />
          마이페이지
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-600"
        >
          <LogOut className="h-3.5 w-3.5" />
          로그아웃
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        to="/login"
        className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm transition-colors hover:bg-emerald-50"
      >
        <LogIn className="h-3.5 w-3.5" />
        로그인
      </Link>
      <Link
        to="/signup"
        className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-600"
      >
        <UserPlus className="h-3.5 w-3.5" />
        회원가입
      </Link>
    </div>
  )
}
