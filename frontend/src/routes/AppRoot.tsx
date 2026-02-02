import { DefaultLayout } from "../layouts/DefaultLayout";
import { RequireAuth } from "../components/RequireAuth";
import { Home } from "../pages/Home";
import { useAuth } from "../contexts/AuthContext";

export function AppRoot() {
  const { token, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!token) {
    return <Home />;
  }

  return (
    <RequireAuth>
      <DefaultLayout />
    </RequireAuth>
  );
}

