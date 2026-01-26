import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { ProfileProvider } from "./contexts/ProfileContext";
import { ConfigProvider } from "antd";
import ptBR from "antd/locale/pt_BR";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import "./index.css";

dayjs.locale("pt-br");

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConfigProvider
      locale={ptBR}
      theme={{
        token: {
          colorPrimary: "#2563eb",
          borderRadius: 8,
          fontFamily: "'Inter', sans-serif",
        },
      }}
    >
      <ProfileProvider>
        <App />
      </ProfileProvider>
    </ConfigProvider>
  </React.StrictMode>
);
