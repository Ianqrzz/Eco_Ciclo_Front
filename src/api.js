export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

/*
 * Valores aceitos pelo backend (módulo "solicitacao"):
 * - tipoResiduo: MOVEIS, ELETRODOMESTICOS, ELETRONICOS, RECICLAVEIS, ENTULHO_REFORMA, PNEUS, ROUPAS
 * - status: PENDENTE, EM_ANALISE, ACEITA, AGENDADA, EM_ANDAMENTO, CONCLUIDA, CANCELADA, REJEITADA
 */

export class ApiError extends Error {}

/** Lê os formatos de erro do backend: validação, BusinessException e ProblemDetail. */
async function lerErro(resposta) {
  try {
    const texto = await resposta.text();
    try {
      const corpo = JSON.parse(texto);
      if (corpo?.fieldsMessage) return corpo.fieldsMessage;
      if (corpo?.message) return corpo.message;
      if (corpo?.detail) return corpo.detail;
      if (corpo?.error) return corpo.error;
    } catch {
      if (texto && texto.trim()) return texto;
    }
  } catch {
    // corpo vazio ou não-legível
  }
  if (resposta.status === 413) return 'A foto deve ter no máximo 5 MB.';
  if (resposta.status === 400 || resposta.status === 401) return 'E-mail ou senha inválidos.';
  return 'Não foi possível concluir. Tente novamente.';
}

async function requisicao(caminho, init) {
  let resposta;
  try {
    resposta = await fetch(`${API_URL}${caminho}`, init);
  } catch {
    throw new ApiError('Sem conexão com o servidor. Verifique sua internet.');
  }
  if (!resposta.ok) throw new ApiError(await lerErro(resposta));

  const texto = await resposta.text();
  if (!texto || !texto.trim()) {
    return null;
  }
  try {
    return JSON.parse(texto);
  } catch {
    return texto;
  }
}

/**
 * Cria a solicitação com a foto (POST multipart: parte "solicitacao" em JSON + parte "foto").
 * @param {{ moradorId: number, enderecoColeta: object, item: object, foto: File }} dados
 */
export function criarSolicitacao({ moradorId, enderecoColeta, item, foto }) {
  const dados = { moradorId, enderecoColeta, itens: [item] };
  const form = new FormData();
  form.append('solicitacao', new Blob([JSON.stringify(dados)], { type: 'application/json' }));
  form.append('foto', foto);
  return requisicao('/api/v1/solicitacoes-coleta', { method: 'POST', body: form });
}

export function buscarSolicitacao(id) {
  return requisicao(`/api/v1/solicitacoes-coleta/${id}`);
}

export function cancelarSolicitacao(id, moradorId) {
  return requisicao(`/api/v1/solicitacoes-coleta/${id}/cancelar?moradorId=${moradorId}`, { method: 'PATCH' });
}

/**
 * Autentica o usuário (POST /usuario/login).
 * @param {{ email: string, senha: string }} credenciais
 * @returns {Promise<{ id: number, nome: string, email: string, perfil: 'MORADOR' | 'PREFEITURA' | 'EQUIPE_MUNICIPAL' }>}
 */
export function loginUsuario({ email, senha }) {
  return requisicao('/usuario/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, senha }),
  });
}

/* ==========================================================================
 * MÓDULO EXCLUSIVO DA PREFEITURA / EQUIPE MUNICIPAL (RF03 e RF04)
 * ========================================================================== */

/**
 * RF03: Lista todas as solicitações no painel exclusivo da prefeitura com filtros e paginação.
 * @param {object} filtro { status, tipoResiduo, bairro, dataInicio, dataFim, termo }
 * @param {number} [pagina=0]
 * @param {number} [tamanho=10]
 * @param {string} [ordenacao='dataSolicitacao,desc']
 */
export function listarSolicitacoesPrefeitura(filtro = {}, pagina = 0, tamanho = 10, ordenacao = 'dataSolicitacao,desc') {
  const params = new URLSearchParams();
  if (filtro.status) params.append('status', filtro.status);
  if (filtro.tipoResiduo) params.append('tipoResiduo', filtro.tipoResiduo);
  if (filtro.bairro?.trim()) params.append('bairro', filtro.bairro.trim());
  if (filtro.termo?.trim()) params.append('termo', filtro.termo.trim());
  if (filtro.dataInicio) params.append('dataInicio', filtro.dataInicio);
  if (filtro.dataFim) params.append('dataFim', filtro.dataFim);
  if (pagina != null) params.append('page', pagina);
  if (tamanho != null) params.append('size', tamanho);
  if (ordenacao) params.append('sort', ordenacao);

  const query = params.toString() ? `?${params.toString()}` : '';
  return requisicao(`/api/v1/painel-prefeitura/solicitacoes${query}`);
}

/**
 * RF03: Obtém detalhes completos de uma solicitação no painel da Prefeitura.
 * @param {number|string} id
 */
export function obterDetalhesSolicitacaoPrefeitura(id) {
  return requisicao(`/api/v1/painel-prefeitura/solicitacoes/${id}`);
}

/**
 * RF03: Obtém as estatísticas consolidadas de solicitações para os KPIs do painel da Prefeitura.
 */
export function obterEstatisticasPrefeitura() {
  return requisicao('/api/v1/painel-prefeitura/estatisticas');
}

/**
 * RF04: Permite à Equipe Municipal aceitar uma solicitação de coleta.
 * @param {number|string} id
 * @param {string} [observacoesEquipe]
 */
export function aceitarSolicitacaoPrefeitura(id, observacoesEquipe = '') {
  return requisicao(`/api/v1/painel-prefeitura/solicitacoes/${id}/aceitar`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ observacoesEquipe: observacoesEquipe || undefined }),
  });
}

/**
 * RF04: Permite à Equipe Municipal rejeitar uma solicitação de coleta com motivo obrigatório.
 * @param {number|string} id
 * @param {string} motivoRejeicao
 */
export function rejeitarSolicitacaoPrefeitura(id, motivoRejeicao) {
  return requisicao(`/api/v1/painel-prefeitura/solicitacoes/${id}/rejeitar`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ motivoRejeicao }),
  });
}

/**
 * RF04: Permite à Equipe Municipal mudar o status de uma coleta.
 * @param {number|string} id
 * @param {{ novoStatus: string, observacoesEquipe?: string, motivoCancelamento?: string }} dados
 */
export function atualizarStatusPrefeitura(id, { novoStatus, observacoesEquipe = '', motivoCancelamento = '' }) {
  const corpo = { novoStatus };
  if (observacoesEquipe?.trim()) corpo.observacoesEquipe = observacoesEquipe.trim();
  if (motivoCancelamento?.trim()) corpo.motivoCancelamento = motivoCancelamento.trim();

  return requisicao(`/api/v1/painel-prefeitura/solicitacoes/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(corpo),
  });
}

/**
 * RF04: Permite à Equipe Municipal agendar data e responsável para a coleta.
 * @param {number|string} id
 * @param {{ dataAgendada: string, responsavelEquipe: string, observacoesEquipe?: string }} dados
 */
export function agendarSolicitacaoPrefeitura(id, { dataAgendada, responsavelEquipe, observacoesEquipe = '' }) {
  return requisicao(`/api/v1/painel-prefeitura/solicitacoes/${id}/agendar`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      dataAgendada,
      responsavelEquipe,
      observacoesEquipe: observacoesEquipe || undefined,
    }),
  });
}

/**
 * RF04: Permite à Equipe Municipal agendar em lote múltiplas coletas.
 * @param {{ solicitacoesIds: number[], dataAgendada: string, responsavelEquipe: string, observacoesEquipe?: string }} dados
 */
export function agendarEmLotePrefeitura({ solicitacoesIds, dataAgendada, responsavelEquipe, observacoesEquipe = '' }) {
  return requisicao('/api/v1/painel-prefeitura/solicitacoes/agendar-lote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      solicitacoesIds,
      dataAgendada,
      responsavelEquipe,
      observacoesEquipe: observacoesEquipe || undefined,
    }),
  });
}
