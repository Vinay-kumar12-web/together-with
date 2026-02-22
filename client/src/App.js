import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import AuthPage   from './pages/AuthPage';
import HomePage   from './pages/HomePage';
import RoomPage   from './pages/RoomPage';

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/auth" replace />;
};

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/"    element={<PrivateRoute><HomePage /></PrivateRoute>} />
            <Route path="/room/:id" element={<PrivateRoute><RoomPage /></PrivateRoute>} />
            <Route path="*"    element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
