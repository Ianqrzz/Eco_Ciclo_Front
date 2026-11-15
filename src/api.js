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
    const corpo = await resposta.json();
    if (corpo?.fieldsMessage) return corpo.fieldsMessage;
    if (corpo?.message) return corpo.message;
    if (corpo?.detail) return corpo.detail;
  } catch {
    // corpo vazio ou não-JSON
  }
  if (resposta.status === 413) return 'A foto deve ter no máximo 5 MB.';
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
  return resposta.json();
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
