import { useProfile } from "../contexts/ProfileContext";
import { DownOutlined, UserOutlined, CheckOutlined } from "@ant-design/icons";
import { Dropdown, Button, Space, Avatar, Typography } from "antd";
import type { MenuProps } from "antd";

const { Text } = Typography;

export function ProfileSelector() {
  const { profile, profiles, selectProfile } = useProfile();

  const items: MenuProps["items"] = [
    {
      key: "title",
      label: <Text type="secondary" style={{ fontSize: 12 }}>ALTERNAR PERFIL</Text>,
      type: "group",
      children: profiles.map((p) => ({
        key: String(p.id),
        label: (
          <div className="flex items-center justify-between w-full min-w-[150px]">
            <span>{p.name}</span>
            {profile?.id === p.id && (
              <CheckOutlined style={{ color: "var(--primary)" }} />
            )}
          </div>
        ),
      })),
    },
  ];

  const handleMenuClick: MenuProps["onClick"] = ({ key, domEvent }) => {
    domEvent.preventDefault();
    domEvent.stopPropagation();
    const selected = profiles.find((p) => String(p.id) === key);
    if (selected) {
      selectProfile(selected);
    }
  };

  return (
    <Dropdown
      menu={{ items, onClick: handleMenuClick }}
      trigger={["click"]}
      placement="bottomRight"
    >
      <Button style={{ height: 40, padding: "0 12px", borderRadius: 12 }}>
        <Space>
          <Avatar
            size="small"
            style={{ backgroundColor: "var(--primary)30", color: "var(--primary)" }}
            icon={<UserOutlined />}
          />
          <span className="font-semibold leading-none">
            {profile?.name || "Selecione"}
          </span>
          <DownOutlined style={{ fontSize: 12, color: "var(--text-muted)" }} />
        </Space>
      </Button>
    </Dropdown>
  );
}
