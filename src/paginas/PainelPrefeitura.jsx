import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  aceitarSolicitacaoPrefeitura,
  agendarSolicitacaoPrefeitura,
  ApiError,
  atualizarStatusPrefeitura,
  listarSolicitacoesPrefeitura,
  obterDetalhesSolicitacaoPrefeitura,
  obterEstatisticasPrefeitura,
  rejeitarSolicitacaoPrefeitura,
} from '../api';
import { Erro, Icone, Marca, SemSessaoPrefeitura } from '../componentes';
import { infoResiduo, RESIDUOS } from '../residuos';
import {
  lerUsuarioPrefeitura,
  ROTA_SOLICITAR,
  sair,
  salvarUsuarioPrefeituraDemo,
} from '../sessao';

/** Metadados dos status conforme regra de negócio do backend */
const STATUS_CONFIG = {
  PENDENTE: { rotulo: 'Pendente', classe: 'status--pendente', acaoPermitida: true },
  EM_ANALISE: { rotulo: 'Em Análise', classe: 'status--em-analise', acaoPermitida: true },
  ACEITA: { rotulo: 'Aceita', classe: 'status--aceita', acaoPermitida: true },
  AGENDADA: { rotulo: 'Agendada', classe: 'status--agendada', acaoPermitida: true },
  EM_ANDAMENTO: { rotulo: 'Em Andamento', classe: 'status--em-andamento', acaoPermitida: true },
  CONCLUIDA: { rotulo: 'Concluída', classe: 'status--concluida', acaoPermitida: false },
  CANCELADA: { rotulo: 'Cancelada', classe: 'status--cancelada', acaoPermitida: false },
  REJEITADA: { rotulo: 'Rejeitada', classe: 'status--rejeitada', acaoPermitida: false },
};

function formatarData(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  const dois = (n) => String(n).padStart(2, '0');
  return `${dois(d.getDate())}/${dois(d.getMonth() + 1)}/${d.getFullYear()} às ${dois(d.getHours())}:${dois(d.getMinutes())}`;
}

export default function PainelPrefeitura() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(lerUsuarioPrefeitura);

  // Dados da listagem e estatísticas (RF03)
  const [estatisticas, setEstatisticas] = useState(null);
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [pagina, setPagina] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalElementos, setTotalElementos] = useState(0);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);
  const [sucesso, setSucesso] = useState(null);

  // Filtros de pesquisa (RF03)
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroTipoResiduo, setFiltroTipoResiduo] = useState('');
  const [filtroBairro, setFiltroBairro] = useState('');
  const [filtroTermo, setFiltroTermo] = useState('');
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');

  // Modal de Detalhes e Gerenciamento de Status (RF04)
  const [solicitacaoSelecionada, setSolicitacaoSelecionada] = useState(null);
  const [carregandoDetalhes, setCarregandoDetalhes] = useState(false);
  const [abaAcao, setAbaAcao] = useState('ACEITAR'); // 'ACEITAR' | 'REJEITAR' | 'AGENDAR' | 'STATUS'
  const [executandoAcao, setExecutandoAcao] = useState(false);
  const [erroModal, setErroModal] = useState(null);

  // Campos do formulário de ação (RF04)
  const [obsEquipe, setObsEquipe] = useState('');
  const [motivoRejeicao, setMotivoRejeicao] = useState('');
  const [motivoCancelamento, setMotivoCancelamento] = useState('');
  const [novoStatus, setNovoStatus] = useState('EM_ANDAMENTO');
  const [dataAgendada, setDataAgendada] = useState('');
  const [responsavelEquipe, setResponsavelEquipe] = useState('');

  // Gatilho para recarregar dados
  const [gatilhoBusca, setGatilhoBusca] = useState(0);

  // Efeito de sincronização com a API (RF03)
  useEffect(() => {
    if (!usuario) return;
    let ativo = true;

    obterEstatisticasPrefeitura()
      .then((stats) => {
        if (ativo) setEstatisticas(stats);
      })
      .catch(() => undefined);

    listarSolicitacoesPrefeitura(
      {
        status: filtroStatus || undefined,
        tipoResiduo: filtroTipoResiduo || undefined,
        bairro: filtroBairro || undefined,
        termo: filtroTermo || undefined,
        dataInicio: filtroDataInicio || undefined,
        dataFim: filtroDataFim || undefined,
      },
      pagina,
      10,
      'dataSolicitacao,desc',
    )
      .then((resposta) => {
        if (!ativo) return;
        const itens = resposta.content ?? [];
        setSolicitacoes(itens);
        setTotalPaginas(resposta.page?.totalPages ?? resposta.totalPages ?? 1);
        setTotalElementos(resposta.page?.totalElements ?? resposta.totalElements ?? itens.length);
        setCarregando(false);
      })
      .catch((err) => {
        if (!ativo) return;
        setErro(err instanceof ApiError ? err.message : 'Falha ao carregar as solicitações da prefeitura.');
        setCarregando(false);
      });

    return () => {
      ativo = false;
    };
  }, [
    usuario,
    gatilhoBusca,
    pagina,
    filtroStatus,
    filtroTipoResiduo,
    filtroBairro,
    filtroTermo,
    filtroDataInicio,
    filtroDataFim,
  ]);

  // Aplica filtros textuais
  function aplicarFiltros(e) {
    e?.preventDefault();
    setPagina(0);
    setCarregando(true);
    setGatilhoBusca((v) => v + 1);
  }

  // Limpa todos os filtros
  function limparFiltros() {
    setFiltroStatus('');
    setFiltroTipoResiduo('');
    setFiltroBairro('');
    setFiltroTermo('');
    setFiltroDataInicio('');
    setFiltroDataFim('');
    setPagina(0);
    setCarregando(true);
    setGatilhoBusca((v) => v + 1);
  }

  function mudarPagina(novaPagina) {
    setPagina(novaPagina);
    setCarregando(true);
  }

  function dispararRecarga() {
    setCarregando(true);
    setGatilhoBusca((v) => v + 1);
  }

  // Abre detalhes da solicitação
  async function abrirDetalhes(id) {
    setCarregandoDetalhes(true);
    setErroModal(null);
    setSolicitacaoSelecionada({ id });
    // Limpa campos de ação
    setObsEquipe('');
    setMotivoRejeicao('');
    setMotivoCancelamento('');
    setDataAgendada('');
    setResponsavelEquipe('');
    try {
      const detalhes = await obterDetalhesSolicitacaoPrefeitura(id);
      setSolicitacaoSelecionada(detalhes);
      // Prepara aba inicial sugerida de acordo com o status
      if (detalhes.status === 'PENDENTE' || detalhes.status === 'EM_ANALISE') {
        setAbaAcao('ACEITAR');
      } else if (detalhes.status === 'ACEITA') {
        setAbaAcao('AGENDAR');
      } else {
        setAbaAcao('STATUS');
      }
    } catch (err) {
      setErroModal(err instanceof ApiError ? err.message : 'Não foi possível carregar os detalhes da solicitação.');
    } finally {
      setCarregandoDetalhes(false);
    }
  }

  function fecharDetalhes() {
    setSolicitacaoSelecionada(null);
    setErroModal(null);
  }

  // RF04: Executa ação de Aceitar
  async function handleAceitar() {
    if (!solicitacaoSelecionada?.id) return;
    setExecutandoAcao(true);
    setErroModal(null);
    try {
      const atualizada = await aceitarSolicitacaoPrefeitura(solicitacaoSelecionada.id, obsEquipe);
      setSolicitacaoSelecionada(atualizada);
      setSucesso(`Solicitação ${atualizada.protocolo} aceita com sucesso pela equipe municipal!`);
      dispararRecarga();
    } catch (err) {
      setErroModal(err instanceof ApiError ? err.message : 'Erro ao aceitar a solicitação.');
    } finally {
      setExecutandoAcao(false);
    }
  }

  // RF04: Executa ação de Rejeitar
  async function handleRejeitar() {
    if (!solicitacaoSelecionada?.id) return;
    const motivo = motivoRejeicao.trim();
    if (!motivo || motivo.length < 5) {
      setErroModal('O motivo da rejeição deve ter no mínimo 5 caracteres.');
      return;
    }
    setExecutandoAcao(true);
    setErroModal(null);
    try {
      const atualizada = await rejeitarSolicitacaoPrefeitura(solicitacaoSelecionada.id, motivo);
      setSolicitacaoSelecionada(atualizada);
      setSucesso(`Solicitação ${atualizada.protocolo} rejeitada.`);
      dispararRecarga();
    } catch (err) {
      setErroModal(err instanceof ApiError ? err.message : 'Erro ao rejeitar a solicitação.');
    } finally {
      setExecutandoAcao(false);
    }
  }

  // RF04: Executa ação de Agendar Coleta
  async function handleAgendar() {
    if (!solicitacaoSelecionada?.id) return;
    if (!dataAgendada) {
      setErroModal('Informe a data e hora do agendamento.');
      return;
    }
    if (!responsavelEquipe.trim()) {
      setErroModal('Identifique a equipe ou veículo responsável pelo recolhimento.');
      return;
    }
    setExecutandoAcao(true);
    setErroModal(null);
    try {
      // Ajusta formato ISO caso venha de input datetime-local
      const dataIso = dataAgendada.length === 16 ? `${dataAgendada}:00` : dataAgendada;
      const atualizada = await agendarSolicitacaoPrefeitura(solicitacaoSelecionada.id, {
        dataAgendada: dataIso,
        responsavelEquipe: responsavelEquipe.trim(),
        observacoesEquipe: obsEquipe,
      });
      setSolicitacaoSelecionada(atualizada);
      setSucesso(`Coleta ${atualizada.protocolo} agendada com sucesso!`);
      dispararRecarga();
    } catch (err) {
      setErroModal(err instanceof ApiError ? err.message : 'Erro ao agendar a solicitação.');
    } finally {
      setExecutandoAcao(false);
    }
  }

  // RF04: Executa ação de Mudar Status
  async function handleMudarStatus() {
    if (!solicitacaoSelecionada?.id) return;
    if (novoStatus === 'CANCELADA' && (!motivoCancelamento || motivoCancelamento.trim().length < 3)) {
      setErroModal('Para cancelar a solicitação, informe o motivo do cancelamento.');
      return;
    }
    setExecutandoAcao(true);
    setErroModal(null);
    try {
      const atualizada = await atualizarStatusPrefeitura(solicitacaoSelecionada.id, {
        novoStatus,
        observacoesEquipe: obsEquipe,
        motivoCancelamento,
      });
      setSolicitacaoSelecionada(atualizada);
      setSucesso(`Status da solicitação ${atualizada.protocolo} alterado para ${STATUS_CONFIG[novoStatus]?.rotulo ?? novoStatus}.`);
      dispararRecarga();
    } catch (err) {
      setErroModal(err instanceof ApiError ? err.message : 'Erro ao atualizar o status.');
    } finally {
      setExecutandoAcao(false);
    }
  }

  function entrarDemo() {
    const demo = salvarUsuarioPrefeituraDemo();
    setUsuario(demo);
  }

  if (!usuario) {
    return <SemSessaoPrefeitura onAcessoDemo={entrarDemo} />;
  }

  const statusAtualTerminal = solicitacaoSelecionada?.status === 'CONCLUIDA' ||
    solicitacaoSelecionada?.status === 'CANCELADA' ||
    solicitacaoSelecionada?.status === 'REJEITADA';

  return (
    <main className="tela tela--painel">
      {/* Topo Institucional da Prefeitura */}
      <header className="topo painel-topo">
        <div className="topo__lado-esquerdo">
          <Marca />
          <span className="topo__cidade">IRECÊ · BA · PREFEITURA</span>
        </div>
        <div className="topo__usuario-bloco">
          <span className="painel-topo__usuario">
            <strong>{usuario.nome}</strong> ({usuario.perfil === 'PREFEITURA' ? 'Prefeitura' : 'Equipe Municipal'})
          </span>
          <button
            type="button"
            className="topo__sair"
            style={{ marginRight: 12 }}
            onClick={() => navigate(ROTA_SOLICITAR)}
          >
            Visão do Cidadão
          </button>
          <button type="button" className="topo__sair" onClick={sair}>
            Sair
          </button>
        </div>
      </header>

      {/* Cabeçalho do Painel */}
      <section className="bloco bloco--8" style={{ marginTop: 12 }}>
        <div className="painel-cabecalho">
          <div>
            <span className="selo">RF03 &amp; RF04 · Painel Administrativo</span>
            <h1 className="titulo--solicitar" style={{ fontSize: 24, marginTop: 4 }}>
              Gestão de Coletas da Prefeitura
            </h1>
            <p className="subtitulo">
              Acompanhamento centralizado, triagem e controle de status das coletas verdes de Irecê.
            </p>
          </div>
          <button
            type="button"
            className="botao botao--secundario"
            style={{ width: 'auto', padding: '10px 16px', height: 40 }}
            onClick={dispararRecarga}
            disabled={carregando}
          >
            {carregando ? 'Atualizando…' : '↻ Atualizar dados'}
          </button>
        </div>
      </section>

      {/* Alerta de Sucesso Global */}
      {sucesso && (
        <div className="mensagem mensagem--aviso" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{sucesso}</span>
          <button
            type="button"
            onClick={() => setSucesso(null)}
            style={{ background: 'none', border: 0, fontWeight: 700, cursor: 'pointer', color: 'inherit' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Erro Geral */}
      <Erro mensagem={erro} />

      {/* Estatísticas e Indicadores (RF03) */}
      <section className="painel-kpis" aria-label="Indicadores gerais do backlog">
        <button
          type="button"
          className={`kpi-card ${filtroStatus === '' ? 'kpi-card--ativo' : ''}`}
          onClick={() => setFiltroStatus('')}
        >
          <span className="kpi-card__valor">{estatisticas?.totalSolicitacoes ?? totalElementos}</span>
          <span className="kpi-card__rotulo">Todas</span>
        </button>
        <button
          type="button"
          className={`kpi-card ${filtroStatus === 'PENDENTE' ? 'kpi-card--ativo' : ''}`}
          onClick={() => setFiltroStatus(filtroStatus === 'PENDENTE' ? '' : 'PENDENTE')}
        >
          <span className="kpi-card__valor kpi-card__valor--pendente">{estatisticas?.totalPendentes ?? 0}</span>
          <span className="kpi-card__rotulo">Pendentes</span>
        </button>
        <button
          type="button"
          className={`kpi-card ${filtroStatus === 'EM_ANALISE' ? 'kpi-card--ativo' : ''}`}
          onClick={() => setFiltroStatus(filtroStatus === 'EM_ANALISE' ? '' : 'EM_ANALISE')}
        >
          <span className="kpi-card__valor kpi-card__valor--analise">{estatisticas?.totalEmAnalise ?? 0}</span>
          <span className="kpi-card__rotulo">Em Análise</span>
        </button>
        <button
          type="button"
          className={`kpi-card ${filtroStatus === 'ACEITA' ? 'kpi-card--ativo' : ''}`}
          onClick={() => setFiltroStatus(filtroStatus === 'ACEITA' ? '' : 'ACEITA')}
        >
          <span className="kpi-card__valor kpi-card__valor--aceita">{estatisticas?.totalAceitas ?? 0}</span>
          <span className="kpi-card__rotulo">Aceitas</span>
        </button>
        <button
          type="button"
          className={`kpi-card ${filtroStatus === 'AGENDADA' ? 'kpi-card--ativo' : ''}`}
          onClick={() => setFiltroStatus(filtroStatus === 'AGENDADA' ? '' : 'AGENDADA')}
        >
          <span className="kpi-card__valor kpi-card__valor--agendada">{estatisticas?.totalAgendadas ?? 0}</span>
          <span className="kpi-card__rotulo">Agendadas</span>
        </button>
        <button
          type="button"
          className={`kpi-card ${filtroStatus === 'EM_ANDAMENTO' ? 'kpi-card--ativo' : ''}`}
          onClick={() => setFiltroStatus(filtroStatus === 'EM_ANDAMENTO' ? '' : 'EM_ANDAMENTO')}
        >
          <span className="kpi-card__valor kpi-card__valor--andamento">{estatisticas?.totalEmAndamento ?? 0}</span>
          <span className="kpi-card__rotulo">Em Andamento</span>
        </button>
        <button
          type="button"
          className={`kpi-card ${filtroStatus === 'CONCLUIDA' ? 'kpi-card--ativo' : ''}`}
          onClick={() => setFiltroStatus(filtroStatus === 'CONCLUIDA' ? '' : 'CONCLUIDA')}
        >
          <span className="kpi-card__valor kpi-card__valor--concluida">{estatisticas?.totalConcluidas ?? 0}</span>
          <span className="kpi-card__rotulo">Concluídas</span>
        </button>
        <button
          type="button"
          className={`kpi-card ${filtroStatus === 'CANCELADA' ? 'kpi-card--ativo' : ''}`}
          onClick={() => setFiltroStatus(filtroStatus === 'CANCELADA' ? '' : 'CANCELADA')}
        >
          <span className="kpi-card__valor kpi-card__valor--cancelada">
            {(estatisticas?.totalCanceladas ?? 0) + (estatisticas?.totalRejeitadas ?? 0)}
          </span>
          <span className="kpi-card__rotulo">Canceladas / Rejeitadas</span>
        </button>
      </section>

      {/* Barra de Filtros (RF03) */}
      <section className="resumo painel-filtros" aria-label="Filtros de pesquisa">
        <form onSubmit={aplicarFiltros} className="bloco bloco--12">
          <div className="painel-filtros__grade">
            {/* Campo de Busca Geral */}
            <div className="bloco bloco--4">
              <label htmlFor="filtro-termo" className="rotulo-campo">
                Buscar por termo
              </label>
              <input
                id="filtro-termo"
                type="text"
                className="entrada"
                placeholder="Protocolo, cidadão, rua..."
                value={filtroTermo}
                onChange={(e) => setFiltroTermo(e.target.value)}
              />
            </div>

            {/* Filtro por Status */}
            <div className="bloco bloco--4">
              <label htmlFor="filtro-status" className="rotulo-campo">
                Status
              </label>
              <select
                id="filtro-status"
                className="entrada"
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
              >
                <option value="">Todos os status</option>
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.rotulo}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por Tipo de Resíduo */}
            <div className="bloco bloco--4">
              <label htmlFor="filtro-residuo" className="rotulo-campo">
                Tipo de material
              </label>
              <select
                id="filtro-residuo"
                className="entrada"
                value={filtroTipoResiduo}
                onChange={(e) => setFiltroTipoResiduo(e.target.value)}
              >
                <option value="">Todos os resíduos</option>
                {RESIDUOS.map((res) => (
                  <option key={res.valor} value={res.valor}>
                    {res.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por Bairro */}
            <div className="bloco bloco--4">
              <label htmlFor="filtro-bairro" className="rotulo-campo">
                Bairro de Irecê
              </label>
              <input
                id="filtro-bairro"
                type="text"
                className="entrada"
                placeholder="Ex.: Centro, São José..."
                value={filtroBairro}
                onChange={(e) => setFiltroBairro(e.target.value)}
              />
            </div>

            {/* Data Início */}
            <div className="bloco bloco--4">
              <label htmlFor="filtro-data-inicio" className="rotulo-campo">
                A partir de
              </label>
              <input
                id="filtro-data-inicio"
                type="date"
                className="entrada"
                value={filtroDataInicio}
                onChange={(e) => setFiltroDataInicio(e.target.value)}
              />
            </div>

            {/* Data Fim */}
            <div className="bloco bloco--4">
              <label htmlFor="filtro-data-fim" className="rotulo-campo">
                Até
              </label>
              <input
                id="filtro-data-fim"
                type="date"
                className="entrada"
                value={filtroDataFim}
                onChange={(e) => setFiltroDataFim(e.target.value)}
              />
            </div>
          </div>

          <div className="painel-filtros__acoes">
            <button type="submit" className="botao botao--primario painel-filtros__botao-buscar">
              Aplicar filtros
            </button>
            <button type="button" className="botao botao--secundario" onClick={limparFiltros}>
              Limpar filtros
            </button>
          </div>
        </form>
      </section>

      {/* Lista de Solicitações (RF03) */}
      <section className="bloco bloco--12" aria-label="Lista de solicitações do município">
        <div className="painel-lista-topo">
          <p className="legenda">
            {carregando
              ? 'Buscando solicitações…'
              : `Total encontrado: ${totalElementos} solicitação(ões) · Página ${pagina + 1} de ${Math.max(totalPaginas, 1)}`}
          </p>
        </div>

        {carregando && (
          <div className="resumo" style={{ textAlign: 'center', padding: 32 }}>
            <p className="subtitulo">Carregando solicitações do sistema…</p>
          </div>
        )}

        {!carregando && solicitacoes.length === 0 && (
          <div className="resumo" style={{ textAlign: 'center', padding: 36 }}>
            <p className="rotulo" style={{ marginBottom: 6 }}>
              Nenhuma solicitação encontrada
            </p>
            <p className="subtitulo">
              Tente alterar os termos da busca ou clique em &quot;Limpar filtros&quot; para exibir todas.
            </p>
          </div>
        )}

        {!carregando && solicitacoes.length > 0 && (
          <div className="painel-cards-grid">
            {solicitacoes.map((item) => {
              const statusCfg = STATUS_CONFIG[item.status] ?? { rotulo: item.statusDescricao ?? item.status, classe: 'status--pendente' };
              const tipos = item.tiposResiduos ?? [];
              const ehTerminal = item.status === 'CONCLUIDA' || item.status === 'CANCELADA' || item.status === 'REJEITADA';

              return (
                <article key={item.id} className="resumo painel-card-item">
                  <header className="painel-card-item__topo">
                    <div>
                      <span className="resumo__codigo">{item.protocolo}</span>
                      <h3 className="painel-card-item__morador">
                        {item.nomeMorador || 'Cidadão não informado'}
                      </h3>
                      {item.telefoneMorador && (
                        <p className="painel-card-item__telefone">Tel: {item.telefoneMorador}</p>
                      )}
                    </div>
                    <span className={`status ${statusCfg.classe}`}>{statusCfg.rotulo}</span>
                  </header>

                  <div className="painel-card-item__corpo">
                    <div className="painel-card-item__detalhe">
                      <span className="rotulo-campo">Endereço de coleta:</span>
                      <p className="painel-card-item__endereco">
                        {item.logradouro ? `${item.logradouro}${item.numero ? `, ${item.numero}` : ''}` : 'Endereço não informado'}
                        {item.bairro ? ` · ${item.bairro}` : ''}
                      </p>
                    </div>

                    <div className="painel-card-item__detalhe">
                      <span className="rotulo-campo">Resíduo / Material:</span>
                      <div className="painel-card-item__materiais">
                        {tipos.length > 0 ? (
                          tipos.map((tipo, idx) => (
                            <span key={idx} className="selo" style={{ fontSize: 11, padding: '3px 8px' }}>
                              {tipo}
                            </span>
                          ))
                        ) : (
                          <span className="legenda">Material comum</span>
                        )}
                        {item.totalItens > 0 && (
                          <span className="legenda" style={{ marginLeft: 6 }}>
                            ({item.totalItens} {item.totalItens === 1 ? 'item' : 'itens'})
                          </span>
                        )}
                        {item.volumeEntulhoM3 != null && (
                          <span className="legenda"> · {item.volumeEntulhoM3} m³</span>
                        )}
                      </div>
                    </div>

                    {item.status === 'AGENDADA' && item.dataAgendada && (
                      <div className="painel-card-item__detalhe painel-card-item__detalhe--destaque">
                        <span className="rotulo-campo">Coleta agendada:</span>
                        <p className="resumo__info" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                          {formatarData(item.dataAgendada)}
                          {item.responsavelEquipe ? ` (${item.responsavelEquipe})` : ''}
                        </p>
                      </div>
                    )}

                    <p className="resumo__data" style={{ marginTop: 4 }}>
                      Solicitada em {formatarData(item.dataSolicitacao)}
                    </p>
                  </div>

                  <footer className="painel-card-item__rodape">
                    <button
                      type="button"
                      className="botao botao--primario painel-card-item__botao-acao"
                      onClick={() => abrirDetalhes(item.id)}
                    >
                      {ehTerminal ? 'Ver detalhes da coleta' : 'Gerenciar coleta (RF04)'}
                    </button>
                  </footer>
                </article>
              );
            })}
          </div>
        )}

        {/* Paginação */}
        {totalPaginas > 1 && (
          <nav className="painel-paginacao" aria-label="Navegação entre páginas">
            <button
              type="button"
              className="botao botao--secundario"
              style={{ width: 'auto', padding: '10px 20px', height: 40 }}
              disabled={pagina === 0 || carregando}
              onClick={() => mudarPagina(pagina - 1)}
            >
              ← Página anterior
            </button>
            <span className="rotulo-campo">
              {pagina + 1} de {totalPaginas}
            </span>
            <button
              type="button"
              className="botao botao--secundario"
              style={{ width: 'auto', padding: '10px 20px', height: 40 }}
              disabled={pagina >= totalPaginas - 1 || carregando}
              onClick={() => mudarPagina(pagina + 1)}
            >
              Próxima página →
            </button>
          </nav>
        )}
      </section>

      {/* =====================================================================
       * MODAL DE DETALHES E GERENCIAMENTO DE STATUS DA COLETA (RF04)
       * ===================================================================== */}
      {solicitacaoSelecionada && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-titulo">
          <div className="modal-conteudo">
            <header className="modal-header">
              <div>
                <span className="resumo__codigo">{solicitacaoSelecionada.protocolo}</span>
                <h2 id="modal-titulo" className="titulo--solicitar" style={{ fontSize: 20 }}>
                  Detalhes e Ações da Coleta
                </h2>
              </div>
              <button
                type="button"
                className="modal-fechar"
                onClick={fecharDetalhes}
                aria-label="Fechar janela"
              >
                ✕
              </button>
            </header>

            {carregandoDetalhes ? (
              <p className="subtitulo" style={{ padding: 24, textAlign: 'center' }}>
                Carregando dados completos da solicitação…
              </p>
            ) : (
              <div className="modal-corpo bloco bloco--16">
                <Erro mensagem={erroModal} />

                {/* Status Atual */}
                <div className="modal-status-bloco">
                  <span className="rotulo-campo">Status da Solicitação:</span>
                  <span className={`status ${STATUS_CONFIG[solicitacaoSelecionada.status]?.classe ?? 'status--pendente'}`}>
                    {STATUS_CONFIG[solicitacaoSelecionada.status]?.rotulo ?? solicitacaoSelecionada.statusDescricao ?? solicitacaoSelecionada.status}
                  </span>
                </div>

                {/* Dados do Cidadão e Local */}
                <div className="modal-secao">
                  <h3 className="rotulo">Dados do Cidadão Solicitante</h3>
                  <div className="linha-dupla">
                    <div>
                      <span className="rotulo-campo">Nome</span>
                      <p className="modal-dado">{solicitacaoSelecionada.morador?.nome ?? 'Não informado'}</p>
                    </div>
                    <div>
                      <span className="rotulo-campo">Telefone</span>
                      <p className="modal-dado">{solicitacaoSelecionada.morador?.telefone ?? 'Não informado'}</p>
                    </div>
                  </div>
                  {solicitacaoSelecionada.morador?.email && (
                    <div style={{ marginTop: 6 }}>
                      <span className="rotulo-campo">E-mail</span>
                      <p className="modal-dado">{solicitacaoSelecionada.morador.email}</p>
                    </div>
                  )}
                </div>

                <div className="modal-secao">
                  <h3 className="rotulo">Endereço para Recolhimento</h3>
                  <p className="modal-dado">
                    {solicitacaoSelecionada.enderecoColeta?.logradouro}
                    {solicitacaoSelecionada.enderecoColeta?.numero ? `, nº ${solicitacaoSelecionada.enderecoColeta.numero}` : ''}
                    {solicitacaoSelecionada.enderecoColeta?.complemento ? ` (${solicitacaoSelecionada.enderecoColeta.complemento})` : ''}
                  </p>
                  <p className="modal-dado" style={{ color: 'var(--muted)' }}>
                    Bairro: {solicitacaoSelecionada.enderecoColeta?.bairro ?? 'Não informado'} · CEP: {solicitacaoSelecionada.enderecoColeta?.cep ?? '44900-000'} · Irecê - BA
                  </p>
                </div>

                {/* Lista de Itens / Materiais */}
                <div className="modal-secao">
                  <h3 className="rotulo">Itens a Coletar</h3>
                  {solicitacaoSelecionada.itens?.map((it, idx) => {
                    const info = infoResiduo(it.tipoResiduo);
                    return (
                      <div key={it.id ?? idx} className="modal-item-coleta">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {info?.icone && <Icone src={info.icone} area={24} />}
                          <strong>{info?.nome ?? it.tipoResiduoDescricao ?? it.tipoResiduo}</strong>
                        </div>
                        <p className="modal-dado" style={{ margin: '4px 0' }}>
                          Descrição: {it.descricao || 'Sem descrição específica'}
                        </p>
                        <p className="legenda">
                          Quantidade: <strong>{it.quantidade}</strong> unid.
                          {it.volumeEstimadoM3 != null && ` · Volume: ${it.volumeEstimadoM3} m³`}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Informações de Agendamento ou Conclusão */}
                {(solicitacaoSelecionada.dataAgendada || solicitacaoSelecionada.responsavelEquipe) && (
                  <div className="modal-secao">
                    <h3 className="rotulo">Agendamento</h3>
                    <p className="modal-dado">
                      Data da coleta: <strong>{formatarData(solicitacaoSelecionada.dataAgendada)}</strong>
                    </p>
                    {solicitacaoSelecionada.responsavelEquipe && (
                      <p className="modal-dado">
                        Equipe responsável: <strong>{solicitacaoSelecionada.responsavelEquipe}</strong>
                      </p>
                    )}
                  </div>
                )}

                {solicitacaoSelecionada.motivoRejeicao && (
                  <div className="mensagem mensagem--erro">
                    <strong>Motivo da rejeição:</strong> {solicitacaoSelecionada.motivoRejeicao}
                  </div>
                )}

                {solicitacaoSelecionada.motivoCancelamento && (
                  <div className="mensagem mensagem--erro">
                    <strong>Motivo do cancelamento:</strong> {solicitacaoSelecionada.motivoCancelamento}
                  </div>
                )}

                {solicitacaoSelecionada.observacoesMorador && (
                  <div className="modal-secao">
                    <span className="rotulo-campo">Observações do Morador:</span>
                    <p className="modal-dado">{solicitacaoSelecionada.observacoesMorador}</p>
                  </div>
                )}

                {solicitacaoSelecionada.observacoesEquipe && (
                  <div className="modal-secao">
                    <span className="rotulo-campo">Observações da Equipe Municipal:</span>
                    <p className="modal-dado">{solicitacaoSelecionada.observacoesEquipe}</p>
                  </div>
                )}

                {/* =================================================================
                 * PAINEL DE AÇÕES DA EQUIPE MUNICIPAL (RF04)
                 * ================================================================= */}
                <div className="modal-secao modal-secao--acoes">
                  <h3 className="rotulo" style={{ color: 'var(--dark)', fontSize: 16 }}>
                    Ações da Equipe Municipal (RF04)
                  </h3>

                  {statusAtualTerminal ? (
                    <div className="mensagem mensagem--aviso" style={{ marginTop: 8 }}>
                      Esta solicitação foi finalizada como <strong>{STATUS_CONFIG[solicitacaoSelecionada.status]?.rotulo}</strong> e não aceita mais transições de status.
                    </div>
                  ) : (
                    <div className="bloco bloco--12" style={{ marginTop: 8 }}>
                      {/* Abas de Operação */}
                      <div className="modal-abas" role="tablist">
                        <button
                          type="button"
                          className={`modal-aba ${abaAcao === 'ACEITAR' ? 'modal-aba--ativa' : ''}`}
                          onClick={() => setAbaAcao('ACEITAR')}
                        >
                          ✓ Aceitar Coleta
                        </button>
                        <button
                          type="button"
                          className={`modal-aba ${abaAcao === 'AGENDAR' ? 'modal-aba--ativa' : ''}`}
                          onClick={() => setAbaAcao('AGENDAR')}
                        >
                          📅 Agendar
                        </button>
                        <button
                          type="button"
                          className={`modal-aba ${abaAcao === 'STATUS' ? 'modal-aba--ativa' : ''}`}
                          onClick={() => setAbaAcao('STATUS')}
                        >
                          🔄 Mudar Status
                        </button>
                        <button
                          type="button"
                          className={`modal-aba modal-aba--perigo ${abaAcao === 'REJEITAR' ? 'modal-aba--ativa-perigo' : ''}`}
                          onClick={() => setAbaAcao('REJEITAR')}
                        >
                          ✕ Rejeitar
                        </button>
                      </div>

                      {/* Conteúdo da Aba Aceitar */}
                      {abaAcao === 'ACEITAR' && (
                        <div className="bloco bloco--8">
                          <p className="subtitulo">
                            Aceitar confirma que a prefeitura se responsabiliza por recolher este resíduo verde.
                          </p>
                          <label htmlFor="obs-aceitar" className="rotulo-campo">
                            Observações da equipe (opcional)
                          </label>
                          <textarea
                            id="obs-aceitar"
                            className="entrada"
                            rows={3}
                            placeholder="Ex.: Solicitação aceita. Material apto para coleta."
                            value={obsEquipe}
                            onChange={(e) => setObsEquipe(e.target.value)}
                          />
                          <button
                            type="button"
                            className="botao botao--primario"
                            disabled={executandoAcao}
                            onClick={handleAceitar}
                          >
                            {executandoAcao ? 'Aceitando…' : 'Confirmar e Aceitar Coleta'}
                          </button>
                        </div>
                      )}

                      {/* Conteúdo da Aba Rejeitar */}
                      {abaAcao === 'REJEITAR' && (
                        <div className="bloco bloco--8">
                          <p className="subtitulo" style={{ color: 'var(--erro-ink)' }}>
                            A rejeição finaliza o pedido. Informe claramente ao morador a justificativa.
                          </p>
                          <label htmlFor="motivo-rejeicao" className="rotulo-campo">
                            Motivo da Rejeição * (obrigatório, mín. 5 caracteres)
                          </label>
                          <textarea
                            id="motivo-rejeicao"
                            className="entrada"
                            rows={3}
                            placeholder="Ex.: Material contaminado com produtos químicos não aceitos no programa."
                            value={motivoRejeicao}
                            onChange={(e) => setMotivoRejeicao(e.target.value)}
                          />
                          <button
                            type="button"
                            className="botao botao--perigo"
                            disabled={executandoAcao || motivoRejeicao.trim().length < 5}
                            onClick={handleRejeitar}
                          >
                            {executandoAcao ? 'Rejeitando…' : 'Rejeitar Solicitação de Coleta'}
                          </button>
                        </div>
                      )}

                      {/* Conteúdo da Aba Agendar */}
                      {abaAcao === 'AGENDAR' && (
                        <div className="bloco bloco--8">
                          <p className="subtitulo">
                            Defina a data e o veículo/equipe responsável para buscar os materiais no local.
                          </p>
                          <div className="linha-dupla">
                            <div className="bloco bloco--4">
                              <label htmlFor="agenda-data" className="rotulo-campo">
                                Data e hora do agendamento *
                              </label>
                              <input
                                id="agenda-data"
                                type="datetime-local"
                                className="entrada"
                                value={dataAgendada}
                                onChange={(e) => setDataAgendada(e.target.value)}
                              />
                            </div>
                            <div className="bloco bloco--4">
                              <label htmlFor="agenda-equipe" className="rotulo-campo">
                                Equipe / Veículo responsável *
                              </label>
                              <input
                                id="agenda-equipe"
                                type="text"
                                className="entrada"
                                placeholder="Ex.: Caminhão 02 - Zona Sul"
                                value={responsavelEquipe}
                                onChange={(e) => setResponsavelEquipe(e.target.value)}
                              />
                            </div>
                          </div>
                          <div className="bloco bloco--4">
                            <label htmlFor="agenda-obs" className="rotulo-campo">
                              Observações (opcional)
                            </label>
                            <input
                              id="agenda-obs"
                              type="text"
                              className="entrada"
                              placeholder="Ex.: Coleta matutina entre 08h e 11h"
                              value={obsEquipe}
                              onChange={(e) => setObsEquipe(e.target.value)}
                            />
                          </div>
                          <button
                            type="button"
                            className="botao botao--primario"
                            disabled={executandoAcao || !dataAgendada || !responsavelEquipe.trim()}
                            onClick={handleAgendar}
                          >
                            {executandoAcao ? 'Agendando…' : 'Salvar Agendamento de Coleta'}
                          </button>
                        </div>
                      )}

                      {/* Conteúdo da Aba Mudar Status */}
                      {abaAcao === 'STATUS' && (
                        <div className="bloco bloco--8">
                          <p className="subtitulo">
                            Altere o status operacional da coleta conforme a evolução em campo.
                          </p>
                          <div className="bloco bloco--4">
                            <label htmlFor="novo-status" className="rotulo-campo">
                              Novo Status da Coleta *
                            </label>
                            <select
                              id="novo-status"
                              className="entrada"
                              value={novoStatus}
                              onChange={(e) => setNovoStatus(e.target.value)}
                            >
                              <option value="EM_ANALISE">Em Análise</option>
                              <option value="ACEITA">Aceita</option>
                              <option value="EM_ANDAMENTO">Em Andamento (Equipe a caminho)</option>
                              <option value="CONCLUIDA">Concluída (Material recolhido)</option>
                              <option value="CANCELADA">Cancelada</option>
                            </select>
                          </div>

                          {novoStatus === 'CANCELADA' && (
                            <div className="bloco bloco--4">
                              <label htmlFor="motivo-cancelamento" className="rotulo-campo">
                                Motivo do Cancelamento * (obrigatório)
                              </label>
                              <textarea
                                id="motivo-cancelamento"
                                className="entrada"
                                rows={2}
                                placeholder="Informe a razão do cancelamento da coleta"
                                value={motivoCancelamento}
                                onChange={(e) => setMotivoCancelamento(e.target.value)}
                              />
                            </div>
                          )}

                          <div className="bloco bloco--4">
                            <label htmlFor="status-obs" className="rotulo-campo">
                              Observações da equipe (opcional)
                            </label>
                            <input
                              id="status-obs"
                              type="text"
                              className="entrada"
                              placeholder="Ex.: Coleta concluída com sucesso pelo operador."
                              value={obsEquipe}
                              onChange={(e) => setObsEquipe(e.target.value)}
                            />
                          </div>

                          <button
                            type="button"
                            className="botao botao--primario"
                            disabled={executandoAcao}
                            onClick={handleMudarStatus}
                          >
                            {executandoAcao ? 'Atualizando…' : 'Atualizar Status da Coleta'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            <footer className="modal-rodape">
              <button type="button" className="botao botao--secundario" onClick={fecharDetalhes}>
                Fechar
              </button>
            </footer>
          </div>
        </div>
      )}
    </main>
  );
}
