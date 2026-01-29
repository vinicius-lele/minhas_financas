import { createBrowserRouter } from "react-router-dom";
import { DefaultLayout } from "../layouts/DefaultLayout";
import { Dashboard } from "../pages/Dashboard";
import { Transactions } from "../pages/Transactions";
import { Categories } from "../pages/Categories";
import { PurchaseGoals } from "../pages/PurchaseGoals";
import { Budgets } from "../pages/Budgets";
import { Profiles } from "../pages/Profiles";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <DefaultLayout />,
    children: [
      { path: "/", element: <Dashboard /> },
      { path: "/transactions", element: <Transactions /> },
      { path: "/categories", element: <Categories /> },
      { path: "/purchase-goals", element: <PurchaseGoals /> },
      { path: "/budgets", element: <Budgets /> },
      { path: "/profiles", element: <Profiles /> }
    ]
  }
]);
