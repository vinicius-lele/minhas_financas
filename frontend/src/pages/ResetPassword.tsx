import { Card, Form, Input, Button, Typography, message } from "antd";
import { LockOutlined } from "@ant-design/icons";
import { api } from "../services/api";
import { useNavigate, useParams, Link } from "react-router-dom";

const { Title, Text } = Typography;

type ResetFormValues = {
  password: string;
  confirmPassword: string;
};

export function ResetPassword() {
  const navigate = useNavigate();
  const { token } = useParams();

  const handleFinish = async (values: ResetFormValues) => {
    if (!token) {
      message.error("Token inválido");
      return;
    }

    try {
      await api("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
          token,
          password: values.password,
          confirmPassword: values.confirmPassword,
        }),
      });
      message.success("Senha redefinida com sucesso");
      navigate("/", { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Não foi possível redefinir a senha";
      message.error(msg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <Card style={{ maxWidth: 400, width: "100%" }} className="shadow-md">
        <div className="mb-6 text-center">
          <Title level={3} style={{ marginBottom: 4 }}>
            Definir nova senha
          </Title>
          <Text type="secondary">
            Escolha uma nova senha forte para sua conta.
          </Text>
        </div>

        <Form layout="vertical" onFinish={handleFinish}>
          <Form.Item
            label="Nova senha"
            name="password"
            rules={[{ required: true, message: "Informe a nova senha" }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Nova senha" />
          </Form.Item>

          <Form.Item
            label="Confirmar nova senha"
            name="confirmPassword"
            dependencies={["password"]}
            rules={[
              { required: true, message: "Confirme a nova senha" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("As senhas não conferem"));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Repita a nova senha" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Redefinir senha
            </Button>
          </Form.Item>
        </Form>

        <div className="text-center mt-4">
          <Text type="secondary">
            Lembrou da senha? <Link to="/">Voltar para início</Link>
          </Text>
        </div>
      </Card>
    </div>
  );
}
