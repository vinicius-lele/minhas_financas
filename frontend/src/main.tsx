import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { AuthProvider } from "./contexts/AuthContext";
import { ProfileProvider } from "./contexts/ProfileContext";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";
import { ConfigProvider } from "antd";
import ptBR from "antd/locale/pt_BR";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";

dayjs.locale("pt-br");

// Component to provide the theme to ConfigProvider
export function ThemeConfigProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  
  return (
    <ConfigProvider
      locale={ptBR}
      theme={{
        token: {
          colorPrimary: theme.token.colorPrimary,
          colorPrimaryHover: theme.token.colorPrimaryHover,
          colorBgContainer: theme.token.colorBgContainer,
          colorBgElevated: theme.token.colorBgElevated,
          colorBgLayout: theme.token.colorBgLayout,
          colorText: theme.token.colorText,
          colorTextSecondary: theme.token.colorTextSecondary,
          colorBorder: theme.token.colorBorder,
          borderRadius: 8,
          fontFamily: "'Inter', sans-serif",
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <ProfileProvider>
        <ThemeProvider>
          <ThemeConfigProvider>
            <App />
          </ThemeConfigProvider>
        </ThemeProvider>
      </ProfileProvider>
    </AuthProvider>
  </React.StrictMode>
);
