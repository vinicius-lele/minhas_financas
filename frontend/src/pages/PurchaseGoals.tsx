import { useEffect, useMemo, useState } from "react";
import { Card, Col, Row, Typography, Form, Input, Select, DatePicker, Button, Table, Space, Tag, Popconfirm, Empty, message, Modal } from "antd";
import { PlusOutlined, CheckCircleOutlined, DeleteOutlined, SearchOutlined, EditOutlined, SaveOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { api } from "../services/api";
import { GoalProgress } from "../components/GoalProgress";
import { useProfile } from "../contexts/ProfileContext";
import type { GoalPriority, PurchaseGoal } from "../types";

const { Title } = Typography;

type ListResponse = { data: PurchaseGoal[]; total: number };

export function PurchaseGoals() {
  const { profile } = useProfile();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PurchaseGoal[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<{ q?: string; category?: string; priority?: string; status?: string }>({});
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [editing, setEditing] = useState<PurchaseGoal | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const priorityOptions: GoalPriority[] = ["Baixa", "Média", "Alta", "Urgente"];
  const statusOptions = [
    { label: "Ativas", value: "active" },
    { label: "Concluídas", value: "completed" },
  ];

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.q) params.set("q", filters.q);
    if (filters.category) params.set("category", filters.category);
    if (filters.priority) params.set("priority", filters.priority);
    if (filters.status) params.set("status", filters.status);
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    return `?${params.toString()}`;
  }, [filters, page, pageSize]);

  async function loadData() {
    if (!profile) return;
    try {
      setLoading(true);
      const res = await api<ListResponse>(`/purchase-goals${queryString}`);
      setData(res.data);
      setTotal(res.total);
    } catch (err) {
      message.error("Erro ao carregar metas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, queryString]);

  async function handleCreate(values: any) {
    try {
      await api("/purchase-goals", {
        method: "POST",
        body: JSON.stringify({
          name: values.name,
          category: values.category || null,
          target_amount: Number(values.target_amount || "0") / 100,
          current_amount_saved: Number(values.current_amount_saved || "0") / 100,
          priority: values.priority || null,
          deadline: values.deadline ? dayjs(values.deadline).format("YYYY-MM-DD") : null,
          notes: values.notes || null,
        }),
      });
      form.resetFields();
      message.success("Meta criada");
      setPage(1);
      await loadData();
      setIsCreateOpen(false);
    } catch {
      message.error("Falha ao criar meta");
    }
  }

  async function handleComplete(goal: PurchaseGoal) {
    try {
      await api(`/purchase-goals/${goal.id}/complete`, { method: "POST" });
      message.success("Meta marcada como comprada");
      await loadData();
    } catch {
      message.error("Falha ao concluir meta");
    }
  }

  async function handleDelete(goal: PurchaseGoal) {
    try {
      await api(`/purchase-goals/${goal.id}`, { method: "DELETE" });
      message.success("Meta removida");
      await loadData();
    } catch {
      message.error("Falha ao remover meta");
    }
  }

  function openEdit(goal: PurchaseGoal) {
    setEditing(goal);
    setIsEditOpen(true);
    editForm.setFieldsValue({
      name: goal.name,
      category: goal.category || undefined,
      target_amount: Math.round((goal.target_amount ?? 0) * 100).toString(),
      current_amount_saved: Math.round((goal.current_amount_saved ?? 0) * 100).toString(),
      priority: goal.priority || undefined,
      deadline: goal.deadline ? dayjs(goal.deadline) : undefined,
      notes: goal.notes || undefined,
    });
  }

  async function handleUpdate(values: any) {
    if (!editing) return;
    try {
      await api(`/purchase-goals/${editing.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: values.name,
          category: values.category || null,
          target_amount: Number(values.target_amount || "0") / 100,
          current_amount_saved: Number(values.current_amount_saved || "0") / 100,
          priority: values.priority || null,
          deadline: values.deadline ? dayjs(values.deadline).format("YYYY-MM-DD") : null,
          notes: values.notes || null,
        }),
      });
      message.success("Meta atualizada");
      setIsEditOpen(false);
      setEditing(null);
      await loadData();
    } catch {
      message.error("Falha ao atualizar meta");
    }
  }

  function openCreate() {
    setIsCreateOpen(true);
    form.resetFields();
    form.setFieldValue("target_amount", "0");
    form.setFieldValue("current_amount_saved", "0");
  }

  const columns = [
    {
      title: "Item",
      dataIndex: "name",
      key: "name",
      render: (_: any, record: PurchaseGoal) => (
        <Space direction="vertical" size={0}>
          <span className="font-medium">{record.name}</span>
          {record.notes && <span className="text-slate-400 text-xs">{record.notes}</span>}
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
      title: "Prioridade",
      dataIndex: "priority",
      key: "priority",
      render: (p: string | null) => {
        const color =
          p === "Urgente" ? "red" : p === "Alta" ? "orange" : p === "Média" ? "blue" : "default";
        return p ? <Tag color={color}>{p}</Tag> : <Tag>Normal</Tag>;
      },
    },
    {
      title: "Prazo",
      dataIndex: "deadline",
      key: "deadline",
      render: (d: string | null) => (d ? dayjs(d).format("DD/MM/YYYY") : "-"),
    },
    {
      title: "Valor",
      dataIndex: "target_amount",
      key: "target_amount",
      render: (v: number) =>
        Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
    },
    {
      title: "Guardado",
      dataIndex: "current_amount_saved",
      key: "current_amount_saved",
      render: (v: number) =>
        Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
    },
    {
      title: "Progresso",
      key: "progress",
      render: (_: any, record: PurchaseGoal) => (
        <GoalProgress current={record.current_amount_saved} target={record.target_amount} />
      ),
    },
    {
      title: "Status",
      dataIndex: "is_completed",
      key: "is_completed",
      render: (v: number) =>
        v ? <Tag color="green">Concluída</Tag> : <Tag color="processing">Ativa</Tag>,
    },
    {
      title: "Ações",
      key: "actions",
      render: (_: any, record: PurchaseGoal) => (
        <Space>
          <Button
            type="default"
            icon={<EditOutlined />}
            onClick={() => openEdit(record)}
          >
            Editar
          </Button>
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            disabled={record.is_completed === 1}
            onClick={() => handleComplete(record)}
          >
            Comprar
          </Button>
          <Popconfirm
            title="Remover meta?"
            okText="Remover"
            cancelText="Cancelar"
            onConfirm={() => handleDelete(record)}
          >
            <Button danger icon={<DeleteOutlined />}>Excluir</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (!profile) {
    return <Empty description="Selecione um perfil para visualizar as metas." style={{ marginTop: 100 }} />;
  }

  return (
    <div className="space-y-4">
      <Title level={2} style={{ margin: 0 }}>Metas de Compra</Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={24} lg={24}>
          <Card bordered={false} className="shadow-sm">
            <Row justify="space-between" align="middle" gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <div className="flex items-center gap-2 text-slate-700">
                  <span className="font-semibold">Gerenciador de Metas</span>
                </div>
              </Col>
              <Col xs={24} md={12} style={{ textAlign: 'right' }}>
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} size="large">
                  Nova Meta
                </Button>
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} md={24} lg={24}>
          <Card bordered={false} className="shadow-sm" title="Metas">
            <Row gutter={8} style={{ marginBottom: 12 }}>
              <Col xs={24} md={10}>
                <Input
                  allowClear
                  prefix={<SearchOutlined />}
                  placeholder="Buscar por nome"
                  onChange={(e) => {
                    setPage(1);
                    setFilters((f) => ({ ...f, q: e.target.value || undefined }));
                  }}
                />
              </Col>
              <Col xs={12} md={6}>
                <Input
                  allowClear
                  placeholder="Categoria"
                  onChange={(e) => {
                    setPage(1);
                    setFilters((f) => ({ ...f, category: e.target.value || undefined }));
                  }}
                />
              </Col>
              <Col xs={12} md={4}>
                <Select
                  allowClear
                  placeholder="Prioridade"
                  className="w-full"
                  options={priorityOptions.map(p => ({ label: p, value: p }))}
                  onChange={(v) => {
                    setPage(1);
                    setFilters((f) => ({ ...f, priority: v || undefined }));
                  }}
                />
              </Col>
              <Col xs={12} md={4}>
                <Select
                  allowClear
                  placeholder="Status"
                  className="w-full"
                  options={statusOptions}
                  onChange={(v) => {
                    setPage(1);
                    setFilters((f) => ({ ...f, status: v || undefined }));
                  }}
                />
              </Col>
            </Row>

            <Table
              rowKey="id"
              loading={loading}
              dataSource={data}
              columns={columns as any}
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
        title="Nova Meta"
        open={isCreateOpen}
        onCancel={() => setIsCreateOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form layout="vertical" form={form} onFinish={handleCreate}>
          <Form.Item name="name" label="Nome" rules={[{ required: true }]}>
            <Input placeholder="Ex.: Notebook para trabalho" />
          </Form.Item>
          <Row gutter={8}>
            <Col span={12}>
              <Form.Item
                name="target_amount"
                label="Valor Alvo"
                rules={[{ required: true }]}
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
                <Input inputMode="numeric" placeholder="0,00" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="current_amount_saved"
                label="Já Guardado"
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
                <Input inputMode="numeric" placeholder="0,00" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={8}>
            <Col span={12}>
              <Form.Item name="category" label="Categoria">
                <Input placeholder="Ex.: Tecnologia" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="priority" label="Prioridade">
                <Select allowClear options={priorityOptions.map(p => ({ label: p, value: p }))} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={8}>
            <Col span={12}>
              <Form.Item name="deadline" label="Prazo">
                <DatePicker className="w-full" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="notes" label="Observações">
                <Input placeholder="Opcional" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item className="mb-0 flex justify-end">
            <Space>
              <Button onClick={() => setIsCreateOpen(false)}>
                Cancelar
              </Button>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                Salvar
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="Editar Meta"
        open={isEditOpen}
        onCancel={() => { setIsEditOpen(false); setEditing(null); }}
        footer={null}
        destroyOnClose
      >
        <Form layout="vertical" form={editForm} onFinish={handleUpdate}>
          <Form.Item name="name" label="Nome" rules={[{ required: true }]}>
            <Input placeholder="Ex.: Notebook para trabalho" />
          </Form.Item>
          <Row gutter={8}>
            <Col span={12}>
              <Form.Item
                name="target_amount"
                label="Valor Alvo"
                rules={[{ required: true }]}
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
                <Input inputMode="numeric" placeholder="0,00" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="current_amount_saved"
                label="Já Guardado"
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
                <Input inputMode="numeric" placeholder="0,00" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={8}>
            <Col span={12}>
              <Form.Item name="category" label="Categoria">
                <Input placeholder="Ex.: Tecnologia" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="priority" label="Prioridade">
                <Select allowClear options={priorityOptions.map(p => ({ label: p, value: p }))} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={8}>
            <Col span={12}>
              <Form.Item name="deadline" label="Prazo">
                <DatePicker className="w-full" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="notes" label="Observações">
                <Input placeholder="Opcional" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item className="mb-0 flex justify-end">
            <Space>
              <Button onClick={() => { setIsEditOpen(false); setEditing(null); }}>
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
