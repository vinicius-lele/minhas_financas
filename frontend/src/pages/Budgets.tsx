import { useEffect, useState, useCallback } from "react";
import { api } from "../services/api";
import { useProfile } from "../contexts/ProfileContext";
import {
  Table,
  Button,
  Card,
  DatePicker,
  Input,
  Select,
  Modal,
  Form,
  Space,
  Typography,
  message,
  Row,
  Col,
  Progress
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SaveOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import type { Category, Budget, BudgetSummary } from "../types/index";
import { motion } from "framer-motion";

const { Text, Title } = Typography;
const { Option } = Select;

export function Budgets() {
  const { profile } = useProfile();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [currentMonthYear, setCurrentMonthYear] = useState<Dayjs>(dayjs());

  // Filter State
  const currentMonth = currentMonthYear.month() + 1;
  const currentYear = currentMonthYear.year();

  const loadCategories = useCallback(() => {
      if (!profile) return;
      api<Category[]>('/categories?type=EXPENSE')
        .then(setCategories)
        .catch(console.error);
  }, [profile]);

  const loadBudgets = useCallback(() => {
    if (!profile) return;
    setLoading(true);
    
    api<Budget[]>(`/budgets?month=${currentMonth}&year=${currentYear}`)
      .then(setBudgets)
      .catch((err) => {
        const msg = err instanceof Error ? err.message : "Erro desconhecido";
        message.error("Erro ao carregar orçamentos: " + msg);
      })
      .finally(() => setLoading(false));
  }, [profile, currentMonth, currentYear]);

  const loadBudgetSummary = useCallback(() => {
    if (!profile) return;
    
    api<BudgetSummary[]>(`/budgets/summary?month=${currentMonth}&year=${currentYear}`)
      .then(setBudgetSummary)
      .catch((err) => {
        const msg = err instanceof Error ? err.message : "Erro desconhecido";
        message.error("Erro ao carregar resumo de orçamentos: " + msg);
      });
  }, [profile, currentMonth, currentYear]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadBudgets();
    loadBudgetSummary();
  }, [loadBudgets, loadBudgetSummary]);



  const handleModalOpen = (budget?: Budget) => {
    if (budget) {
      setEditingId(budget.id);
      form.setFieldsValue({
        categoryId: budget.category_id,
        amount: Math.round(budget.amount * 100).toString()
      });
    } else {
      setEditingId(null);
      form.resetFields();
      form.setFieldValue('amount', '0');
    }
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingId(null);
    form.resetFields();
  };

  const handleSaveBudget = async () => {
    try {
      const values = await form.validateFields();
      const amount = Number(values.amount || "0") / 100;
      
      if (editingId) {
        // Update existing budget
        await api(`/budgets/${editingId}`, {
          method: "PUT",
          body: JSON.stringify({ amount })
        });
        message.success("Orçamento atualizado com sucesso");
      } else {
        // Create new budget
        await api("/budgets", {
          method: "POST",
          body: JSON.stringify({
            categoryId: values.categoryId,
            month: currentMonth,
            year: currentYear,
            amount
          })
        });
        message.success("Orçamento criado com sucesso");
      }
      
      handleModalClose();
      loadBudgets();
      loadBudgetSummary();
    } catch (error) {
      message.error("Erro ao salvar orçamento");
    }
  };

  const handleDeleteBudget = async (id: number) => {
    try {
      await api(`/budgets/${id}`, { method: "DELETE" });
      message.success("Orçamento excluído com sucesso");
      loadBudgets();
      loadBudgetSummary();
    } catch (error) {
      message.error("Erro ao excluir orçamento");
    }
  };

  const columns = [
    {
      title: "Categoria",
      dataIndex: "category_name",
      key: "category_name",
      render: (_: any, record: BudgetSummary) => (
        <div className="flex items-center gap-2">
          <span>{record.category_emoji}</span>
          <span>{record.category_name}</span>
        </div>
      )
    },
    {
      title: "Orçamento",
      dataIndex: "budget_amount",
      key: "budget_amount",
      render: (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(value);
      }
    },
    {
      title: "Gasto",
      dataIndex: "spent_amount",
      key: "spent_amount",
      render: (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(value);
      }
    },
    {
      title: "Progresso",
      dataIndex: "progress",
      key: "progress",
      render: (_: any, record: BudgetSummary) => {
        const percent = record.budget_amount > 0 
          ? Math.round((record.spent_amount / record.budget_amount) * 100) 
          : 0;
        
        const color = percent >= 100 ? 'red' : percent >= 80 ? 'orange' : 'green';
        
        return (
          <div className="flex items-center gap-2">
            <Progress 
              percent={percent} 
              size="small" 
              strokeColor={color}
              showInfo={false}
            />
            <Text type={percent >= 100 ? 'danger' : percent >= 80 ? 'warning' : 'success'} className="whitespace-nowrap">
              {percent}%
            </Text>
          </div>
        );
      }
    },
    {
      title: "Ação",
      key: "action",
      render: (_: any, record: BudgetSummary) => {
        const existingBudget = budgets.find(b => b.category_id === record.category_id);
        return (
          <Space>
            <Button
              type="default"
              icon={<EditOutlined />}
              size="small"
              onClick={() => existingBudget && handleModalOpen(existingBudget)}
              disabled={!existingBudget}
            >
              Editar
            </Button>
            <Button
              danger
              icon={<DeleteOutlined />}
              size="small"
              onClick={() => existingBudget && handleDeleteBudget(existingBudget.id)}
              disabled={!existingBudget}
            >
              Excluir
            </Button>
          </Space>
        );
      }
    }
  ];

  if (!profile) {
    return <div className="flex justify-center items-center h-64"><Text type="secondary">Selecione um perfil para visualizar os orçamentos.</Text></div>;
  }



  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Title level={2} style={{ margin: 0 }}>
          Orçamentos
        </Title>
        <Text type="secondary">
          Gerencie seus orçamentos mensais por categoria
        </Text>
      </motion.div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} lg={8}>
          <Card bordered={false} className="shadow-sm">
            <div className="flex flex-col gap-6">
              <div>
                <Text strong>Mês e Ano</Text>
                <DatePicker
                  picker="month"
                  value={currentMonthYear}
                  onChange={(date) => date && setCurrentMonthYear(date)}
                  className="w-full mt-2"
                  format="MMMM YYYY"
                />
              </div>
              <Button
              style={{ marginTop: 18 }}
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => handleModalOpen()}
                block
              >
                Adicionar Orçamento
              </Button>
            </div>
          </Card>
        </Col>
        
        <Col xs={24} md={12} lg={16}>
          <Card bordered={false} className="shadow-sm">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <Text strong>Resumo do Mês</Text>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-surface p-4 rounded-lg">
                  <Text type="secondary" className="text-xs">Categorias com Orçamento</Text>
                  <div className="text-2xl font-bold mt-1">
                    {budgets.length}
                  </div>
                </div>
                <div className="bg-surface p-4 rounded-lg">
                  <Text type="secondary" className="text-xs">Total Orçado</Text>
                  <div className="text-2xl font-bold mt-1">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(
                      budgetSummary.reduce((sum, item) => sum + item.budget_amount, 0)
                    )}
                  </div>
                </div>
                <div className="bg-surface p-4 rounded-lg">
                  <Text type="secondary" className="text-xs">Total Gasto</Text>
                  <div className="text-2xl font-bold mt-1">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(
                      budgetSummary.reduce((sum, item) => sum + item.spent_amount, 0)
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24}>
          <Card bordered={false} className="shadow-sm">
            <Table
              loading={loading}
              columns={columns}
              dataSource={budgetSummary}
              rowKey="category_id"
              pagination={false}
              scroll={{ x: 600 }}
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title={editingId ? "Editar Orçamento" : "Adicionar Orçamento"}
        open={isModalOpen}
        onCancel={handleModalClose}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveBudget}
        >
          <Form.Item
            name="categoryId"
            label="Categoria"
            rules={[{ required: true, message: 'Por favor, selecione uma categoria' }]}
          >
            <Select placeholder="Selecione uma categoria">
              {categories.map((category) => (
                <Option key={category.id} value={category.id}>
                  <div className="flex items-center gap-2">
                    <span>{category.emoji}</span>
                    <span>{category.name}</span>
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="amount"
            label="Valor Orçado"
            rules={[{ required: true, message: 'Por favor, insira um valor' }]}
            getValueFromEvent={(e: unknown) => {
              const v = (e as { target: { value: string } }).target.value;
              const digits = v.replace(/\D/g, "");
              return digits || "0";
            }}
            getValueProps={(v: unknown) => {
              const s = typeof v === "string" ? v : "0";
              const num = Number(s || "0") / 100;
              return {
                value: num.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL"
                })
              };
            }}
          >
            <Input placeholder="0,00" inputMode="numeric" />
          </Form.Item>

          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={handleModalClose}>
              Cancelar
            </Button>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
              Salvar
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}