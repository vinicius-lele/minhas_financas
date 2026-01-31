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
          colorPrimary: "#f18539",
          colorPrimaryHover: "#d96b27",
          colorBgContainer: "#ffffff",
          colorBgElevated: "#ffffff",
          colorBgLayout: "#fef3e2",
          colorText: "#431e09",
          colorTextSecondary: "#92400e",
          colorBorder: "#fde6d2",
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
