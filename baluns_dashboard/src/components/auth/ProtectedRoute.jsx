import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

export default function ProtectedRoute() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;

  // A new user must set their own password before using anything
  if (user.mustChangePassword) return <Navigate to="/change-password" replace />;

  return <Outlet />;
}