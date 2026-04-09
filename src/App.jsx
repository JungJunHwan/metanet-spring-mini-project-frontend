import { BrowserRouter, Routes, Route } from 'react-router-dom'
import NavBar from './components/common/NavBar'
import Login from './components/auth/Login'
import Signup from './components/auth/Signup'
import MyPage from './components/user/MyPage'

function Dashboard() {
  return (
    <main style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>대시보드</h1>
      <p>팀원이 구현 중인 메인 대시보드 영역입니다.</p>
    </main>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/mypage" element={<MyPage />} />
      </Routes>
    </BrowserRouter>
  )
}
