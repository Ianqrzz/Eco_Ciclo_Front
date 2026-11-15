/** Pede a posição ao GPS do aparelho. */
export function obterPosicao() {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Seu aparelho não oferece localização. Preencha o endereço abaixo.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
      (erro) => {
        if (erro.code === erro.PERMISSION_DENIED) reject(new Error('GPS desativado. Ative para continuar ou preencha o endereço abaixo.'));
        else if (erro.code === erro.TIMEOUT) reject(new Error('A localização demorou demais. Tente de novo ou preencha o endereço.'));
        else reject(new Error('Não foi possível obter sua localização. Preencha o endereço abaixo.'));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  });
}

/**
 * Converte coordenadas em endereço usando o Nominatim (OpenStreetMap).
 * Campos que o OpenStreetMap não souber voltam vazios para o morador completar.
 * @returns {Promise<{cep: string, logradouro: string, numero: string, bairro: string, cidade: string} | null>}
 */
export async function descobrirEndereco({ latitude, longitude }) {
  try {
    const url =
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&addressdetails=1` +
      `&accept-language=pt-BR&lat=${latitude}&lon=${longitude}`;
    const resposta = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!resposta.ok) return null;
    const { address: e } = await resposta.json();
    if (!e) return null;

    const cidade = e.city ?? e.town ?? e.village ?? e.municipality ?? '';
    const uf = typeof e['ISO3166-2-lvl4'] === 'string' ? e['ISO3166-2-lvl4'].split('-')[1] : '';
    return {
      cep: formatarCep(e.postcode ?? ''),
      logradouro: e.road ?? e.pedestrian ?? e.footway ?? '',
      numero: e.house_number ?? '',
      bairro: e.suburb ?? e.neighbourhood ?? e.quarter ?? e.city_district ?? '',
      cidade: [cidade, uf].filter(Boolean).join('–'),
    };
  } catch {
    return null;
  }
}

export function formatarCep(valor) {
  const d = valor.replace(/\D/g, '').slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}
