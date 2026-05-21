import 'bootstrap/dist/css/bootstrap.min.css'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import AuthCallbackPage from './pages/AuthCallbackPage'
import InventoriesPage from './pages/InventoriesPage'
import InventoryDetailPage from './pages/InventoryDetailPage'
import ItemDetailPage from './pages/ItemDetailPage'
import ProfilePage from './pages/ProfilePage'
import PublicProfilePage from './pages/PublicProfilePage'
import SearchPage from './pages/SearchPage'
import AdminPage from './pages/AdminPage'

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/inventories" element={<InventoriesPage />} />
        <Route path="/inventories/:id" element={<InventoryDetailPage />} />
        <Route path="/items/:id" element={<ItemDetailPage />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route path="/profile/:userId" element={<PublicProfilePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin>
              <AdminPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  )
}
