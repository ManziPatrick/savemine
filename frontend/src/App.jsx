import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth.jsx';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Loans from './pages/Loans';
import Contacts from './pages/Contacts';
import Transactions from './pages/Transactions';
import Savings from './pages/Savings';
import Assets from './pages/Assets';
import Reminders from './pages/Reminders';
import Gifts from './pages/Gifts';
import Expenses from './pages/Expenses';
import Business from './pages/Business';
import Investments from './pages/Investments';
import PettyCash from './pages/PettyCash';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

// Protected Route component
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

// Public Route component (redirect to dashboard if already logged in)
function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
}

function App() {
  return (
    <div className="App">
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />
        
        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="loans" element={<Loans />} />
          <Route path="contacts" element={<Contacts />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="savings" element={<Savings />} />
          <Route path="assets" element={<Assets />} />
          <Route path="reminders" element={<Reminders />} />
          <Route path="gifts" element={<Gifts />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="business" element={<Business />} />
          <Route path="investments" element={<Investments />} />
          <Route path="petty-cash" element={<PettyCash />} />
          <Route path="profile" element={<Profile />} />
        </Route>
        
        {/* 404 route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;
