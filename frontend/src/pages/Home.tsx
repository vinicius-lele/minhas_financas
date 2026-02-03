import { useState, type FormEvent } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";

export function Home() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);

  const features = [
    {
      key: "dashboard",
      title: "Dashboard em tempo real",
      description:
        "Visualize rapidamente entradas, saídas, saldo do mês e principais indicadores em um único painel.",
      badge: "Visão geral",
      image: "/home/dashboard.png",
      gradient: "linear-gradient(to right, #7c2d12, #c05621, #ea580c)",
    },
    {
      key: "transactions",
      title: "Controle de transações",
      description:
        "Registre receitas e despesas, filtre por período e categoria e acompanhe seu histórico financeiro.",
      badge: "Movimentações",
      image: "/home/transacao.png",
      gradient: "linear-gradient(to right, #c05621, #ea580c, #f97316)",
    },
    {
      key: "categories",
      title: "Categorias personalizadas",
      description:
        "Organize seus gastos e receitas em categorias com ícones e cores, adaptadas à sua realidade.",
      badge: "Organização",
      image: "/home/categoria.png",
      gradient: "linear-gradient(to right, #ea580c, #f97316, #fb923c)",
    },
    {
      key: "budgets",
      title: "Orçamentos mensais",
      description:
        "Defina limites de gasto por categoria, acompanhe o uso do orçamento e evite surpresas ao final do mês.",
      badge: "Disciplina",
      image: "/home/orcamento.png",
      gradient: "linear-gradient(to right, #fb923c, #f97316, #facc15)",
    },
    {
      key: "purchase-goals",
      title: "Metas de compra",
      description:
        "Crie objetivos, registre quanto já foi guardado para cada meta e acompanhe o percentual de conclusão.",
      badge: "Objetivos",
      image: "/home/meta.png",
      gradient: "linear-gradient(to right, #facc15, #fb923c, #f97316)",
    },
    {
      key: "investments",
      title: "Investimentos",
      description:
        "Registre aplicações, acompanhe o valor atual da carteira e a rentabilidade acumulada.",
      badge: "Patrimônio",
      image: "/home/investimento.png",
      gradient: "linear-gradient(to right, #7c2d12, #ea580c, #f97316)",
    },
    {
      key: "profiles",
      title: "Perfis separados",
      description:
        "Separe finanças pessoais, da família ou de projetos em perfis independentes, cada um com seus dados.",
      badge: "Organização avançada",
      image: "/home/perfil.png",
      gradient: "linear-gradient(to right, #fb923c, #f97316, #f97316)",
    },
    {
      key: "themes",
      title: "Temas personalizados",
      description:
        "O seu perfil tem que ter a sua cara! Escolha entre vários temas o que mais lhe agrada.",
      badge: "Temas",
      image: "/home/tema.png",
      gradient: "linear-gradient(to right, #f97316, #ea580c, #7c2d12)",
    },
  ];

  const handleOpenLogin = () => {
    setLoginError(null);
    setIsLoginOpen(true);
  };

  const handleCloseLogin = () => {
    if (loginLoading) return;
    setIsLoginOpen(false);
  };

  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || "/";

  const handleLoginSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!identifier || !password) {
      setLoginError("Informe usuário/email e senha.");
      return;
    }
    try {
      setLoginLoading(true);
      setLoginError(null);
      await login(identifier, password);
      if (!remember) {
        sessionStorage.setItem("authSession", "1");
      }
      setIsLoginOpen(false);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      let msg =
        err instanceof Error ? err.message : "Não foi possível entrar";

      if (msg === "Não autenticado") {
        msg = "Usuário ou senha inválidos.";
      }

      setLoginError(msg);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleOpenRegister = () => {
    setRegError(null);
    setIsRegisterOpen(true);
  };

  const handleCloseRegister = () => {
    if (regLoading) return;
    setIsRegisterOpen(false);
  };

  const handleLoginToRegister = () => {
    if (loginLoading) return;
    setIsLoginOpen(false);
    setLoginError(null);
    setRegError(null);
    setIsRegisterOpen(true);
  };

  const handleRegisterSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!regUsername || !regEmail || !regPassword || !regConfirm) {
      setRegError("Preencha todos os campos.");
      return;
    }
    if (regPassword !== regConfirm) {
      setRegError("As senhas não conferem.");
      return;
    }
    try {
      setRegLoading(true);
      setRegError(null);
      await register(regUsername, regEmail, regPassword, regConfirm);
      setIsRegisterOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Não foi possível criar a conta";
      setRegError(msg);
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div
      className="min-vh-100 d-flex flex-column"
      style={{ backgroundColor: "#ffedd5" }}
    >
      <header
        className="w-100 border-bottom position-sticky top-0 z-3"
        style={{ borderColor: "#8f4018", backgroundColor: "#5a3415" }}
      >
        <div className="container py-3 d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center fw-bold"
              style={{
                width: 32,
                height: 32,
                backgroundColor: "#fef3e2",
                color: "#5a3415",
              }}
            >
              MF
            </div>
            <span
              className="fw-semibold fs-5"
              style={{ color: "#fef3e2" }}
            >
              Minhas Finanças
            </span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="btn btn-sm btn-link text-decoration-none px-3"
              style={{ color: "#fef3e2" }}
              onClick={handleOpenLogin}
            >
              Entrar
            </button>
            <button
              type="button"
              className="btn btn-sm"
              style={{
                backgroundColor: "#f97316",
                borderColor: "#f97316",
                color: "#ffffff",
              }}
              onClick={handleOpenRegister}
            >
              Criar conta
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow-1">
        <section
          className="text-white"
          style={{
            background:
              "linear-gradient(to bottom, #7c2d12, #c05621, #ea580c)",
          }}
        >
          <div className="container py-5">
            <div className="row align-items-center gy-4">
              <div className="col-12 col-md-7">
                <div className="d-inline-flex align-items-center px-3 py-1 mb-3 rounded-pill">
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      letterSpacing: 0.2,
                      backgroundColor: "rgba(255,255,255,0.15)",
                      borderRadius: 999,
                      paddingInline: 16,
                    }}
                  >
                    Gerenciador financeiro online
                  </span>
                </div>

                <h1
                  className="fw-bold"
                  style={{ color: "#ffffff", marginBottom: 12 }}
                >
                  Deixe o controle do seu dinheiro mais simples
                </h1>

                <p
                  className="mb-4"
                  style={{ color: "#fffbeb", fontSize: 16 }}
                >
                  Organize contas, registre receitas e despesas, crie
                  orçamentos mensais e acompanhe objetivos em um só lugar.
                  Entenda para onde o dinheiro está indo e tome decisões
                  com mais segurança.
                </p>

                <div className="d-flex flex-wrap gap-3 mt-2">
                  <button
                    type="button"
                    className="btn btn-lg"
                    style={{
                      boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
                      backgroundColor: "#b5531e",
                      borderColor: "#b5531e",
                      color: "#ffffff",
                    }}
                    onClick={handleOpenRegister}
                  >
                    Começar gratuitamente
                  </button>
                  <button
                    type="button"
                    className="btn btn-lg btn-outline-light"
                    onClick={handleOpenLogin}
                  >
                    Já tenho conta
                  </button>
                </div>
              </div>

              <div className="col-12 col-md-5">
                <div
                  className="rounded-4 shadow-lg p-4"
                  style={{
                    maxWidth: 420,
                    marginLeft: "auto",
                    backgroundColor: "#ffedd5",
                    border: "1px solid #fb923c",
                    color: "#5a3415",
                  }}
                >
                  <h2
                    className="h5 fw-semibold mb-2"
                    style={{ color: "#5a3415" }}
                  >
                    Seu painel financeiro em poucos minutos
                  </h2>
                  <p
                    className="mb-3"
                    style={{ color: "#8b5a2b", fontSize: 14 }}
                  >
                    Crie sua conta, escolha um perfil (pessoal, família,
                    projetos) e comece a registrar suas movimentações. O
                    dashboard mostra o resumo do mês logo na primeira
                    tela.
                  </p>

                  <div className="d-flex flex-column gap-3 mb-3">
                    <div className="d-flex gap-2">
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center"
                        style={{
                          width: 32,
                          height: 32,
                          backgroundColor: "#fffbeb",
                          color: "#b45309",
                          fontSize: 18,
                        }}
                      >
                        ●
                      </div>
                      <div>
                        <div
                          className="fw-semibold"
                          style={{ color: "#5a3415" }}
                        >
                          Resumo do mês
                        </div>
                        <div
                          style={{ fontSize: 12, color: "#8b5a2b" }}
                        >
                          Entradas, saídas e saldo em destaque.
                        </div>
                      </div>
                    </div>

                    <div className="d-flex gap-2">
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center"
                        style={{
                          width: 32,
                          height: 32,
                          backgroundColor: "#fed7aa",
                          color: "#c05621",
                          fontSize: 18,
                        }}
                      >
                        ●
                      </div>
                      <div>
                        <div
                          className="fw-semibold"
                          style={{ color: "#5a3415" }}
                        >
                          Metas e sonhos
                        </div>
                        <div
                          style={{ fontSize: 12, color: "#8b5a2b" }}
                        >
                          Acompanhe o quanto já foi poupado para cada
                          objetivo.
                        </div>
                      </div>
                    </div>

                    <div className="d-flex gap-2">
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center"
                        style={{
                          width: 32,
                          height: 32,
                          backgroundColor: "#fed7aa",
                          color: "#92400e",
                          fontSize: 18,
                        }}
                      >
                        ●
                      </div>
                      <div>
                        <div
                          className="fw-semibold"
                          style={{ color: "#5a3415" }}
                        >
                          Orçamentos mensais
                        </div>
                        <div
                          style={{ fontSize: 12, color: "#8b5a2b" }}
                        >
                          Defina limites por categoria e monitore o uso
                          ao longo do mês.
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn w-100"
                    style={{
                      backgroundColor: "#8f4018",
                      borderColor: "#8f4018",
                      color: "#ffffff",
                    }}
                    onClick={handleOpenLogin}
                  >
                    Entrar na minha conta
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          className="border-top"
          style={{ backgroundColor: "#fed7aa" }}
        >
          <div className="container py-5 text-center">
            <h2
              className="h3 fw-semibold mb-2"
              style={{ color: "#5a3415" }}
            >
              Recursos do Minhas Finanças
            </h2>
            <p style={{ color: "#8b5a2b" }}>
              Tudo o que você precisa para organizar suas finanças, em blocos simples de entender.
            </p>
          </div>
        </section>

        {features.map((feature, index) => {
          const isImageLeft = index % 2 === 1;
          return (
            <section
              key={feature.key}
              className="text-white"
              style={{
                background: feature.gradient,
              }}
            >
              <div className="container py-5">
                <div className="row align-items-center gy-4">
                  <div
                    className={`col-12 col-md-6 ${
                      isImageLeft ? "order-md-2" : ""
                    }`}
                  >
                    <div
                      className="d-inline-flex align-items-center px-3 py-1 mb-3 rounded-pill"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.18)",
                        color: "#fefce8",
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      {feature.badge}
                    </div>
                    <h2
                      className="fw-bold mb-2"
                      style={{ color: "#ffffff", fontSize: 28 }}
                    >
                      {feature.title}
                    </h2>
                    <p
                      className="mb-0"
                      style={{ color: "#fffbeb", fontSize: 16 }}
                    >
                      {feature.description}
                    </p>
                  </div>
                  <div
                    className={`col-12 col-md-6 ${
                      isImageLeft ? "order-md-1" : ""
                    }`}
                  >
                    <div className="d-flex justify-content-center">
                      <img
                        src={feature.image}
                        alt={feature.title}
                        style={{
                          maxWidth: "100%",
                          maxHeight: 260,
                          objectFit: "contain",
                          borderRadius: 16,
                          boxShadow: "0 18px 40px rgba(0,0,0,0.18)",
                          backgroundColor: "rgba(255,255,255,0.9)",
                          padding: 12,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          );
        })}
      </main>

      <footer
        className="border-top"
        style={{ backgroundColor: "#fef3e2", color: "#8b5a2b" }}
      >
        <div className="container py-3 d-flex flex-column flex-md-row align-items-center justify-content-between gap-2 small">
          <span>
            Minhas Finanças • gerenciador financeiro online
          </span>
          <span>
            Faça login ou crie sua conta para acessar o painel completo
          </span>
        </div>
      </footer>

      {isLoginOpen && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
          style={{
            backgroundColor: "rgba(15,23,42,0.55)",
            zIndex: 1050,
          }}
        >
          <div
            className="bg-white rounded-4 shadow-lg p-4 p-md-5"
            style={{ maxWidth: 420, width: "90%" }}
          >
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div>
                <h2 className="h5 mb-1" style={{ color: "#5a3415" }}>
                  Entrar
                </h2>
                <p className="mb-0 small" style={{ color: "#8b5a2b" }}>
                  Acesse suas finanças com segurança.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-link text-decoration-none"
                onClick={handleCloseLogin}
                disabled={loginLoading}
                style={{ color: "#6b7280" }}
              >
                fechar
              </button>
            </div>

            <form onSubmit={handleLoginSubmit} className="d-flex flex-column gap-3">
              <div>
                <label className="form-label mb-1" style={{ color: "#5a3415", fontSize: 13 }}>
                  Usuário ou Email
                </label>
                <input
                  className="form-control"
                  placeholder="usuario ou email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  disabled={loginLoading}
                />
              </div>

              <div>
                <label className="form-label mb-1" style={{ color: "#5a3415", fontSize: 13 }}>
                  Senha
                </label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loginLoading}
                />
              </div>

              <div className="d-flex justify-content-between align-items-center">
                <div className="form-check">
                  <input
                    id="loginRemember"
                    type="checkbox"
                    className="form-check-input"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    disabled={loginLoading}
                  />
                  <label
                    className="form-check-label"
                    htmlFor="loginRemember"
                    style={{ fontSize: 13 }}
                  >
                    Lembrar-me
                  </label>
                </div>
              </div>

              {loginError && (
                <div
                  className="small mt-1"
                  style={{ color: "#b91c1c" }}
                >
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                className="btn w-100 mt-2"
                style={{
                  backgroundColor: "#8f4018",
                  borderColor: "#8f4018",
                  color: "#ffffff",
                }}
                disabled={loginLoading}
              >
                {loginLoading ? "Entrando..." : "Entrar"}
              </button>

              <div className="text-center mt-2 small" style={{ color: "#6b7280" }}>
                Não tem conta?{" "}
                <button
                  type="button"
                  className="btn btn-link p-0 align-baseline text-decoration-none"
                  style={{ color: "#b45309" }}
                  onClick={handleLoginToRegister}
                  disabled={loginLoading}
                >
                  Criar conta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isRegisterOpen && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
          style={{
            backgroundColor: "rgba(15,23,42,0.55)",
            zIndex: 1050,
          }}
        >
          <div
            className="bg-white rounded-4 shadow-lg p-4 p-md-5"
            style={{ maxWidth: 460, width: "90%" }}
          >
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div>
                <h2 className="h5 mb-1" style={{ color: "#5a3415" }}>
                  Criar conta
                </h2>
                <p className="mb-0 small" style={{ color: "#8b5a2b" }}>
                  Comece a organizar suas finanças pessoais.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-link text-decoration-none"
                onClick={handleCloseRegister}
                disabled={regLoading}
                style={{ color: "#6b7280" }}
              >
                fechar
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="d-flex flex-column gap-3">
              <div>
                <label className="form-label mb-1" style={{ color: "#5a3415", fontSize: 13 }}>
                  Usuário
                </label>
                <input
                  className="form-control"
                  placeholder="Seu usuário"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  disabled={regLoading}
                />
              </div>

              <div>
                <label className="form-label mb-1" style={{ color: "#5a3415", fontSize: 13 }}>
                  Email
                </label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="seu@email.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  disabled={regLoading}
                />
              </div>

              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <label className="form-label mb-1" style={{ color: "#5a3415", fontSize: 13 }}>
                    Senha
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Senha forte"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    disabled={regLoading}
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label mb-1" style={{ color: "#5a3415", fontSize: 13 }}>
                    Confirmar senha
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Repita a senha"
                    value={regConfirm}
                    onChange={(e) => setRegConfirm(e.target.value)}
                    disabled={regLoading}
                  />
                </div>
              </div>

              {regError && (
                <div
                  className="small mt-1"
                  style={{ color: "#b91c1c" }}
                >
                  {regError}
                </div>
              )}

              <button
                type="submit"
                className="btn w-100 mt-2"
                style={{
                  backgroundColor: "#b5531e",
                  borderColor: "#b5531e",
                  color: "#ffffff",
                }}
                disabled={regLoading}
              >
                {regLoading ? "Criando conta..." : "Criar conta"}
              </button>

              <div className="text-center mt-2 small" style={{ color: "#6b7280" }}>
                Já tem conta?{" "}
                <button
                  type="button"
                  className="btn btn-link p-0 align-baseline text-decoration-none"
                  style={{ color: "#b45309" }}
                  onClick={() => {
                    if (regLoading) return;
                    setIsRegisterOpen(false);
                    setRegError(null);
                    setIsLoginOpen(true);
                  }}
                >
                  Entrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
