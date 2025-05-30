import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import LoadingScreen from './components/ui/LoadingScreen';
import Toast from './components/ui/Toast';
import { AuthProvider } from './context/AuthContext';
import ScrollToTop from './components/utils/ScrollToTop';
import ProtectedRoute from './components/utils/ProtectedRoute';

// Lazy load pages to improve initial load performance
const Home = lazy(() => import('./pages/Home'));
const Community = lazy(() => import('./pages/Community'));
const GameTest = lazy(() => import('./pages/GameTest'));
const Production = lazy(() => import('./pages/Production'));
const Arena = lazy(() => import('./pages/Arena'));
const Tournaments = lazy(() => import('./pages/Tournaments'));
const Rewards = lazy(() => import('./pages/Rewards'));
const Contact = lazy(() => import('./pages/Contact'));
const Faq = lazy(() => import('./pages/Faq'));
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'));
const AdminPanel = lazy(() => import('./pages/admin/AdminPanel'));
const NotFound = lazy(() => import('./pages/NotFound'));

function App() {
  return (
    <AuthProvider>
      <ScrollToTop />
      <Toast />
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="community" element={<Community />} />
            <Route path="game-test" element={<GameTest />} />
            <Route path="production" element={<Production />} />
            <Route path="arena" element={<Arena />} />
            <Route path="tournaments" element={<Tournaments />} />
            <Route path="rewards" element={<Rewards />} />
            <Route path="contact" element={<Contact />} />
            <Route path="faq" element={<Faq />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route
              path="dashboard/*"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/*"
              element={
                <ProtectedRoute adminOnly>
                  <AdminPanel />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}

export default App;