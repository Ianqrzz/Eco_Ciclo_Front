import logoCiclo from './assets/icons/logo-ciclo.svg';

/** Área de ícone com o tamanho do Figma; o SVG mantém as dimensões próprias, centralizado. */
export function Icone({ src, area }) {
  return (
    <span className="icone" style={{ width: area, height: area }} aria-hidden="true">
      <img src={src} alt="" />
    </span>
  );
}

export function Marca() {
  return (
    <div className="marca">
      <Icone src={logoCiclo} area={32} />
      <p className="marca__nome">ecociclo</p>
    </div>
  );
}

export function Erro({ mensagem }) {
  if (!mensagem) return null;
  return (
    <p className="mensagem mensagem--erro" role="alert">
      {mensagem}
    </p>
  );
}

/** Mostrado quando ninguém entrou pelo login como morador. */
export function SemSessao() {
  return (
    <main className="tela tela--solicitar">
      <header className="topo">
        <Marca />
      </header>
      <p className="mensagem mensagem--aviso" role="status">
        Entre com sua conta de cidadão para solicitar uma coleta.
      </p>
    </main>
  );
}

/** Mostrado quando o usuário não está autenticado como equipe da prefeitura. */
export function SemSessaoPrefeitura({ onAcessoDemo }) {
  return (
    <main className="tela tela--painel">
      <header className="topo">
        <Marca />
        <span className="topo__cidade">IRECÊ · BA · PREFEITURA</span>
      </header>
      <div className="bloco bloco--16" style={{ marginTop: 32, maxWidth: 440 }}>
        <span className="selo">Acesso Restrito</span>
        <h1 className="titulo--solicitar">Painel da Prefeitura</h1>
        <p className="subtitulo">
          Esta área é exclusiva para a Equipe Municipal de Irecê gerenciar o backlog de coletas verdes (RF03 e RF04).
        </p>
        <div className="bloco bloco--12" style={{ marginTop: 12 }}>
          <a href="/login" className="botao botao--primario" style={{ textDecoration: 'none' }}>
            Fazer login como Prefeitura
          </a>
          {onAcessoDemo && (
            <button type="button" className="botao botao--secundario" onClick={onAcessoDemo}>
              Acessar em modo demonstração
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
