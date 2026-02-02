import { Card, Form, Input, Button, Typography, Checkbox, message } from "antd";
import { LockOutlined, UserOutlined, MailOutlined } from "@ant-design/icons";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";

const { Title, Text } = Typography;

type RegisterFormValues = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  terms: boolean;
};

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleFinish = async (values: RegisterFormValues) => {
    if (!values.terms) {
      message.error("Você precisa aceitar os termos de uso");
      return;
    }

    const passwordValid =
      values.password.length >= 8 &&
      /[A-Z]/.test(values.password) &&
      /[a-z]/.test(values.password) &&
      /[0-9]/.test(values.password) &&
      /[^A-Za-z0-9]/.test(values.password);

    if (!passwordValid) {
      message.error("A senha deve ter maiúsculas, minúsculas, números e caracteres especiais");
      return;
    }

    try {
      await register(values.username, values.email, values.password, values.confirmPassword);
      message.success("Cadastro realizado com sucesso");
      navigate("/", { replace: true });
    } catch (err: any) {
      message.error(err?.message || "Não foi possível cadastrar");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <Card style={{ maxWidth: 500, width: "100%" }} className="shadow-md">
        <div className="mb-6 text-center">
          <Title level={3} style={{ marginBottom: 4 }}>
            Criar conta
          </Title>
          <Text type="secondary">Comece a organizar suas finanças pessoais</Text>
        </div>

        <Form layout="vertical" onFinish={handleFinish}>
          <Form.Item
            label="Usuário"
            name="username"
            rules={[{ required: true, message: "Informe um nome de usuário" }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Seu usuário" />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Informe um email" },
              { type: "email", message: "Email inválido" },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="seu@email.com" />
          </Form.Item>

          <Form.Item
            label="Senha"
            name="password"
            rules={[{ required: true, message: "Informe uma senha" }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Senha forte" />
          </Form.Item>

          <Form.Item
            label="Confirmar senha"
            name="confirmPassword"
            dependencies={["password"]}
            rules={[
              { required: true, message: "Confirme sua senha" },
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
            <Input.Password prefix={<LockOutlined />} placeholder="Repita a senha" />
          </Form.Item>

          <Form.Item name="terms" valuePropName="checked">
            <Checkbox>
              Aceito os <span className="underline">termos de uso</span>
            </Checkbox>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Criar conta
            </Button>
          </Form.Item>
        </Form>

        <div className="text-center mt-4">
          <Text type="secondary">
            Já tem conta? <Link to="/login">Entrar</Link>
          </Text>
        </div>
      </Card>
    </div>
  );
}

