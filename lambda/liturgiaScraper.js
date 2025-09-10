const axios = require('axios');
const { parse } = require('node-html-parser');

async function getLiturgiaDiaria() {
  // Faz request na CNBB
  const url = 'https://www.cnbb.org.br/liturgia-diaria/';
  const resp = await axios.get(url);
  
  // Parseia HTML e seleciona container principal
  const root = parse(resp.data);
  const container = root.querySelector('.principal-content');
  
  // Extrai cabeçalho (tempo e data)
  const headerEl = container.querySelector('h2');
  const header = headerEl ? headerEl.text.trim() : '';

  // Percorre filhos para mapear seções
  const secoes = {};
  let ultimaSecao = null;
  
  container.childNodes.forEach(node => {
    if (node.tagName === 'h3') {
      ultimaSecao = node.text.trim();
      secoes[ultimaSecao] = '';
    }
    else if (node.tagName === 'p' && ultimaSecao) {
      secoes[ultimaSecao] += node.text.trim() + ' ';
    }
  });

  // Monta SSML
  let ssml = `<speak><p>${header}</p>`;
  Object.entries(secoes).forEach(
    ([titulo, corpo]) => {
      ssml += `<p><emphasis level="moderate">${titulo}:</emphasis> ${corpo}</p>`;
    }
  );
  ssml += `</speak>`;

  return ssml;
}

module.exports = { getLiturgiaDiaria };
