// ✅ GuestRoute.tsx
import { Navigate } from "react-router-dom";
import { ReactNode } from "react";

interface GuestRouteProps {
  children: ReactNode;
}

export default function GuestRoute({ children }: GuestRouteProps) {
  const isAuthenticated = !!localStorage.getItem("user");
  if (isAuthenticated) {
    return <Navigate to="/assistant" replace />;
  }
  return <>{children}</>;
}
