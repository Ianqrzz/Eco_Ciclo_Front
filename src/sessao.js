/**
 * Ponto de integração com a sessão de usuário.
 *
 * Contrato: após o login, a tela grava em sessionStorage, na chave abaixo,
 * o JSON devolvido por POST /usuario/login: { id, nome, email, perfil }.
 */
export const CHAVE_SESSAO = 'ecociclo.usuario';

/** Rotas principais da aplicação. */
export const ROTA_LOGIN = '/login';
export const ROTA_SOLICITAR = '/solicitar';
export const ROTA_PREFEITURA = '/prefeitura';

export function salvarUsuario(usuario) {
  sessionStorage.setItem(CHAVE_SESSAO, JSON.stringify(usuario));
}

/** Retorna qualquer usuário logado com id válido. */
export function obterUsuarioLogado() {
  try {
    const bruto = sessionStorage.getItem(CHAVE_SESSAO);
    const usuario = bruto ? JSON.parse(bruto) : null;
    return usuario && typeof usuario.id === 'number' ? usuario : null;
  } catch {
    return null;
  }
}

/** Retorna o usuário logado com perfil MORADOR (para telas do cidadão). */
export function lerUsuario() {
  const usuario = obterUsuarioLogado();
  return usuario && usuario.perfil === 'MORADOR' ? usuario : null;
}

/** Retorna o usuário logado com perfil de equipe municipal / prefeitura. */
export function lerUsuarioPrefeitura() {
  const usuario = obterUsuarioLogado();
  const perfisPrefeitura = ['PREFEITURA', 'EQUIPE_MUNICIPAL', 'ADMIN'];
  return usuario && perfisPrefeitura.includes(usuario.perfil) ? usuario : null;
}

/** Salva usuário da prefeitura para acesso direto/demo. */
export function salvarUsuarioPrefeituraDemo() {
  const usuario = {
    id: 999,
    nome: 'Equipe Municipal de Irecê',
    email: 'prefeitura@irece.ba.gov.br',
    perfil: 'PREFEITURA',
  };
  salvarUsuario(usuario);
  return usuario;
}

export function sair() {
  try {
    sessionStorage.removeItem(CHAVE_SESSAO);
  } catch {
    // nada a limpar
  }
  window.location.assign(ROTA_LOGIN);
}
