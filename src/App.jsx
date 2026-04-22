import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './lib/auth'
import Login from './pages/Login'
import Tracker from './pages/Tracker'
import Admin from './pages/Admin'

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: "'IBM Plex Sans', sans-serif", color: '#525252' }}>
        Loading…
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/admin" element={user ? <Admin /> : <Navigate to="/login" />} />
      <Route path="/*" element={user ? <Tracker /> : <Navigate to="/login" />} />
    </Routes>
  )
}
