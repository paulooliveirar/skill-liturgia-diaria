const axios = require('axios');
const cheerio = require('cheerio');

async function getLiturgiaDiaria() {
  const url = 'https://www.cnbb.org.br/liturgia-diaria/';
  const resp = await axios.get(url);
  const $ = cheerio.load(resp.data);

  const container = $('.principal-content');
  const header = container.find('h2').first().text().trim();

  const secoes = {};
  container.find('h3, p').each((_, el) => {
    const tag = el.tagName.toLowerCase();
    const texto = $(el).text().trim();
    if (tag === 'h3') {
      secoes[texto] = '';
    } else {
      const atual = Object.keys(secoes).pop();
      secoes[atual] += texto + ' ';
    }
  });

  let ssml = `<speak><p>${header}</p>`;
  for (const [titulo, corpo] of Object.entries(secoes)) {
    ssml += `<p><emphasis level="moderate">${titulo}</emphasis> ${corpo}</p>`;
  }
  ssml += `</speak>`;

  return ssml;
}

module.exports = { getLiturgiaDiaria };
