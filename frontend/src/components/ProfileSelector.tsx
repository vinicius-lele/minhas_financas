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
        key: p.id,
        label: (
            <div className="flex items-center justify-between w-full min-w-[150px]">
                <span>{p.name}</span>
                {profile?.id === p.id && <CheckOutlined style={{ color: "var(--primary)" }} />}
            </div>
        ),
        onClick: () => selectProfile(p),
      })),
    },
  ];

  return (
    <Dropdown menu={{ items }} trigger={["click"]} placement="bottomRight">
      <Button style={{ height: "auto", padding: "8px 12px", borderRadius: 12 }}>
        <Space>
          <Avatar
            size="small"
            style={{ backgroundColor: "var(--primary)30", color: "var(--primary)" }}
            icon={<UserOutlined />}
          />
          <div className="flex flex-col items-start leading-tight">
            <span className="text-[10px] text-text-muted font-bold uppercase">Perfil</span>
            <span className="font-semibold">{profile?.name || "Selecione"}</span>
          </div>
          <DownOutlined style={{ fontSize: 12, color: "var(--text-muted)" }} />
        </Space>
      </Button>
    </Dropdown>
  );
}
