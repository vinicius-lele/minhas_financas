import { useEffect, useState, useCallback } from "react";
import { api } from "../services/api";
import { useProfile } from "../contexts/ProfileContext";
import { 
  Card, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Select, 
  List, 
  Typography, 
  Space, 
  Popconfirm, 
  message, 
  Row,
  Col,
  Tabs
} from "antd";
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  SearchOutlined,
  SaveOutlined
} from "@ant-design/icons";
import type { Category, TransactionType } from "../types/index";
import { motion } from "framer-motion";

const { Title, Text } = Typography;
const { Option } = Select;

const emojiList: Record<string, string[]> = {
  "Essencial": ["🏠","💡","💧","🛒","💊","🏫"],
  "Transporte": ["🚗","🚌","🚲","🏎️","✈️","⛽"],
  "Lazer": ["🎮","🎬","🎵","🎲","🎤","🍕","🍔"],
  "Serviços": ["💈","💅","🔧","🧹","📦","📱"],
  "Financeiro": ["💰","💳","🏦","💵","📈","💎"],
  "Outros": ["🎁","🐾","👶","📚","💼","🏖️"]
};

export function Categories() {
  const { profile } = useProfile();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm();

  // Watch emoji for preview
  const selectedEmoji = Form.useWatch('emoji', form);

  const loadCategories = useCallback(() => {
    if (!profile) return;
    setLoading(true);
    api<Category[]>("/categories")
      .then(setCategories)
      .catch((err) => {
        const msg = err instanceof Error ? err.message : "Erro desconhecido";
        message.error("Erro ao carregar categorias: " + msg);
      })
      .finally(() => setLoading(false));
  }, [profile]);

  useEffect(() => {
    const id = setTimeout(() => {
      loadCategories();
    }, 0);
    return () => clearTimeout(id);
  }, [loadCategories]);

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    form.setFieldsValue({
      name: category.name,
      emoji: category.emoji,
      type: category.type
    });
    setIsModalOpen(true);
  };

  const handleNew = () => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({
      type: "INCOME",
      emoji: "💰"
    });
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingId(null);
    form.resetFields();
  };

  const handleDelete = async (id: number) => {
    try {
      await api(`/categories/${id}`, { method: "DELETE" });
      message.success("Categoria excluída!");
      loadCategories();
    } catch {
      message.error("Erro ao excluir categoria");
    }
  };

  const onFinish = async (values: { name: string; emoji: string; type: TransactionType }) => {
    try {
      if (editingId) {
        await api(`/categories/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(values),
        });
        message.success("Categoria atualizada!");
      } else {
        await api("/categories", {
          method: "POST",
          body: JSON.stringify(values),
        });
        message.success("Categoria criada!");
      }

      handleCancel();
      loadCategories();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      message.error("Erro ao salvar: " + msg);
    }
  };

  if (!profile) return (
    <div className="flex flex-col items-center justify-center h-64 text-slate-500 gap-4">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
            <SearchOutlined style={{ fontSize: 32, color: '#cbd5e1' }} />
        </div>
        <p>Selecione um perfil para gerenciar categorias.</p>
    </div>
  );

  const renderCategoryList = (type: TransactionType) => (
    <List
      grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4 }}
      dataSource={categories.filter(c => c.type === type)}
      loading={loading}
      locale={{ emptyText: "Nenhuma categoria encontrada" }}
      renderItem={(item) => (
        <List.Item>
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
                title="Excluir categoria"
                description="Tem certeza?"
                onConfirm={() => handleDelete(item.id)}
                okText="Sim"
                cancelText="Não"
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
                <div className={`w-12 h-12 text-2xl rounded-xl flex items-center justify-center border ${
                  item.type === 'INCOME' 
                    ? 'bg-primary-50 border-primary-100' 
                    : 'bg-primary-50 border-primary-100'
                }`}>
                  {item.emoji}
                </div>
              }
              title={<span className="text-slate-700">{item.name}</span>}
              description={item.type === 'INCOME' ? 'Receita' : 'Despesa'}
            />
          </Card>
        </List.Item>
      )}
    />
  );

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="shadow-sm">
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={4} style={{ margin: 0 }}>Gerenciar Categorias</Title>
          </Col>
          <Col>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={{ display: 'inline-block' }}>
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={handleNew}
                size="large"
              >
                Nova Categoria
              </Button>
            </motion.div>
          </Col>
        </Row>
      </Card>

      <Card className="shadow-sm" style={{ marginTop: 12 }}>
        <Tabs
          defaultActiveKey="EXPENSE"
          items={[
            {
              key: 'EXPENSE',
              label: <span className="text-red-600 font-medium">Despesas</span>,
              children: renderCategoryList('EXPENSE')
            },
            {
              key: 'INCOME',
              label: <span className="text-emerald-600 font-medium">Receitas</span>,
              children: renderCategoryList('INCOME')
            }
          ]}
        />
      </Card>

      <Modal
        title={editingId ? "Editar Categoria" : "Nova Categoria"}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        destroyOnClose
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
        >
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item
                name="name"
                label="Nome"
                rules={[{ required: true, message: 'Informe o nome' }]}
              >
                <Input placeholder="Ex: Supermercado" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="type"
                label="Tipo"
                rules={[{ required: true, message: 'Selecione o tipo' }]}
              >
                <Select>
                  <Option value="INCOME">Receita</Option>
                  <Option value="EXPENSE">Despesa</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="emoji"
            label="Ícone"
            rules={[{ required: true, message: 'Selecione um ícone' }]}
          >
            <Input 
              style={{ textAlign: 'center', fontSize: '24px', width: '60px' }} 
              maxLength={2} 
              readOnly 
            />
          </Form.Item>

          <div className="bg-primary-50 p-4 rounded-lg border border-primary-100 mb-6 max-h-60 overflow-y-auto">
            {Object.entries(emojiList).map(([group, emojis]) => (
              <div key={group} className="mb-3 last:mb-0">
                <Text type="secondary" style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                  {group}
                </Text>
                <div className="flex flex-wrap gap-2 mt-1">
                  {emojis.map(e => (
                    <Button
                      key={e}
                      type={selectedEmoji === e ? "primary" : "default"}
                      onClick={() => form.setFieldValue('emoji', e)}
                      style={{ fontSize: '18px', width: '36px', height: '36px', padding: 0 }}
                    >
                      {e}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>

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
