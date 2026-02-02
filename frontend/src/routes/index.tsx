import { createBrowserRouter } from "react-router-dom";
import { DefaultLayout } from "../layouts/DefaultLayout";
import { Dashboard } from "../pages/Dashboard";
import { Transactions } from "../pages/Transactions";
import { Categories } from "../pages/Categories";
import { PurchaseGoals } from "../pages/PurchaseGoals";
import { Budgets } from "../pages/Budgets";
import { Profiles } from "../pages/Profiles";
import { Login } from "../pages/Login";
import { Register } from "../pages/Register";
import { ForgotPassword } from "../pages/ForgotPassword";
import { ResetPassword } from "../pages/ResetPassword";
import { RequireAuth } from "../components/RequireAuth";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPassword />,
  },
  {
    path: "/reset-password/:token",
    element: <ResetPassword />,
  },
  {
    path: "/",
    element: (
      <RequireAuth>
        <DefaultLayout />
      </RequireAuth>
    ),
    children: [
      { path: "/", element: <Dashboard /> },
      { path: "/transactions", element: <Transactions /> },
      { path: "/categories", element: <Categories /> },
      { path: "/purchase-goals", element: <PurchaseGoals /> },
      { path: "/budgets", element: <Budgets /> },
      { path: "/profiles", element: <Profiles /> },
    ],
  },
]);
