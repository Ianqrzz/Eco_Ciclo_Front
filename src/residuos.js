import eletrodomesticos from './assets/icons/residuo-eletrodomesticos.svg';
import eletronicos from './assets/icons/residuo-eletronicos.svg';
import entulho from './assets/icons/residuo-entulho.svg';
import moveis from './assets/icons/residuo-moveis.svg';
import pneus from './assets/icons/residuo-pneus.svg';
import reciclaveis from './assets/icons/residuo-reciclaveis.svg';
import roupas from './assets/icons/residuo-roupas.svg';

/**
 * Tipos de resíduo do backend (enum TipoResiduo).
 * - nome: usado no resumo
 * - rotulo: texto do cartão; o hífen opcional (­) quebra palavras longas
 */
export const RESIDUOS = [
  { valor: 'RECICLAVEIS', nome: 'Recicláveis', rotulo: 'Reciclá­veis', icone: reciclaveis, exemplo: 'Ex.: garrafas PET, latas e papelão' },
  { valor: 'ELETRONICOS', nome: 'Eletrônicos', rotulo: 'Eletrô­nicos', icone: eletronicos, exemplo: 'Ex.: computador antigo e cabos' },
  { valor: 'ELETRODOMESTICOS', nome: 'Eletrodomésticos', rotulo: 'Eletro­domés­ticos', icone: eletrodomesticos, exemplo: 'Ex.: geladeira que não funciona' },
  { valor: 'MOVEIS', nome: 'Móveis', rotulo: 'Móveis', icone: moveis, exemplo: 'Ex.: sofá de 3 lugares' },
  { valor: 'ENTULHO_REFORMA', nome: 'Entulho de reforma', rotulo: 'Entulho', icone: entulho, exemplo: 'Ex.: restos de tijolo e reboco' },
  { valor: 'PNEUS', nome: 'Pneus', rotulo: 'Pneus', icone: pneus, exemplo: 'Ex.: pneus de carro usados' },
  { valor: 'ROUPAS', nome: 'Roupas', rotulo: 'Roupas', icone: roupas, exemplo: 'Ex.: roupas e calçados usados' },
];

export function infoResiduo(tipo) {
  return RESIDUOS.find((r) => r.valor === tipo);
}

/** Limite do backend para entulho de reforma, por solicitação. */
export const LIMITE_ENTULHO_M3 = 1;
