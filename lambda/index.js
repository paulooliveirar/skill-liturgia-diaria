// index.js
const Alexa = require('ask-sdk-core');
const { parse } = require('node-html-parser');

// Usa fetch nativo do Node.js 18+
// Mantém cache em memória para evitar fetchs repetidos
let cache = { ts: 0, ssml: '' };
const CACHE_TTL = 1000 * 60 * 10; // 10 minutos
const URL = 'https://www.cnbb.org.br/liturgia-diaria/';

async function getLiturgiaDiaria() {
  const now = Date.now();
  if (cache.ssml && (now - cache.ts) < CACHE_TTL) {
    return cache.ssml;
  }

  const res = await fetch(URL);
  const html = await res.text();
  const root = parse(html);
  const container = root.querySelector('.principal-content');

  const header = container.querySelector('h2').text.trim() || '';
  const secoes = {};
  let chave = null;

  for (const node of container.childNodes) {
    if (node.tagName === 'h3') {
      chave = node.text.trim();
      secoes[chave] = '';
    }
    else if (node.tagName === 'p' && chave) {
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

    return input.responseBuilder
      .speak(speech)
      .reprompt(isLaunch ? speech : null)
      .getResponse();
  }
};

const HelpHandler = {
  canHandle(input) {
    return input.requestEnvelope.request.type === 'IntentRequest'
        && input.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(input) {
    const p = 'Você pode dizer: tocar leituras sagradas.';
    return input.responseBuilder.speak(p).reprompt(p).getResponse();
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

const ErrorHandler = {
  canHandle() { return true; },
  handle(input, err) {
    console.error(err);
    return input.responseBuilder
      .speak('Desculpe, ocorreu um erro.')
      .getResponse();
  }
};

exports.handler = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    LiturgiaHandler,
    HelpHandler,
    CancelStopHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
