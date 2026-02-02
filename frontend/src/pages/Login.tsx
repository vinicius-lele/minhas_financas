import { Card, Form, Input, Button, Typography, Checkbox, message } from "antd";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { useAuth } from "../contexts/AuthContext";
import { useLocation, useNavigate, Link } from "react-router-dom";

const { Title, Text } = Typography;

type LoginFormValues = {
  identifier: string;
  password: string;
  remember: boolean;
};

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as any;

  const from = location.state?.from?.pathname || "/";

  const handleFinish = async (values: LoginFormValues) => {
    try {
      await login(values.identifier, values.password);
      if (!values.remember) {
        sessionStorage.setItem("authSession", "1");
      }
      navigate(from, { replace: true });
    } catch (err: any) {
      message.error(err?.message || "Não foi possível entrar");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <Card style={{ maxWidth: 400, width: "100%" }} className="shadow-md">
        <div className="mb-6 text-center">
          <Title level={3} style={{ marginBottom: 4 }}>
            Entrar
          </Title>
          <Text type="secondary">Acesse suas finanças com segurança</Text>
        </div>

        <Form layout="vertical" onFinish={handleFinish} initialValues={{ remember: true }}>
          <Form.Item
            label="Usuário ou Email"
            name="identifier"
            rules={[{ required: true, message: "Informe seu usuário ou email" }]}
          >
            <Input prefix={<UserOutlined />} placeholder="usuario ou email" />
          </Form.Item>

          <Form.Item
            label="Senha"
            name="password"
            rules={[{ required: true, message: "Informe sua senha" }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Senha" />
          </Form.Item>

          <div className="flex items-center justify-between mb-4">
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox>Lembrar-me</Checkbox>
            </Form.Item>
            <Link to="/forgot-password">Esqueci minha senha</Link>
          </div>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Entrar
            </Button>
          </Form.Item>
        </Form>

        <div className="text-center mt-4">
          <Text type="secondary">
            Não tem conta? <Link to="/register">Criar conta</Link>
          </Text>
        </div>
      </Card>
    </div>
  );
}

