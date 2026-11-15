/**
 * Ponto de integração com o login (feito por outra equipe).
 *
 * Contrato: depois do login, a tela de login grava em sessionStorage, na chave abaixo,
 * o JSON devolvido por POST /usuario/login: { id, nome, email, perfil }.
 * As telas de solicitação só leem esse valor. Ajuste aqui se o login combinar outro formato.
 */
export const CHAVE_SESSAO = 'ecociclo.usuario';

/** Rota da tela de login da outra equipe, usada pelo botão "Sair". */
export const ROTA_LOGIN = '/login';

export function lerUsuario() {
  try {
    const bruto = sessionStorage.getItem(CHAVE_SESSAO);
    const usuario = bruto ? JSON.parse(bruto) : null;
    return usuario && typeof usuario.id === 'number' && usuario.perfil === 'MORADOR' ? usuario : null;
  } catch {
    return null;
  }
}

export function sair() {
  try {
    sessionStorage.removeItem(CHAVE_SESSAO);
  } catch {
    // nada a limpar
  }
  window.location.assign(ROTA_LOGIN);
}
