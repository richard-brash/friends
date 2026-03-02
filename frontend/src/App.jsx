import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Login from './screens/Login';
import Layout from './components/Layout';
import Friends from './screens/Friends';
import Runs from './screens/Runs';
import Requests from './screens/Requests';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/runs" replace />} />
          <Route path="runs" element={<Runs />} />
          <Route path="friends" element={<Friends />} />
          <Route path="requests" element={<Requests />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
