import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError, cadastrarMorador } from '../api';
import { Erro, IconeOlho } from '../componentes';
import { ROTA_LOGIN } from '../sessao';

/** Mesma regra do @ValidPassword do backend: 8 a 20 caracteres, número, minúscula, maiúscula e especial. */
const REGRA_SENHA = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!])(?=\S+$).{8,20}$/;
const REGRA_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EXEMPLO = {
  nome: 'Maria Oliveira',
  email: 'maria@exemplo.com',
  telefone: '(74) 99999-9999',
  senha: 'Ecociclo@2026',
};

/** Máscara (74) 9999-9999 ou (74) 99999-9999; o envio usa só os dígitos. */
function formatarTelefone(valor) {
  const d = valor.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function IconeVoltar() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

/** Retorna a primeira mensagem de erro de validação, ou null se estiver tudo certo. */
function validar({ nome, email, telefone, senha, confirmacao }) {
  if (!nome.trim() || !email.trim() || !telefone || !senha || !confirmacao) {
    return 'Preencha todos os campos obrigatórios.';
  }
  if (nome.trim().length < 3) return 'O nome deve ter pelo menos 3 caracteres.';
  if (!REGRA_EMAIL.test(email.trim())) return 'Informe um e-mail válido.';

  const digitos = telefone.replace(/\D/g, '').length;
  if (digitos < 10 || digitos > 11) return 'Informe o telefone com DDD.';

  if (!REGRA_SENHA.test(senha)) {
    return 'A senha deve ter de 8 a 20 caracteres, com letra maiúscula, minúscula, número e um destes caracteres: @ # $ % ^ & + = !';
  }
  if (senha !== confirmacao) return 'As senhas não conferem.';
  return null;
}

export default function Cadastro() {
  const navigate = useNavigate();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);
  const [erro, setErro] = useState(null);
  const [enviando, setEnviando] = useState(false);

  function preencherExemplo() {
    setErro(null);
    setNome(EXEMPLO.nome);
    setEmail(EXEMPLO.email);
    setTelefone(EXEMPLO.telefone);
    setSenha(EXEMPLO.senha);
    setConfirmacao(EXEMPLO.senha);
  }

  async function enviar(e) {
    e.preventDefault();
    if (enviando) return;

    const problema = validar({ nome, email, telefone, senha, confirmacao });
    if (problema) {
      setErro(problema);
      return;
    }

    setErro(null);
    setEnviando(true);
    try {
      await cadastrarMorador({ nome: nome.trim(), email: email.trim(), senha, telefone });
      navigate(ROTA_LOGIN, { replace: true });
    } catch (err) {
      console.error('Erro no cadastro:', err);
      setErro(err instanceof ApiError ? err.message : 'Não foi possível criar a conta. Tente novamente.');
      setEnviando(false);
    }
  }

  return (
    <main className="tela tela--cadastro">
      <header className="topo">
        <button type="button" className="topo__voltar" onClick={() => navigate(ROTA_LOGIN)} aria-label="Voltar para o login">
          <IconeVoltar />
        </button>
        <p className="marca__nome marca__nome--topo">ecociclo</p>
      </header>

      <div className="bloco bloco--6">
        <h1 className="titulo--login">Vamos começar?</h1>
        <p className="subtitulo">Crie sua conta de cidadão.</p>
        <p className="legenda">* Campos obrigatórios</p>
      </div>

      <form className="bloco bloco--16" onSubmit={enviar} noValidate>
        <div className="bloco bloco--6">
          <label className="rotulo" htmlFor="nome">
            Nome completo *
          </label>
          <input
            id="nome"
            className="entrada"
            type="text"
            autoComplete="name"
            placeholder="Como você se chama?"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
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
          <label className="rotulo" htmlFor="telefone">
            Telefone *
          </label>
          <input
            id="telefone"
            className="entrada"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder="(74) 99999-9999"
            value={telefone}
            onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
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
              autoComplete="new-password"
              placeholder="Mínimo de 8 caracteres"
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

        <div className="bloco bloco--6">
          <label className="rotulo" htmlFor="confirmacao">
            Confirmar senha *
          </label>
          <div className="campo-senha">
            <input
              id="confirmacao"
              type={mostrarConfirmacao ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Repita sua senha"
              value={confirmacao}
              onChange={(e) => setConfirmacao(e.target.value)}
            />
            <button
              type="button"
              className="campo-senha__alternar"
              onClick={() => setMostrarConfirmacao((v) => !v)}
              aria-label={mostrarConfirmacao ? 'Ocultar confirmação de senha' : 'Mostrar confirmação de senha'}
            >
              <IconeOlho visivel={mostrarConfirmacao} />
              <span>{mostrarConfirmacao ? 'Ocultar' : 'Mostrar'}</span>
            </button>
          </div>
        </div>

        <Erro mensagem={erro} />

        <button type="submit" className="botao botao--primario" disabled={enviando}>
          {enviando ? 'Criando conta…' : 'Criar conta'}
        </button>

        <p className="texto-cadastro">
          Já tem conta?{' '}
          <Link to={ROTA_LOGIN} className="link-primario">
            Entrar
          </Link>
        </p>
      </form>

      <footer className="rodape-login">
        <button type="button" className="rodape-login__exemplo" onClick={preencherExemplo}>
          Toque em um campo para preencher o exemplo.
        </button>
      </footer>
    </main>
  );
}
