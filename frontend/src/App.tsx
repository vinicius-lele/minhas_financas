import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DefaultLayout } from "./layouts/DefaultLayout";
import { Dashboard } from "./pages/Dashboard";
import { Transactions } from "./pages/Transactions";
import { Categories } from "./pages/Categories";
import { Profiles } from "./pages/Profiles";
import { PurchaseGoals } from "./pages/PurchaseGoals";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<DefaultLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/profiles" element={<Profiles />} />
          <Route path="/purchase-goals" element={<PurchaseGoals />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
