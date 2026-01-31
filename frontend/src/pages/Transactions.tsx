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
  Tag, 
  Space, 
  Tooltip, 
  Popconfirm, 
  Typography, 
  message,
  Row,
  Col
} from "antd";
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  SearchOutlined, 
  FilterOutlined,
  SaveOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import type { Transaction, Category, TransactionType } from "../types/index";
import { motion } from "framer-motion";

const { Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

export function Transactions() {
  const { profile } = useProfile();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [amountDigits, setAmountDigits] = useState<string>("0");
  const watchedAmount = Form.useWatch('amount', form);

  // Filter State
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('month')
  ]);

  // Editing State
  const [editingId, setEditingId] = useState<number | null>(null);

  const loadTransactions = useCallback(() => {
    if (!profile) return;
    setLoading(true);
    const start = dateRange[0].format("YYYY-MM-DD");
    const end = dateRange[1].format("YYYY-MM-DD");
    
    api<Transaction[]>(`/transactions?start=${start}&end=${end}`)
      .then(setTransactions)
      .catch((err) => {
        const msg = err instanceof Error ? err.message : "Erro desconhecido";
        message.error("Erro ao carregar transações: " + msg);
      })
      .finally(() => setLoading(false));
  }, [dateRange, profile]);

  const loadCategories = useCallback(() => {
      if (!profile) return;
      api<Category[]>("/categories")
        .then(setCategories)
        .catch(console.error);
  }, [profile]);

  useEffect(() => {
    const id = setTimeout(() => {
      loadTransactions();
    }, 0);
    return () => clearTimeout(id);
  }, [loadTransactions]);

  useEffect(() => {
    const id = setTimeout(() => {
      loadCategories();
    }, 0);
    return () => clearTimeout(id);
  }, [loadCategories]);

  useEffect(() => {
    const id = setTimeout(() => {
      setAmountDigits(watchedAmount || "0");
    }, 0);
    return () => clearTimeout(id);
  }, [watchedAmount]);

  const handleEdit = (t: Transaction) => {
    setEditingId(t.id);
    form.setFieldsValue({
      description: t.description,
      type: t.type,
      categoryId: t.category_id,
      date: dayjs(t.date)
    });
    const cents = Math.round(t.amount * 100).toString();
    setAmountDigits(cents);
    form.setFieldValue("amount", cents);
    setIsModalOpen(true);
  };

  const handleNew = () => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({
      type: "INCOME",
      date: dayjs()
    });
    setAmountDigits("0");
    form.setFieldValue("amount", "0");
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingId(null);
    form.resetFields();
  };

  const handleDelete = async (id: number) => {
    try {
      await api(`/transactions/${id}`, { method: "DELETE" });
      message.success("Transação excluída com sucesso");
      loadTransactions();
    } catch {
      message.error("Erro ao excluir transação");
    }
  };

  const onFinish = async (values: { 
    description: string; 
    type: TransactionType; 
    categoryId: number; 
    date: Dayjs;
    installments?: string;
  }) => {
    const installments =
      values.type === "EXPENSE" && !editingId
        ? Number(values.installments || "1")
        : 1;
    
    try {
      if (editingId) {
        const payload = {
          profileId: profile?.id,
          categoryId: Number(values.categoryId),
          amount: Number(amountDigits) / 100,
          type: values.type,
          date: values.date.format("YYYY-MM-DD"),
          description: values.description
        };

        await api(`/transactions/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        message.success("Transação atualizada!");
      } else {
        if (installments <= 1 || values.type === "INCOME") {
          const payload = {
            profileId: profile?.id,
            categoryId: Number(values.categoryId),
            amount: Number(amountDigits) / 100,
            type: values.type,
            date: values.date.format("YYYY-MM-DD"),
            description: values.description
          };

          await api("/transactions", {
            method: "POST",
            body: JSON.stringify(payload),
          });
          message.success("Transação criada!");
        } else {
          const totalCents = Number(amountDigits || "0");
          const safeInstallments = Number.isFinite(installments) && installments > 0 ? installments : 1;
          const base = Math.floor(totalCents / safeInstallments);
          const remainder = totalCents % safeInstallments;

          const requests: Promise<unknown>[] = [];

          for (let i = 0; i < safeInstallments; i++) {
            const cents = base + (i < remainder ? 1 : 0);
            const amount = cents / 100;
            const date = values.date.add(i, "month").format("YYYY-MM-DD");
            const description = `${values.description} - (${i + 1}/${safeInstallments})`;

            const payload = {
              profileId: profile?.id,
              categoryId: Number(values.categoryId),
              amount,
              type: values.type,
              date,
              description
            };

            requests.push(
              api("/transactions", {
                method: "POST",
                body: JSON.stringify(payload),
              })
            );
          }

          await Promise.all(requests);
          message.success(`Criadas ${safeInstallments} parcelas de despesa.`);
        }
      }
      
      handleCancel();
      loadTransactions();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      message.error("Erro ao salvar: " + msg);
    }
  };

  // Filter categories based on selected type in form
  const selectedType = Form.useWatch('type', form);
  const filteredCategories = categories.filter(c => c.type === selectedType);

  const columns = [
    {
      title: 'Data',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
      sorter: (a: Transaction, b: Transaction) => dayjs(a.date).unix() - dayjs(b.date).unix(),
    },
    {
      title: 'Descrição',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Categoria',
      key: 'category',
      render: (_: unknown, record: Transaction) => {
        const category = categories.find(c => c.id === record.category_id);
        return (
          <Tag color="blue" style={{ fontSize: '13px', padding: '4px 8px' }}>
            {category ? `${category.emoji} ${category.name}` : 'Sem Categoria'}
          </Tag>
        );
      },
       sorter: (a: Transaction, b: Transaction) => (a.category_id || 0) - (b.category_id || 0),
    },
    {
      title: 'Valor',
      key: 'amount',
      align: 'right' as const,
      render: (_: unknown, record: Transaction) => {
        const isIncome = record.type === 'INCOME';
        const color = isIncome ? '#3f8600' : '#cf1322';
        return (
          <Text style={{ color, fontWeight: 'bold' }}>
            {isIncome ? '+ ' : '- '}
            {record.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </Text>
        );
      },
      sorter: (a: Transaction, b: Transaction) => a.amount - b.amount,
    },
    {
      title: 'Ações',
      key: 'action',
      align: 'right' as const,
      render: (_: unknown, record: Transaction) => (
        <Space size="small">
          <Tooltip title="Editar">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => handleEdit(record)}
              className="text-primary-600 hover:bg-primary-50"
            />
          </Tooltip>
          <Popconfirm
            title="Excluir transação"
            description="Tem certeza que deseja excluir esta transação?"
            onConfirm={() => handleDelete(record.id)}
            okText="Sim"
            cancelText="Não"
          >
            <Tooltip title="Excluir">
              <Button 
                type="text" 
                danger 
                icon={<DeleteOutlined />} 
                className="hover:bg-primary-50"
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (!profile) return (
    <div className="flex flex-col items-center justify-center h-64 text-slate-500 gap-4">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
            <SearchOutlined style={{ fontSize: 32, color: '#cbd5e1' }} />
        </div>
        <p>Selecione um perfil para visualizar as transações.</p>
    </div>
  );

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card bordered={false} className="shadow-sm">
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Space align="center" size="middle" wrap>
              <div className="flex items-center gap-2 text-slate-700">
                <FilterOutlined className="text-blue-600" />
                <span className="font-semibold">Período:</span>
              </div>
              <RangePicker 
                value={dateRange}
                onChange={(dates) => {
                  if (dates && dates[0] && dates[1]) {
                    setDateRange([dates[0], dates[1]]);
                  }
                }}
                format="DD/MM/YYYY"
                allowClear={false}
              />
            </Space>
          </Col>
          <Col xs={24} md={12} style={{ textAlign: 'right' }}>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={{ display: 'inline-block' }}>
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={handleNew}
                size="large"
              >
                Nova Transação
              </Button>
            </motion.div>
          </Col>
        </Row>
      </Card>

      <Card className="shadow-sm" style={{ marginTop: 12 }}>
        <Table 
          columns={columns} 
          dataSource={transactions} 
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 30 }}
          locale={{ emptyText: 'Nenhuma transação encontrada' }}
        />
      </Card>

      <Modal
        title={editingId ? "Editar Transação" : "Nova Transação"}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            type: 'INCOME',
            date: dayjs()
          }}
        >
          <Form.Item
            name="type"
            label="Tipo"
            rules={[{ required: true, message: 'Selecione o tipo' }]}
          >
            <Select>
              <Option value="INCOME">🟢 Entrada (Receita)</Option>
              <Option value="EXPENSE">🔴 Saída (Despesa)</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="amount"
            label="Valor"
            rules={[{ required: true, message: 'Informe o valor' }]}
            getValueFromEvent={(e: unknown) => {
              const v = (e as { target: { value: string } }).target.value;
              const digits = v.replace(/\D/g, "");
              return digits || "0";
            }}
            getValueProps={(v: unknown) => {
              const s = typeof v === "string" ? v : "0";
              const num = Number(s || "0") / 100;
              return { value: num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) };
            }}
          >
            <Input
              style={{ width: '100%' }}
              inputMode="numeric"
            />
          </Form.Item>

          {selectedType === "EXPENSE" && !editingId && (
            <Form.Item
              name="installments"
              label="Parcelado em:"
              initialValue="1"
              rules={[{ required: true, message: 'Informe o número de parcelas' }]}
            >
              <Select>
                {Array.from({ length: 60 }, (_, index) => {
                  const value = (index + 1).toString();
                  return (
                    <Option key={value} value={value}>
                      {value}
                    </Option>
                  );
                })}
              </Select>
            </Form.Item>
          )}

          <Form.Item
            name="description"
            label="Descrição"
            rules={[{ required: true, message: 'Informe a descrição' }]}
          >
            <Input placeholder="Ex: Salário, Mercado..." />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="date"
                label="Data"
                rules={[{ required: true, message: 'Selecione a data' }]}
              >
                <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="categoryId"
                label="Categoria"
                rules={[{ required: true, message: 'Selecione a categoria' }]}
              >
                <Select placeholder="Selecione...">
                  {filteredCategories.map(c => (
                    <Option key={c.id} value={c.id}>
                      {c.emoji} {c.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

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
