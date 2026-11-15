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

/** Mostrado quando ninguém entrou pelo login (tela de outra equipe). */
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
