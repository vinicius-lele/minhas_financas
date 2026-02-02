import { Card, Form, Input, Button, Typography, message } from "antd";
import { MailOutlined } from "@ant-design/icons";
import { api } from "../services/api";
import { Link } from "react-router-dom";

const { Title, Text } = Typography;

type ForgotFormValues = {
  email: string;
};

export function ForgotPassword() {
  const handleFinish = async (values: ForgotFormValues) => {
    try {
      const res = await api<{ ok: boolean; resetToken?: string }>("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: values.email }),
      });

      if (res.resetToken) {
        console.log("Token de recuperação (dev):", res.resetToken);
      }

      message.success("Se o email existir, enviaremos instruções de recuperação");
    } catch (err: any) {
      message.error(err?.message || "Não foi possível iniciar a recuperação");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <Card style={{ maxWidth: 400, width: "100%" }} className="shadow-md">
        <div className="mb-6 text-center">
          <Title level={3} style={{ marginBottom: 4 }}>
            Recuperar senha
          </Title>
          <Text type="secondary">
            Informe seu email e enviaremos um link para redefinição.
          </Text>
        </div>

        <Form layout="vertical" onFinish={handleFinish}>
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Informe seu email" },
              { type: "email", message: "Email inválido" },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="seu@email.com" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Enviar link de recuperação
            </Button>
          </Form.Item>
        </Form>

        <div className="text-center mt-4">
          <Text type="secondary">
            Lembrou da senha? <Link to="/login">Voltar para login</Link>
          </Text>
        </div>
      </Card>
    </div>
  );
}

