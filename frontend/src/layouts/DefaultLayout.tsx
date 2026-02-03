import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Layout, Menu, Button, Drawer, theme, Dropdown, Space, Typography } from "antd";
import {
  DashboardOutlined,
  SwapOutlined,
  TagsOutlined,
  UserOutlined,
  MenuOutlined,
  WalletOutlined,
  GiftOutlined,
  LineChartOutlined,
} from "@ant-design/icons";
import { ProfileSelector } from "../components/ProfileSelector";
import { useAuth } from "../contexts/AuthContext";

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

type MenuItem = { key: string; icon: React.ReactNode; label: string };

function SidebarContent({
  collapsed,
  locationPathname,
  menuItems,
  onMenuClick
}: {
  collapsed: boolean;
  locationPathname: string;
  menuItems: MenuItem[];
  onMenuClick: (key: string) => void;
}) {
  return (
    <>
      <div className="h-16 flex items-center justify-center gap-2 border-b border-border m-2 mb-4">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary/30">
          <WalletOutlined style={{ fontSize: 18 }} />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-white font-bold text-lg leading-none tracking-tight">
              Minhas
            </span>
            <span className="text-primary font-bold text-lg leading-none tracking-tight">
              Finanças
            </span>
          </div>
        )}
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[locationPathname]}
        items={menuItems}
        onClick={({ key }) => onMenuClick(key)}
        style={{ background: "transparent", border: "none" }}
      />
    </>
  );
}

export function DefaultLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const menuItems = [
    {
      key: "/",
      icon: <DashboardOutlined />,
      label: "Dashboard",
    },
    {
      key: "/transactions",
      icon: <SwapOutlined />,
      label: "Transações",
    },
    {
      key: "/categories",
      icon: <TagsOutlined />,
      label: "Categorias",
    },
    {
      key: "/budgets",
      icon: <WalletOutlined />,
      label: "Orçamentos",
    },
    {
      key: "/investments",
      icon: <LineChartOutlined />,
      label: "Investimentos",
    },
    {
      key: "/purchase-goals",
      icon: <GiftOutlined />,
      label: "Metas de Compra",
    },
    {
      key: "/profiles",
      icon: <UserOutlined />,
      label: "Perfis",
    },
  ];

  const handleMenuClick = (key: string) => {
    navigate(key);
    setMobileOpen(false);
  };

  const { user, logout } = useAuth();

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Desktop Sidebar */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        breakpoint="lg"
        collapsedWidth="80"
        onBreakpoint={(broken) => {
          if (broken) setCollapsed(true);
        }}
        className="hidden lg:block !bg-[#001529] shadow-xl z-20"
        width={250}
      >
        <SidebarContent 
          collapsed={collapsed}
          locationPathname={location.pathname}
          menuItems={menuItems}
          onMenuClick={handleMenuClick}
        />
      </Sider>

      {/* Mobile Drawer */}
      <Drawer
        placement="left"
        onClose={() => setMobileOpen(false)}
        open={mobileOpen}
        styles={{ body: { padding: 0, backgroundColor: "#1a1a1a" } }}
        size={250}
        closeIcon={null}
      >
        <SidebarContent 
          collapsed={collapsed}
          locationPathname={location.pathname}
          menuItems={menuItems}
          onMenuClick={handleMenuClick}
        />
      </Drawer>

      <Layout>
        <Header
          style={{
            padding: "0 24px",
            background: colorBgContainer,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            zIndex: 10,
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          <div className="flex items-center gap-4">
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={() => {
                setMobileOpen(true);
              }}
              style={{
                fontSize: "16px",
                width: 48,
                height: 48,
              }}
            />
            <h1 className="text-xl font-bold m-0 hidden sm:block">
              {menuItems.find((i) => i.key === location.pathname)?.label || "Dashboard"}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <ProfileSelector />
            {user && (
              <Dropdown
                menu={{
                  items: [
                    {
                      key: "user",
                      label: (
                        <div className="flex flex-col">
                          <Text strong>{user.username}</Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {user.email}
                          </Text>
                        </div>
                      ),
                    },
                    {
                      type: "divider",
                    },
                    {
                      key: "logout",
                      label: "Sair",
                      onClick: () => {
                        logout().then(() => {
                          navigate("/");
                        });
                      },
                    },
                  ],
                }}
                trigger={["click"]}
              >
                <Button type="text">
                  <Space direction="horizontal">
                    <UserOutlined />
                    <Text>{user.username}</Text>
                  </Space>
                </Button>
              </Dropdown>
            )}
          </div>
        </Header>

        <Content
          style={{
            margin: "24px 16px",
            padding: 24,
            minHeight: 280,
            background: "transparent", // Let pages define their own background/cards
            borderRadius: borderRadiusLG,
            overflowY: "auto",
          }}
        >
          <div className="max-w-7xl mx-auto animate-in fade-in duration-500 slide-in-from-bottom-4">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
