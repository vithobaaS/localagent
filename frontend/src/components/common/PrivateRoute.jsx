import { Navigate } from 'react-router-dom';
import { getToken } from '../../api/apiClient';

export function PrivateRoute({ children }) {
  const token = getToken();
  return token ? children : <Navigate to="/login" replace />;
}
