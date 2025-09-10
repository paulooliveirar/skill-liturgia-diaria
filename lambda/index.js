const Alexa = require('ask-sdk-core');
const https = require('https');
const { parse } = require('node-html-parser');

const URL = 'https://www.cnbb.org.br/liturgia-diaria/';
const CACHE_TTL = 1000 * 60 * 10; // 10 minutos
let cache = { ts: 0, ssml: '' };

/**
 * Faz GET com https e retorna o HTML como string
 */
function fetchHtml(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function getLiturgiaDiaria() {
  const now = Date.now();
  if (cache.ssml && (now - cache.ts) < CACHE_TTL) {
    return cache.ssml;
  }

  const html = await fetchHtml(URL);
  const root = parse(html);
  const container = root.querySelector('.principal-content') || { childNodes: [] };

  const header = container.querySelector('h2')?.text.trim() || '';
  const secoes = {};
  let chave = null;

  for (const node of container.childNodes) {
    if (node.tagName === 'h3') {
      chave = node.text.trim();
      secoes[chave] = '';
    } else if (node.tagName === 'p' && chave) {
      secoes[chave] += node.text.trim() + ' ';
    }
  }

  let ssml = `<speak><p>${header}</p>`;
  for (const [titulo, corpo] of Object.entries(secoes)) {
    ssml += `<p><emphasis level="moderate">${titulo}:</emphasis> ${corpo}</p>`;
  }
  ssml += `</speak>`;

  cache = { ts: now, ssml };
  return ssml;
}

const LiturgiaHandler = {
  canHandle(input) {
    const req = input.requestEnvelope.request;
    return req.type === 'LaunchRequest'
      || (req.type === 'IntentRequest' && req.intent.name === 'LiturgiaDiariaIntent');
  },
  async handle(input) {
    const isLaunch = input.requestEnvelope.request.type === 'LaunchRequest';
    const speech = isLaunch
      ? 'Bem-vindo às Leituras Sagradas. Diga: tocar leituras sagradas.'
      : await getLiturgiaDiaria();

    const builder = input.responseBuilder.speak(speech);
    if (isLaunch) builder.reprompt(speech);
    return builder.getResponse();
  }
};

const HelpHandler = {
  canHandle(input) {
    return input.requestEnvelope.request.type === 'IntentRequest'
      && input.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(input) {
    const prompt = 'Você pode dizer: tocar leituras sagradas.';
    return input.responseBuilder.speak(prompt).reprompt(prompt).getResponse();
  }
};

const CancelStopHandler = {
  canHandle(input) {
    const r = input.requestEnvelope.request;
    return r.type === 'IntentRequest'
      && (r.intent.name === 'AMAZON.CancelIntent' || r.intent.name === 'AMAZON.StopIntent');
  },
  handle(input) {
    return input.responseBuilder.speak('Até logo!').getResponse();
  }
};

const SessionEndedHandler = {
  canHandle(input) {
    return input.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle(input) {
    return input.responseBuilder.getResponse();
  }
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(input, error) {
    console.error(error);
    return input.responseBuilder
      .speak('Desculpe, ocorreu um erro.')
      .getResponse();
  }
};

exports.handler = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    LiturgiaHandler,
    HelpHandler,
    CancelStopHandler,
    SessionEndedHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();