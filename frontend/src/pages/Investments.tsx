import { useEffect, useMemo, useState } from "react";
import {
  Card,
  Col,
  Row,
  Typography,
  Form,
  Input,
  Button,
  Table,
  Space,
  Popconfirm,
  Empty,
  message,
  Modal,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  SaveOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { api } from "../services/api";
import { useProfile } from "../contexts/ProfileContext";
import type { Investment, InvestmentsSummary } from "../types";
import type { ColumnsType } from "antd/es/table";

const { Title, Text } = Typography;

type ListResponse = { data: Investment[]; total: number };

type InvestmentFormValues = {
  name: string;
  category?: string;
  broker?: string;
  invested_amount?: string;
  current_value?: string;
};

export function Investments() {
  const { profile } = useProfile();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Investment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<{
    q?: string;
    category?: string;
    broker?: string;
  }>({});
  const [form] = Form.useForm<InvestmentFormValues>();
  const [editForm] = Form.useForm<InvestmentFormValues>();
  const [editing, setEditing] = useState<Investment | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [summary, setSummary] = useState<InvestmentsSummary | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.q) params.set("q", filters.q);
    if (filters.category) params.set("category", filters.category);
    if (filters.broker) params.set("broker", filters.broker);
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    return `?${params.toString()}`;
  }, [filters, page, pageSize]);

  const formatCurrency = (value: number | string | undefined) =>
    Number(value ?? 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  async function loadSummary() {
    if (!profile) return;
    try {
      const res = await api<InvestmentsSummary>("/investments/summary");
      setSummary(res);
    } catch {
      setSummary(null);
    }
  }

  async function loadData() {
    if (!profile) return;
    try {
      setLoading(true);
      const res = await api<ListResponse>(`/investments${queryString}`);
      setData(res.data);
      setTotal(res.total);
    } catch {
      message.error("Erro ao carregar investimentos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, queryString]);

  useEffect(() => {
    loadSummary();
  }, [profile]);

  function openCreate() {
    setIsCreateOpen(true);
    form.resetFields();
  }

  function openEdit(investment: Investment) {
    setEditing(investment);
    setIsEditOpen(true);
    editForm.setFieldsValue({
      name: investment.name,
      category: investment.category ?? undefined,
      broker: investment.broker ?? undefined,
      invested_amount: Math.round(investment.invested_amount * 100).toString(),
      current_value: Math.round(investment.current_value * 100).toString(),
    });
  }

  async function handleCreate(values: InvestmentFormValues) {
    try {
      const invested = Number(values.invested_amount || "0") / 100;
      const current =
        values.current_value && values.current_value.trim() !== ""
          ? Number(values.current_value) / 100
          : undefined;
      await api("/investments", {
        method: "POST",
        body: JSON.stringify({
          name: values.name,
          category: values.category || null,
          broker: values.broker || null,
          invested_amount: invested,
          current_value: current,
        }),
      });
      form.resetFields();
      message.success("Investimento cadastrado");
      setPage(1);
      await loadData();
      await loadSummary();
      setIsCreateOpen(false);
    } catch {
      message.error("Falha ao cadastrar investimento");
    }
  }

  async function handleUpdate(values: InvestmentFormValues) {
    if (!editing) return;
    try {
      const invested = Number(values.invested_amount || "0") / 100;
      const current =
        values.current_value && values.current_value.trim() !== ""
          ? Number(values.current_value) / 100
          : undefined;
      await api(`/investments/${editing.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: values.name,
          category: values.category || null,
          broker: values.broker || null,
          invested_amount: invested,
          current_value: current,
        }),
      });
      message.success("Investimento atualizado");
      setIsEditOpen(false);
      setEditing(null);
      await loadData();
      await loadSummary();
    } catch {
      message.error("Falha ao atualizar investimento");
    }
  }

  async function handleDelete(investment: Investment) {
    try {
      await api(`/investments/${investment.id}`, {
        method: "DELETE",
      });
      message.success("Investimento removido");
      await loadData();
      await loadSummary();
    } catch {
      message.error("Falha ao remover investimento");
    }
  }

  const columns: ColumnsType<Investment> = [
    {
      title: "Nome",
      dataIndex: "name",
      key: "name",
      render: (value: string, record) => (
        <Space direction="vertical" size={0}>
          <span className="font-medium">{value}</span>
          {(record.category || record.broker) && (
            <span className="text-slate-400 text-xs">
              {[record.category, record.broker].filter(Boolean).join(" • ")}
            </span>
          )}
        </Space>
      ),
    },
    {
      title: "Categoria",
      dataIndex: "category",
      key: "category",
      render: (c: string | null) => c || "-",
    },
    {
      title: "Corretora",
      dataIndex: "broker",
      key: "broker",
      render: (b: string | null) => b || "-",
    },
    {
      title: "Aplicado",
      dataIndex: "invested_amount",
      key: "invested_amount",
      render: (v: number) => formatCurrency(v),
    },
    {
      title: "Valor atual",
      dataIndex: "current_value",
      key: "current_value",
      render: (v: number) => formatCurrency(v),
    },
    {
      title: "Rentabilidade",
      key: "profit",
      render: (_, record) => {
        const invested = Number(record.invested_amount ?? 0);
        const current = Number(record.current_value ?? 0);
        const diff = current - invested;
        const percent =
          invested > 0 ? ((diff / invested) * 100).toFixed(1) : "0.0";
        const positive = diff >= 0;
        return (
          <Space direction="vertical" size={0}>
            <span
              className={
                positive ? "text-green-600 font-medium" : "text-red-600 font-medium"
              }
            >
              {formatCurrency(diff)}
            </span>
            <span className="text-xs text-slate-400">{percent}%</span>
          </Space>
        );
      },
    },
    {
      title: "Ações",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            type="default"
            icon={<EditOutlined />}
            onClick={() => openEdit(record)}
          >
            Editar
          </Button>
          <Popconfirm
            title="Remover investimento?"
            okText="Remover"
            cancelText="Cancelar"
            onConfirm={() => handleDelete(record)}
          >
            <Button danger icon={<DeleteOutlined />}>
              Excluir
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (!profile) {
    return (
      <Empty
        description="Selecione um perfil para visualizar os investimentos."
        style={{ marginTop: 100 }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <Title level={2} style={{ margin: 0 }}>
        Investimentos
      </Title>

      {summary && (
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} md={24} lg={24}>
            <Card bordered={false} className="shadow-sm">
              <Row gutter={[16, 16]}>
                <Col xs={24} md={8}>
                  <div className="bg-surface rounded-lg p-3 h-full flex flex-col justify-between">
                    <Text type="secondary" className="text-xs">
                      Total aplicado
                    </Text>
                    <div className="text-2xl font-bold mt-1">
                      {formatCurrency(summary.overview.totalInvested)}
                    </div>
                    <Text type="secondary" className="text-xs mt-2">
                      {summary.overview.count}{" "}
                      {summary.overview.count === 1
                        ? "investimento"
                        : "investimentos"}
                    </Text>
                  </div>
                </Col>
                <Col xs={24} md={8}>
                  <div className="bg-surface rounded-lg p-3 h-full flex flex-col justify-between">
                    <Text type="secondary" className="text-xs">
                      Valor atual
                    </Text>
                    <div className="text-2xl font-bold mt-1">
                      {formatCurrency(summary.overview.totalCurrent)}
                    </div>
                    <Text type="secondary" className="text-xs mt-2">
                      Diferença total:{" "}
                      {formatCurrency(summary.overview.totalProfit)}
                    </Text>
                  </div>
                </Col>
                <Col xs={24} md={8}>
                  <div className="bg-surface rounded-lg p-3 h-full flex flex-col justify-between">
                    <Text type="secondary" className="text-xs">
                      Rentabilidade acumulada
                    </Text>
                    <div
                      className={
                        summary.overview.totalProfit >= 0
                          ? "text-2xl font-bold mt-1 text-green-600"
                          : "text-2xl font-bold mt-1 text-red-600"
                      }
                    >
                      {summary.overview.totalProfitPercent.toFixed(1)}%
                    </div>
                    <Text type="secondary" className="text-xs mt-2">
                      Considera apenas valores aplicados vs. valor atual
                    </Text>
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      )}

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={24} lg={24}>
          <Card bordered={false} className="shadow-sm">
            <Row justify="space-between" align="middle" gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <div className="flex items-center gap-2 text-slate-700">
                  <span className="font-semibold">Carteira de investimentos</span>
                </div>
              </Col>
              <Col xs={24} md={12} style={{ textAlign: "right" }}>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={openCreate}
                  size="large"
                >
                  Novo investimento
                </Button>
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} md={24} lg={24}>
          <Card bordered={false} className="shadow-sm" title="Investimentos">
            <Row gutter={8} style={{ marginBottom: 12 }}>
              <Col xs={24} md={10}>
                <Input
                  placeholder="Buscar por nome"
                  prefix={<SearchOutlined />}
                  allowClear
                  onChange={(e) =>
                    setFilters((f) => ({
                      ...f,
                      q: e.target.value || undefined,
                    }))
                  }
                />
              </Col>
              <Col xs={24} md={7}>
                <Input
                  placeholder="Filtrar por categoria"
                  allowClear
                  onChange={(e) =>
                    setFilters((f) => ({
                      ...f,
                      category: e.target.value || undefined,
                    }))
                  }
                />
              </Col>
              <Col xs={24} md={7}>
                <Input
                  placeholder="Filtrar por corretora"
                  allowClear
                  onChange={(e) =>
                    setFilters((f) => ({
                      ...f,
                      broker: e.target.value || undefined,
                    }))
                  }
                />
              </Col>
            </Row>

            <Table
              rowKey="id"
              loading={loading}
              dataSource={data}
              columns={columns}
              pagination={{
                current: page,
                pageSize,
                total,
                showSizeChanger: true,
                onChange: (p, ps) => {
                  setPage(p);
                  setPageSize(ps);
                },
              }}
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title="Novo investimento"
        open={isCreateOpen}
        onCancel={() => setIsCreateOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form layout="vertical" form={form} onFinish={handleCreate}>
          <Form.Item
            name="name"
            label="Nome"
            rules={[{ required: true, message: "Informe o nome" }]}
          >
            <Input placeholder="Ex.: Tesouro Selic, Ação XYZ3" />
          </Form.Item>
          <Row gutter={8}>
            <Col span={12}>
              <Form.Item name="category" label="Categoria">
                <Input placeholder="Ex.: Renda Fixa, Ações" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="broker" label="Corretora">
                <Input placeholder="Ex.: Nubank, XP, Rico" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={8}>
            <Col span={12}>
              <Form.Item
                name="invested_amount"
                label="Total investido"
                rules={[{ required: true, message: "Informe o valor aplicado" }]}
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
                      currency: "BRL",
                    }),
                  };
                }}
              >
                <Input
                  inputMode="numeric"
                  placeholder="Ex.: tudo o que você já colocou nesse investimento"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="current_value"
                label="Valor atual na corretora (opcional)"
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
                      currency: "BRL",
                    }),
                  };
                }}
              >
                <Input
                  inputMode="numeric"
                  placeholder="Se não souber, deixe em branco"
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item className="mb-0 flex justify-end">
            <Space>
              <Button onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                Salvar
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Editar investimento"
        open={isEditOpen}
        onCancel={() => {
          setIsEditOpen(false);
          setEditing(null);
        }}
        footer={null}
        destroyOnClose
      >
        <Form layout="vertical" form={editForm} onFinish={handleUpdate}>
          <Form.Item
            name="name"
            label="Nome"
            rules={[{ required: true, message: "Informe o nome" }]}
          >
            <Input placeholder="Ex.: Tesouro Selic, Ação XYZ3" />
          </Form.Item>
          <Row gutter={8}>
            <Col span={12}>
              <Form.Item name="category" label="Categoria">
                <Input placeholder="Ex.: Renda Fixa, Ações" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="broker" label="Corretora">
                <Input placeholder="Ex.: Nubank, XP, Rico" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={8}>
            <Col span={12}>
              <Form.Item
                name="invested_amount"
                label="Total investido"
                rules={[{ required: true, message: "Informe o valor aplicado" }]}
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
                      currency: "BRL",
                    }),
                  };
                }}
              >
                <Input
                  inputMode="numeric"
                  placeholder="Ex.: tudo o que você já colocou nesse investimento"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="current_value"
                label="Valor atual na corretora (opcional)"
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
                      currency: "BRL",
                    }),
                  };
                }}
              >
                <Input
                  inputMode="numeric"
                  placeholder="Se não souber, deixe em branco"
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item className="mb-0 flex justify-end">
            <Space>
              <Button
                onClick={() => {
                  setIsEditOpen(false);
                  setEditing(null);
                }}
              >
                Cancelar
              </Button>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                Salvar
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
