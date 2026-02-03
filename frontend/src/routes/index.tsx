import { createBrowserRouter } from "react-router-dom";
import { Dashboard } from "../pages/Dashboard";
import { Transactions } from "../pages/Transactions";
import { Categories } from "../pages/Categories";
import { PurchaseGoals } from "../pages/PurchaseGoals";
import { Budgets } from "../pages/Budgets";
import { Profiles } from "../pages/Profiles";
import { Investments } from "../pages/Investments";
import { ForgotPassword } from "../pages/ForgotPassword";
import { ResetPassword } from "../pages/ResetPassword";
import { AppRoot } from "./AppRoot";

export const router = createBrowserRouter([
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
    element: <AppRoot />,
    children: [
      { path: "/", element: <Dashboard /> },
      { path: "/transactions", element: <Transactions /> },
      { path: "/categories", element: <Categories /> },
      { path: "/purchase-goals", element: <PurchaseGoals /> },
      { path: "/budgets", element: <Budgets /> },
      { path: "/investments", element: <Investments /> },
      { path: "/profiles", element: <Profiles /> },
    ],
  },
]);
