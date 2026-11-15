import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ApiError, buscarSolicitacao, cancelarSolicitacao } from '../api';
import sucesso from '../assets/icons/sucesso.svg';
import { Erro, Icone, Marca, SemSessao } from '../componentes';
import { infoResiduo } from '../residuos';
import { lerUsuario, sair } from '../sessao';

/** Textos da tela para cada status do backend (enum StatusSolicitacao). */
const TEXTOS = {
  PENDENTE: { titulo: 'Coleta solicitada!', texto: 'Estamos buscando um coletor próximo de você.', selo: 'Aguardando coletor', tom: 'pendente' },
  EM_ANALISE: { titulo: 'Coleta solicitada!', texto: 'A prefeitura está analisando sua solicitação.', selo: 'Em análise', tom: 'pendente' },
  ACEITA: { titulo: 'Coletor confirmado', texto: 'Sua coleta foi aceita. O cancelamento não está mais disponível.', selo: 'Aceita', tom: 'aceita' },
  AGENDADA: { titulo: 'Coleta agendada', texto: 'Sua coleta tem data marcada. O cancelamento não está mais disponível.', selo: 'Agendada', tom: 'aceita' },
  EM_ANDAMENTO: { titulo: 'Coleta a caminho', texto: 'A equipe está a caminho para recolher o material.', selo: 'Em andamento', tom: 'aceita' },
  CONCLUIDA: { titulo: 'Coleta concluída', texto: 'Seu resíduo já ganhou um novo destino. Obrigado!', selo: 'Concluída', tom: 'aceita' },
  CANCELADA: { titulo: 'Solicitação cancelada', texto: 'Tudo certo. Nenhum coletor havia aceitado sua solicitação.', selo: 'Cancelada', tom: 'cancelada' },
  REJEITADA: { titulo: 'Solicitação recusada', texto: 'A prefeitura não pôde atender esta solicitação.', selo: 'Recusada', tom: 'cancelada' },
};

/** RF09: o morador só cancela antes da aceitação (mesma regra do backend). */
const CANCELAVEIS = ['PENDENTE', 'EM_ANALISE'];
const ENCERRADAS = ['CANCELADA', 'REJEITADA', 'CONCLUIDA'];

function formatarData(iso) {
  const d = new Date(iso);
  const dois = (n) => String(n).padStart(2, '0');
  return `${dois(d.getDate())}/${dois(d.getMonth() + 1)}/${d.getFullYear()} · ${dois(d.getHours())}:${dois(d.getMinutes())}`;
}

export default function Solicitacao() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  const [usuario] = useState(lerUsuario);

  const [dados, setDados] = useState(state?.solicitacao ?? null);
  const [erro, setErro] = useState(null);
  const [cancelando, setCancelando] = useState(false);

  useEffect(() => {
    if (!usuario || state?.solicitacao || !id) return;
    let ativo = true;
    buscarSolicitacao(id)
      .then((s) => {
        if (!ativo) return;
        if (s.morador?.id === usuario.id) setDados(s);
        else setErro('Solicitação de coleta não encontrada.');
      })
      .catch((err) => ativo && setErro(err instanceof ApiError ? err.message : 'Não foi possível carregar a solicitação.'));
    return () => {
      ativo = false;
    };
  }, [id, usuario, state]);

  async function cancelar() {
    if (!dados || !usuario) return;
    if (!window.confirm('Cancelar esta solicitação de coleta?')) return;
    setErro(null);
    setCancelando(true);
    try {
      setDados(await cancelarSolicitacao(dados.id, usuario.id));
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível cancelar.');
      // Atualiza o status: a prefeitura pode ter aceitado nesse meio tempo
      buscarSolicitacao(dados.id).then(setDados).catch(() => undefined);
    } finally {
      setCancelando(false);
    }
  }

  if (!usuario) return <SemSessao />;

  const textos = dados ? TEXTOS[dados.status] : null;
  const item = dados?.itens?.[0];
  const residuo = item ? infoResiduo(item.tipoResiduo) : undefined;

  return (
    <main className="tela tela--solicitar">
      <header className="topo">
        <Marca />
        <button type="button" className="topo__sair" onClick={sair}>
          Sair
        </button>
      </header>

      {!dados && !erro && (
        <p className="subtitulo" role="status">
          Carregando…
        </p>
      )}

      {!dados && erro && (
        <div className="bloco bloco--16">
          <Erro mensagem={erro} />
          <button type="button" className="botao botao--secundario" onClick={() => navigate('/solicitar')}>
            Nova solicitação
          </button>
        </div>
      )}

      {dados && textos && (
        <div className="bloco bloco--24">
          <section className="resultado" aria-live="polite">
            <span className="resultado__icone">
              <Icone src={sucesso} area={32} />
            </span>
            <h1 className="resultado__titulo">{textos.titulo}</h1>
            <p className="resultado__texto">{textos.texto}</p>
          </section>

          <section className="resumo" aria-label="Resumo da solicitação">
            <p className="resumo__codigo">Solicitação {dados.protocolo}</p>
            <span className={`status status--${textos.tom}`}>{textos.selo}</span>
            {item && (
              <div className="bloco bloco--4">
                <div className="resumo__linha">
                  <strong>{residuo?.nome ?? item.tipoResiduoDescricao}</strong>
                  <span>
                    <strong>{item.quantidade}</strong> unid.
                    {item.volumeEstimadoM3 != null && (
                      <>
                        {' '}
                        · <strong>{item.volumeEstimadoM3.toLocaleString('pt-BR')}</strong> m³
                      </>
                    )}
                  </span>
                </div>
                <p className="resumo__info">{item.descricao}</p>
              </div>
            )}
            {dados.enderecoColeta?.bairro && <p className="resumo__info">{dados.enderecoColeta.bairro}</p>}
            {dados.status === 'AGENDADA' && dados.dataAgendada && <p className="resumo__info">Coleta marcada para {formatarData(dados.dataAgendada)}</p>}
            {dados.status === 'REJEITADA' && dados.motivoRejeicao && <p className="resumo__info">Motivo: {dados.motivoRejeicao}</p>}
            <p className="resumo__data">{formatarData(dados.dataSolicitacao)}</p>
          </section>

          <Erro mensagem={erro} />

          {CANCELAVEIS.includes(dados.status) && (
            <div className="bloco bloco--12">
              <p className="nota">Cancele apenas antes da aceitação.</p>
              <button type="button" className="botao botao--secundario" onClick={cancelar} disabled={cancelando}>
                {cancelando ? 'Cancelando…' : 'Cancelar solicitação'}
              </button>
            </div>
          )}

          {ENCERRADAS.includes(dados.status) && (
            <button type="button" className="botao botao--secundario" onClick={() => navigate('/solicitar')}>
              Voltar à solicitação
            </button>
          )}
        </div>
      )}
    </main>
  );
}
