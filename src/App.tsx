import { useState, createContext } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import PostWaste from './pages/PostWaste'
import AdminDashboard from "./pages/AdminDashboard";
import CollectorDashboard from "./pages/CollectorDashboard";
import Unauthorized from "./pages/Unregistered";


export interface IAuthContext {
  isAuth: boolean
  roleState: string
  setAuthState: (state: { isAuth: boolean; roleState: string }) => void
}

const defaultContext: IAuthContext = {
  isAuth: false,
  roleState: '',
  setAuthState: () => {},
}

export const AuthContext = createContext<IAuthContext>(defaultContext)

function App() {
  const [authState, setAuthState] = useState<{ isAuth: boolean; roleState: string }>({
    isAuth: !!localStorage.getItem('accessToken'),
    roleState: '',
  })

  const handleSetAuthState = (state: { isAuth: boolean; roleState: string }) => {
    setAuthState(state)
  }

  return (
    <AuthContext.Provider value={{ ...authState, setAuthState: handleSetAuthState }}>
      <Router>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin"element={<AdminDashboard />} />

            <Route path="/collector" element={  <CollectorDashboard />}/>
            <Route path="/unauthorized" element={<Unauthorized />} />

          <Route path="/" element={authState.isAuth ? <HomePage /> : <Navigate to="/login" />} />
          <Route path="/post-waste" element={authState.isAuth ? <PostWaste /> : <Navigate to="/login" />} />
        </Routes>
      </Router>
    </AuthContext.Provider>
  )
}

export default App
