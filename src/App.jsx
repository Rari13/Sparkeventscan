import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { SupabaseAuthProvider, useSupabaseAuth } from '@/lib/SupabaseAuthContext';

// Pages
import Login from './pages/Login';
import EventSelection from './pages/EventSelection';
import Scanner from './pages/Scanner';
import ScanHistory from './pages/ScanHistory';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isOrganizer, loading } = useSupabaseAuth();

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-[#8B7FE8]/30 border-t-[#8B7FE8] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/Login" replace />;
  }

  if (!isOrganizer) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-50 p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Accès réservé aux organisateurs</h2>
          <p className="text-gray-600 text-sm mb-4">
            Cette application est réservée aux organisateurs d'événements SparkEvents.
          </p>
          <button
            onClick={() => window.location.href = '/Login'}
            className="px-6 py-2 bg-[#8B7FE8] text-white rounded-lg hover:bg-[#7B6FD8] transition-colors"
          >
            Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  return children;
};

// Main App Routes
const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/Login" element={<Login />} />
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <EventSelection />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/Scanner" 
        element={
          <ProtectedRoute>
            <Scanner />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/ScanHistory" 
        element={
          <ProtectedRoute>
            <ScanHistory />
          </ProtectedRoute>
        } 
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <SupabaseAuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AppRoutes />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </SupabaseAuthProvider>
  );
}

export default App;
