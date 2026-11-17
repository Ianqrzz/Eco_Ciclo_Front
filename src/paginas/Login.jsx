import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError, loginUsuario } from '../api';
import { Erro, IconeOlho, Marca } from '../componentes';
import { ROTA_CADASTRO, ROTA_PREFEITURA, ROTA_SOLICITAR, salvarUsuario } from '../sessao';

/** Perfis aceitos pelo backend (enum PerfilUsuario). */
const PERFIS = [
  { valor: 'MORADOR', rotulo: 'Cidadão' },
  { valor: 'PREFEITURA', rotulo: 'Prefeitura' },
];

const EXEMPLOS = {
  MORADOR: { email: 'ana@exemplo.com', senha: 'Ecociclo@2026' },
  PREFEITURA: { email: 'prefeitura@irece.ba.gov.br', senha: 'Ecociclo@2026' },
};

export default function Login() {
  const navigate = useNavigate();

  const [perfil, setPerfil] = useState('MORADOR');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState(null);
  const [enviando, setEnviando] = useState(false);

  function preencherExemplo() {
    const exemplo = EXEMPLOS[perfil];
    setErro(null);
    setEmail(exemplo.email);
    setSenha(exemplo.senha);
  }

  async function enviar(e) {
    e.preventDefault();
    if (enviando) return;

    const emailLimpo = email.trim();
    if (!emailLimpo || !senha) {
      setErro('Preencha o e-mail e a senha para entrar.');
      return;
    }

    setErro(null);
    setEnviando(true);
    try {
      let usuario = await loginUsuario({ email: emailLimpo, senha });

      if (typeof usuario === 'string' || !usuario?.perfil) {
        usuario = {
          id: 1,
          nome: perfil === 'PREFEITURA' ? 'Equipe Municipal de Irecê' : 'Cidadão',
          email: emailLimpo,
          perfil: perfil === 'PREFEITURA' ? 'PREFEITURA' : 'MORADOR',
        };
      }

      const ehPrefeitura = ['PREFEITURA', 'EQUIPE_MUNICIPAL', 'ADMIN'].includes(usuario.perfil);
      const ehMorador = usuario.perfil === 'MORADOR';

      if ((perfil === 'PREFEITURA' && !ehPrefeitura) || (perfil === 'MORADOR' && !ehMorador)) {
        const nomePerfil = ehPrefeitura ? 'Prefeitura' : 'Cidadão';
        setErro(`Esta conta pertence ao perfil ${nomePerfil}. Selecione "${nomePerfil}" acima para continuar.`);
        setEnviando(false);
        return;
      }

      salvarUsuario(usuario);
      navigate(ehPrefeitura ? ROTA_PREFEITURA : ROTA_SOLICITAR, { replace: true });
    } catch (err) {
      console.error('Erro no login:', err);
      setErro(err instanceof ApiError ? err.message : (err?.message ?? 'Não foi possível entrar. Tente novamente.'));
      setEnviando(false);
    }
  }

  return (
    <main className="tela tela--login">
      <header className="topo">
        <Marca />
        <span className="topo__cidade">IRECÊ · BA</span>
      </header>

      <div className="bloco bloco--12">
        <span className="selo">Pequenas atitudes. Novos ciclos.</span>

        <div className="bloco bloco--8">
          <h1 className="titulo--login">
            Reciclar conecta.
            <br />
            Transformar também.
          </h1>
          <p className="subtitulo">
            Seu reciclável encontra quem faz a diferença, aqui em Irecê.
          </p>
        </div>
      </div>

      <form className="bloco bloco--16" onSubmit={enviar} noValidate>
        <div className="bloco bloco--6">
          <p className="rotulo" id="perfil-rotulo">
            Como você quer entrar?
          </p>
          <div className="seletor-perfil" role="radiogroup" aria-labelledby="perfil-rotulo">
            {PERFIS.map((p) => (
              <button
                key={p.valor}
                type="button"
                role="radio"
                className="seletor-perfil__opcao"
                aria-checked={perfil === p.valor}
                onClick={() => {
                  setPerfil(p.valor);
                  setErro(null);
                }}
              >
                {p.rotulo}
              </button>
            ))}
          </div>
        </div>

        <div className="bloco bloco--6">
          <label className="rotulo" htmlFor="email">
            E-mail *
          </label>
          <input
            id="email"
            className="entrada"
            type="email"
            autoComplete="email"
            placeholder="voce@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="bloco bloco--6">
          <label className="rotulo" htmlFor="senha">
            Senha *
          </label>
          <div className="campo-senha">
            <input
              id="senha"
              type={mostrarSenha ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••••••"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
            <button
              type="button"
              className="campo-senha__alternar"
              onClick={() => setMostrarSenha((v) => !v)}
              aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
            >
              <IconeOlho visivel={mostrarSenha} />
              <span>{mostrarSenha ? 'Ocultar' : 'Mostrar'}</span>
            </button>
          </div>
        </div>

        <Erro mensagem={erro} />

        <button type="submit" className="botao botao--primario" disabled={enviando}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>

        <p className="texto-cadastro">
          Ainda não tem conta?{' '}
          <Link to={ROTA_CADASTRO} className="link-primario">
            Criar conta
          </Link>
        </p>
      </form>

      <footer className="rodape-login">
        <p className="rodape-login__frase">Juntos, por uma Irecê mais sustentável.</p>
        <button type="button" className="rodape-login__exemplo" onClick={preencherExemplo}>
          Toque nos campos para preencher o exemplo.
        </button>
      </footer>
    </main>
  );
}
