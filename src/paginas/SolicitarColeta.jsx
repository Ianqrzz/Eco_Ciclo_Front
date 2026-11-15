import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError, criarSolicitacao } from '../api';
import camera from '../assets/icons/camera.svg';
import localizar from '../assets/icons/localizar.svg';
import { Erro, Icone, Marca, SemSessao } from '../componentes';
import { descobrirEndereco, formatarCep, obterPosicao } from '../localizacao';
import { LIMITE_ENTULHO_M3, RESIDUOS, infoResiduo } from '../residuos';
import { lerUsuario, sair } from '../sessao';

const TAMANHO_MAXIMO_FOTO = 5 * 1024 * 1024;

/*
 * Estados do GPS:
 * { tipo: 'inicial' } | { tipo: 'buscando' } | { tipo: 'ok', cidade } | { tipo: 'falhou', aviso }
 */

export default function SolicitarColeta() {
  const navigate = useNavigate();
  const [usuario] = useState(lerUsuario);
  const entradaFoto = useRef(null);

  const [tipo, setTipo] = useState('RECICLAVEIS');
  const [descricao, setDescricao] = useState('');
  const [quantidade, setQuantidade] = useState('1');
  const [volume, setVolume] = useState('');
  const [foto, setFoto] = useState(null);
  const [previa, setPrevia] = useState(null);
  const [gps, setGps] = useState({ tipo: 'inicial' });
  const [cep, setCep] = useState('');
  const [logradouro, setLogradouro] = useState('');
  const [numero, setNumero] = useState('');
  const [bairro, setBairro] = useState('');
  const [erro, setErro] = useState(null);
  const [enviando, setEnviando] = useState(false);

  // Libera a URL temporária da prévia quando a foto muda ou a tela fecha
  useEffect(
    () => () => {
      if (previa) URL.revokeObjectURL(previa);
    },
    [previa],
  );

  const ehEntulho = tipo === 'ENTULHO_REFORMA';
  const qtd = Number(quantidade);
  const vol = Number(volume.replace(',', '.'));
  const descricaoOk = descricao.trim().length >= 2;
  const quantidadeOk = Number.isInteger(qtd) && qtd >= 1;
  const volumeOk = !ehEntulho || (volume !== '' && vol > 0 && vol <= LIMITE_ENTULHO_M3);
  const mostrarEndereco = gps.tipo === 'ok' || gps.tipo === 'falhou';
  const enderecoOk = cep.replace(/\D/g, '').length === 8 && logradouro.trim() !== '' && bairro.trim() !== '';
  const pronto = descricaoOk && quantidadeOk && volumeOk && foto !== null && enderecoOk;

  function escolherFoto(e) {
    const arquivo = e.target.files?.[0];
    e.target.value = '';
    if (!arquivo) return;
    if (!['image/jpeg', 'image/png'].includes(arquivo.type)) {
      setErro('A foto deve ser JPG ou PNG.');
      return;
    }
    if (arquivo.size > TAMANHO_MAXIMO_FOTO) {
      setErro('A foto deve ter no máximo 5 MB.');
      return;
    }
    setErro(null);
    setFoto(arquivo);
    setPrevia(URL.createObjectURL(arquivo));
  }

  async function usarLocalizacao() {
    setGps({ tipo: 'buscando' });
    try {
      const endereco = await descobrirEndereco(await obterPosicao());
      if (!endereco) {
        setGps({ tipo: 'falhou', aviso: 'Não encontramos o endereço deste local. Preencha abaixo.' });
        return;
      }
      setCep(endereco.cep);
      setLogradouro(endereco.logradouro);
      setNumero(endereco.numero);
      setBairro(endereco.bairro);
      setGps({ tipo: 'ok', cidade: endereco.cidade });
    } catch (err) {
      setGps({ tipo: 'falhou', aviso: err instanceof Error ? err.message : 'GPS desativado. Preencha o endereço abaixo.' });
    }
  }

  async function enviar(e) {
    e.preventDefault();
    if (!usuario || !pronto || !foto) return;
    setErro(null);
    setEnviando(true);
    try {
      const criada = await criarSolicitacao({
        moradorId: usuario.id,
        enderecoColeta: {
          cep: cep.replace(/\D/g, ''),
          logradouro: logradouro.trim(),
          numero: numero.trim(),
          bairro: bairro.trim(),
        },
        item: {
          tipoResiduo: tipo,
          descricao: descricao.trim(),
          quantidade: qtd,
          volumeEstimadoM3: ehEntulho ? Math.round(vol * 100) / 100 : null,
        },
        foto,
      });
      navigate(`/solicitacao/${criada.id}`, { state: { solicitacao: criada } });
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível enviar a solicitação.');
      setEnviando(false);
    }
  }

  if (!usuario) return <SemSessao />;

  const pendencias = [
    !descricaoOk && 'a descrição',
    !quantidadeOk && 'a quantidade',
    !volumeOk && 'o volume (até 1 m³)',
    !foto && 'a foto',
    !enderecoOk && (mostrarEndereco ? 'o endereço' : 'a localização'),
  ].filter(Boolean);

  return (
    <main className="tela tela--solicitar">
      <header className="topo">
        <Marca />
        <button type="button" className="topo__sair" onClick={sair}>
          Sair
        </button>
      </header>

      <form className="bloco bloco--16" onSubmit={enviar} noValidate>
        <div className="bloco bloco--4">
          <h1 className="titulo--solicitar">Solicitar coleta</h1>
          <p className="subtitulo">Dê um novo destino ao seu resíduo.</p>
        </div>

        <div className="bloco bloco--8">
          <p className="rotulo" id="tipo-rotulo">
            Tipo de resíduo *
          </p>
          <div className="materiais" role="radiogroup" aria-labelledby="tipo-rotulo">
            {RESIDUOS.map((r) => (
              <button
                key={r.valor}
                type="button"
                role="radio"
                aria-checked={tipo === r.valor}
                aria-label={r.nome}
                className="material"
                onClick={() => setTipo(r.valor)}
              >
                <Icone src={r.icone} area={24} />
                <span className="material__rotulo">{r.rotulo}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bloco bloco--6">
          <label className="rotulo" htmlFor="descricao">
            Descrição *
          </label>
          <input
            id="descricao"
            className="entrada"
            maxLength={255}
            placeholder={infoResiduo(tipo)?.exemplo}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />
        </div>

        <div className={ehEntulho ? 'linha-dupla' : 'bloco bloco--6'}>
          <div className="bloco bloco--6">
            <label className="rotulo" htmlFor="quantidade">
              Quantidade *
            </label>
            <div className="quantidade">
              <input
                id="quantidade"
                type="number"
                inputMode="numeric"
                min="1"
                step="1"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                aria-describedby="quantidade-unidade"
              />
              <span id="quantidade-unidade">unid.</span>
            </div>
          </div>
          {ehEntulho && (
            <div className="bloco bloco--6">
              <label className="rotulo" htmlFor="volume">
                Volume *
              </label>
              <div className="quantidade">
                <input
                  id="volume"
                  type="number"
                  inputMode="decimal"
                  min="0.1"
                  max={LIMITE_ENTULHO_M3}
                  step="0.1"
                  placeholder="0,5"
                  value={volume}
                  onChange={(e) => setVolume(e.target.value)}
                  aria-describedby="volume-unidade volume-limite"
                />
                <span id="volume-unidade">m³</span>
              </div>
            </div>
          )}
        </div>
        {ehEntulho && (
          <p className="regiao" id="volume-limite">
            Entulho: máximo de 1 m³ por solicitação.
          </p>
        )}

        <div className="bloco bloco--6">
          <p className="rotulo">Foto do material *</p>
          <input
            ref={entradaFoto}
            className="visualmente-oculto"
            type="file"
            accept="image/jpeg,image/png"
            capture="environment"
            onChange={escolherFoto}
            tabIndex={-1}
            aria-hidden="true"
          />
          <button type="button" className="cartao-acao" onClick={() => entradaFoto.current?.click()}>
            {previa ? <img className="previa-foto" src={previa} alt="Prévia da foto do material" /> : <Icone src={camera} area={28} />}
            <span className="cartao-acao__texto">
              <span className="cartao-acao__titulo">{foto ? 'Foto adicionada · substituir' : 'Adicionar uma foto'}</span>
              <span className="cartao-acao__detalhe">JPG ou PNG · apenas 1 foto</span>
            </span>
          </button>
        </div>

        <div className="bloco bloco--7">
          <p className="rotulo">Localização *</p>
          <button type="button" className="cartao-acao cartao-acao--centro" onClick={usarLocalizacao} disabled={gps.tipo === 'buscando'}>
            <Icone src={localizar} area={20} />
            <span className="cartao-acao__titulo">{gps.tipo === 'buscando' ? 'Obtendo localização…' : 'Usar minha localização'}</span>
          </button>

          {(gps.tipo === 'inicial' || gps.tipo === 'falhou') && (
            <p className="mensagem mensagem--aviso" role="status">
              {gps.tipo === 'falhou' ? gps.aviso : 'GPS desativado. Ative para continuar.'}
            </p>
          )}

          {!mostrarEndereco && <p className="regiao">Seu endereço aparecerá aqui.</p>}

          {mostrarEndereco && (
            <fieldset className="endereco">
              <legend className="visualmente-oculto">Endereço da coleta</legend>
              {gps.tipo === 'ok' && <p className="regiao">Confira o endereço encontrado{gps.cidade ? ` em ${gps.cidade}` : ''}:</p>}
              <div className="linha-dupla linha-dupla--cep">
                <div className="bloco bloco--4">
                  <label className="rotulo-campo" htmlFor="cep">
                    CEP *
                  </label>
                  <input id="cep" className="entrada" inputMode="numeric" placeholder="44900-000" value={cep} onChange={(e) => setCep(formatarCep(e.target.value))} />
                </div>
                <div className="bloco bloco--4">
                  <label className="rotulo-campo" htmlFor="numero">
                    Número
                  </label>
                  <input id="numero" className="entrada" placeholder="S/N" value={numero} onChange={(e) => setNumero(e.target.value)} />
                </div>
              </div>
              <div className="bloco bloco--4">
                <label className="rotulo-campo" htmlFor="logradouro">
                  Rua *
                </label>
                <input id="logradouro" className="entrada" value={logradouro} onChange={(e) => setLogradouro(e.target.value)} />
              </div>
              <div className="bloco bloco--4">
                <label className="rotulo-campo" htmlFor="bairro">
                  Bairro *
                </label>
                <input id="bairro" className="entrada" value={bairro} onChange={(e) => setBairro(e.target.value)} />
              </div>
            </fieldset>
          )}
        </div>

        <p className="legenda">{pronto ? '​' : `* Falta preencher ${pendencias.join(', ').replace(/, ([^,]*)$/, ' e $1')}.`}</p>

        <Erro mensagem={erro} />

        <button type="submit" className="botao botao--primario" disabled={!pronto || enviando}>
          {enviando ? 'Enviando…' : 'Solicitar coleta'}
        </button>
      </form>
    </main>
  );
}
