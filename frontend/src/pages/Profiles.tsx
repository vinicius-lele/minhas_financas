import { useState } from "react";
import { useProfile } from "../contexts/ProfileContext";
import { useTheme } from "../contexts/ThemeContext";
import { 
  Card, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Select, 
  List, 
  Typography, 
  Avatar, 
  Space, 
  Popconfirm, 
  message, 
  Row, 
  Col 
} from "antd";
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  UserOutlined,
  SaveOutlined
} from "@ant-design/icons";
import type { Profile } from "../types/index";
import { motion } from "framer-motion";

const { Title } = Typography;

export function Profiles() {
  const { profiles, createProfile, updateProfile, updateProfileTheme, deleteProfile } = useProfile();
  const { availableThemes } = useTheme();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm();

  const handleEdit = (profile: Profile) => {
    setEditingId(profile.id);
    form.setFieldsValue({ name: profile.name, theme: profile.theme });
    setIsModalOpen(true);
  };

  const handleNew = () => {
    setEditingId(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingId(null);
    form.resetFields();
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteProfile(id);
      message.success("Perfil excluído com sucesso!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      message.error("Erro ao excluir perfil: " + msg);
    }
  };

  const onFinish = async (values: { name: string; theme: Profile['theme'] }) => {
    try {
      if (editingId) {
        await updateProfile(editingId, values.name);
        await updateProfileTheme(editingId, values.theme);
        message.success("Perfil atualizado!");
      } else {
        await createProfile(values.name, values.theme);
        message.success("Perfil criado!");
      }
      handleCancel();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      message.error("Erro ao salvar: " + msg);
    }
  };

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card bordered={false} className="shadow-sm">
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={4} style={{ margin: 0 }}>Gerenciar Perfis</Title>
          </Col>
          <Col>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={{ display: 'inline-block' }}>
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={handleNew}
                size="large"
              >
                Novo Perfil
              </Button>
            </motion.div>
          </Col>
        </Row>
      </Card>
      <div style={{ marginTop: 12 }}>
      <Card bordered={false} className="shadow-sm">
        <List
          grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4 }}
          dataSource={profiles}
          locale={{ emptyText: "Nenhum perfil encontrado" }}
          renderItem={(item) => (
            <List.Item>
              <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
                <Card 
                  className="hover:shadow-md transition-shadow"
                  actions={[
                    <Button 
                      type="text" 
                      icon={<EditOutlined />} 
                      onClick={() => handleEdit(item)}
                      className="text-blue-600"
                    />,
                    <Popconfirm
                      title="Excluir perfil"
                      description={
                        <div className="max-w-xs">
                          <p>Deseja realmente excluir este perfil?</p>
                          <p className="text-red-500 font-semibold mt-1">Todas as transações e categorias associadas serão perdidas!</p>
                        </div>
                      }
                      onConfirm={() => handleDelete(item.id)}
                      okText="Sim, excluir tudo"
                      cancelText="Cancelar"
                      okButtonProps={{ danger: true }}
                    >
                      <Button 
                        type="text" 
                        danger 
                        icon={<DeleteOutlined />} 
                      />
                    </Popconfirm>
                  ]}
                >
                  <Card.Meta
                    avatar={
                      <Avatar 
                        size="large" 
                        style={{ backgroundColor: '#e6f4ff', color: '#1677ff' }} 
                        icon={<UserOutlined />} 
                      />
                    }
                    title={item.name}
                    description={``} 
                  />
                </Card>
              </motion.div>
            </List.Item>
          )}
        />
      </Card>
      </div>

      <Modal
        title={editingId ? "Editar Perfil" : "Novo Perfil"}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
        >
          <Form.Item
            name="name"
            label="Nome do Perfil"
            rules={[{ required: true, message: 'Informe o nome do perfil' }]}
          >
            <Input placeholder="Ex: Pessoal, Trabalho..." />
          </Form.Item>

          <Form.Item
            name="theme"
            label="Tema"
            rules={[{ required: true, message: 'Selecione um tema' }]}
          >
            <Select placeholder="Escolha um tema">
              {availableThemes.map((theme) => (
                <Select.Option key={theme.name} value={theme.name}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: theme.colors.primary }}
                    />
                    {theme.displayName}
                  </div>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item className="mb-0 flex justify-end">
            <Space>
              <Button onClick={handleCancel}>
                Cancelar
              </Button>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                {editingId ? "Atualizar" : "Salvar"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </motion.div>
  );
}
