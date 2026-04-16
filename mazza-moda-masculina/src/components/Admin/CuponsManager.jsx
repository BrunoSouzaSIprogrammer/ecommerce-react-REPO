import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  listarCupons,
  criarCupom,
  atualizarCupom,
  deletarCupom,
} from "../../services/api";
import { CATEGORIAS } from "../../utils/filtros";
import "../../styles/admin-cupons.css";

const CUPOM_VAZIO = {
  codigo: "",
  descricao: "",
  tipo: "percentual",
  valor: 10,
  minimoCompra: 0,
  escopo: { tipo: "total", categoria: "" },
  validoDe: "",
  validoAte: "",
  maxUsos: "",
  ativo: true,
};

function formatBRL(n) {
  return (Number(n) || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarData(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("pt-BR");
  } catch {
    return iso;
  }
}

export default function CuponsManager() {
  const { user } = useAuth();
  const [cupons, setCupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(null); // código ou null (novo)
  const [form, setForm] = useState(CUPOM_VAZIO);
  const [salvando, setSalvando] = useState(false);
  const [formErro, setFormErro] = useState(null);

  useEffect(() => {
    if (!user?.token) return;
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.token]);

  async function carregar() {
    setLoading(true);
    setErro(null);
    try {
      const data = await listarCupons(user.token);
      setCupons(Array.isArray(data) ? data : []);
    } catch (err) {
      setErro(err.message || "Erro ao carregar cupons");
    } finally {
      setLoading(false);
    }
  }

  function abrirNovo() {
    setEditando(null);
    setForm(CUPOM_VAZIO);
    setFormErro(null);
    setModalAberto(true);
  }

  function abrirEditar(cupom) {
    setEditando(cupom.codigo);
    setForm({
      codigo: cupom.codigo,
      descricao: cupom.descricao || "",
      tipo: cupom.tipo || "percentual",
      valor: cupom.valor || 0,
      minimoCompra: cupom.minimoCompra || 0,
      escopo: cupom.escopo || { tipo: "total", categoria: "" },
      validoDe: cupom.validoDe ? cupom.validoDe.slice(0, 10) : "",
      validoAte: cupom.validoAte ? cupom.validoAte.slice(0, 10) : "",
      maxUsos: cupom.maxUsos ?? "",
      ativo: cupom.ativo !== false,
    });
    setFormErro(null);
    setModalAberto(true);
  }

  function fechar() {
    setModalAberto(false);
    setEditando(null);
    setForm(CUPOM_VAZIO);
    setFormErro(null);
  }

  async function salvar(e) {
    e.preventDefault();
    setFormErro(null);
    setSalvando(true);
    try {
      const payload = {
        descricao: form.descricao,
        tipo: form.tipo,
        valor: Number(form.valor),
        minimoCompra: Number(form.minimoCompra) || 0,
        escopo:
          form.escopo.tipo === "categoria"
            ? { tipo: "categoria", categoria: form.escopo.categoria }
            : { tipo: "total" },
        validoDe: form.validoDe
          ? new Date(form.validoDe).toISOString()
          : null,
        validoAte: form.validoAte
          ? new Date(form.validoAte + "T23:59:59").toISOString()
          : null,
        maxUsos: form.maxUsos ? Number(form.maxUsos) : null,
        ativo: form.ativo,
      };

      if (editando) {
        await atualizarCupom(editando, payload, user.token);
      } else {
        await criarCupom({ ...payload, codigo: form.codigo }, user.token);
      }
      await carregar();
      fechar();
    } catch (err) {
      setFormErro(err.message || "Erro ao salvar cupom");
    } finally {
      setSalvando(false);
    }
  }

  async function handleDeletar(codigo) {
    if (!window.confirm(`Excluir cupom ${codigo}?`)) return;
    try {
      await deletarCupom(codigo, user.token);
      setCupons((prev) => prev.filter((c) => c.codigo !== codigo));
    } catch (err) {
      alert(err.message || "Erro ao deletar cupom");
    }
  }

  return (
    <div className="cupons-manager">
      <div className="cupons-header">
        <h3>Cupons de desconto</h3>
        <button className="btn-primary" onClick={abrirNovo}>
          + Novo cupom
        </button>
      </div>

      {loading && <div className="cupons-info">Carregando...</div>}
      {erro && <div className="cupons-erro">{erro}</div>}

      {!loading && !erro && cupons.length === 0 && (
        <div className="cupons-vazio">Nenhum cupom cadastrado.</div>
      )}

      {!loading && cupons.length > 0 && (
        <div className="cupons-table-wrap">
          <table className="cupons-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Tipo</th>
                <th>Valor</th>
                <th>Mín.</th>
                <th>Escopo</th>
                <th>Validade</th>
                <th>Usos</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {cupons.map((c) => (
                <tr key={c.codigo}>
                  <td>
                    <strong>{c.codigo}</strong>
                    {c.descricao && (
                      <div className="cupom-desc">{c.descricao}</div>
                    )}
                  </td>
                  <td>
                    {c.tipo === "percentual" ? "%" : "R$"}
                  </td>
                  <td>
                    {c.tipo === "percentual"
                      ? `${c.valor}%`
                      : formatBRL(c.valor)}
                  </td>
                  <td>{c.minimoCompra ? formatBRL(c.minimoCompra) : "—"}</td>
                  <td>
                    {c.escopo?.tipo === "categoria"
                      ? `cat: ${c.escopo.categoria}`
                      : "Total"}
                  </td>
                  <td>
                    {formatarData(c.validoDe)} – {formatarData(c.validoAte)}
                  </td>
                  <td>
                    {c.usos || 0}
                    {c.maxUsos ? ` / ${c.maxUsos}` : ""}
                  </td>
                  <td>
                    <span
                      className={`status-badge ${c.ativo ? "ativo" : "inativo"}`}
                    >
                      {c.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="acoes-col">
                    <button
                      className="btn-mini"
                      onClick={() => abrirEditar(c)}
                    >
                      Editar
                    </button>
                    <button
                      className="btn-mini btn-danger"
                      onClick={() => handleDeletar(c.codigo)}
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalAberto && (
        <div className="cupom-modal-overlay" onClick={fechar}>
          <div className="cupom-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editando ? `Editar ${editando}` : "Novo cupom"}</h3>
            <form onSubmit={salvar}>
              {!editando && (
                <div className="form-field">
                  <label>Código</label>
                  <input
                    type="text"
                    value={form.codigo}
                    onChange={(e) =>
                      setForm({ ...form, codigo: e.target.value.toUpperCase() })
                    }
                    placeholder="BLACKFRIDAY20"
                    required
                  />
                </div>
              )}

              <div className="form-field">
                <label>Descrição</label>
                <input
                  type="text"
                  value={form.descricao}
                  onChange={(e) =>
                    setForm({ ...form, descricao: e.target.value })
                  }
                  placeholder="Descrição interna (opcional)"
                />
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label>Tipo</label>
                  <select
                    value={form.tipo}
                    onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  >
                    <option value="percentual">Percentual (%)</option>
                    <option value="valor_fixo">Valor fixo (R$)</option>
                  </select>
                </div>

                <div className="form-field">
                  <label>Valor</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.valor}
                    onChange={(e) =>
                      setForm({ ...form, valor: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="form-field">
                  <label>Mínimo de compra</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.minimoCompra}
                    onChange={(e) =>
                      setForm({ ...form, minimoCompra: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label>Escopo</label>
                  <select
                    value={form.escopo.tipo}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        escopo: { ...form.escopo, tipo: e.target.value },
                      })
                    }
                  >
                    <option value="total">Pedido inteiro</option>
                    <option value="categoria">Categoria específica</option>
                  </select>
                </div>

                {form.escopo.tipo === "categoria" && (
                  <div className="form-field">
                    <label>Categoria</label>
                    <select
                      value={form.escopo.categoria}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          escopo: {
                            ...form.escopo,
                            categoria: e.target.value,
                          },
                        })
                      }
                      required
                    >
                      <option value="">Selecione...</option>
                      {CATEGORIAS.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label>Válido de</label>
                  <input
                    type="date"
                    value={form.validoDe}
                    onChange={(e) =>
                      setForm({ ...form, validoDe: e.target.value })
                    }
                  />
                </div>
                <div className="form-field">
                  <label>Válido até</label>
                  <input
                    type="date"
                    value={form.validoAte}
                    onChange={(e) =>
                      setForm({ ...form, validoAte: e.target.value })
                    }
                  />
                </div>
                <div className="form-field">
                  <label>Máx. usos</label>
                  <input
                    type="number"
                    min="0"
                    value={form.maxUsos}
                    onChange={(e) =>
                      setForm({ ...form, maxUsos: e.target.value })
                    }
                    placeholder="Ilimitado"
                  />
                </div>
              </div>

              <div className="form-field form-check">
                <label>
                  <input
                    type="checkbox"
                    checked={form.ativo}
                    onChange={(e) =>
                      setForm({ ...form, ativo: e.target.checked })
                    }
                  />{" "}
                  Cupom ativo
                </label>
              </div>

              {formErro && <div className="cupons-erro">{formErro}</div>}

              <div className="modal-acoes">
                <button type="button" className="btn-secondary" onClick={fechar}>
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={salvando}
                >
                  {salvando ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
