// index.js
const Alexa = require('ask-sdk-core');
const axios = require('axios');
const { parse } = require('node-html-parser');

/**
 * Faz scraping da Liturgia Diária no site da CNBB e retorna SSML
 */
async function getLiturgiaDiaria() {
  const url = 'https://www.cnbb.org.br/liturgia-diaria/';
  const resp = await axios.get(url);
  const root = parse(resp.data);
  const container = root.querySelector('.principal-content');

  // Cabeçalho (tempo litúrgico e data)
  const headerEl = container.querySelector('h2');
  const header = headerEl ? headerEl.text.trim() : '';

  // Extrai blocos de h3 e p
  const secoes = {};
  let ultimaSecao = null;
  container.childNodes.forEach(node => {
    if (node.tagName === 'h3') {
      ultimaSecao = node.text.trim();
      secoes[ultimaSecao] = '';
    } else if (node.tagName === 'p' && ultimaSecao) {
      secoes[ultimaSecao] += node.text.trim() + ' ';
    }
  });

  // Monta SSML
  let ssml = `<speak><p>${header}</p>`;
  Object.entries(secoes).forEach(([titulo, corpo]) => {
    ssml += `<p><emphasis level="moderate">${titulo}:</emphasis> ${corpo}</p>`;
  });
  ssml += `</speak>`;

  return ssml;
}

// Handler para LaunchRequest
const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
  },
  handle(handlerInput) {
    const speechText = 'Bem-vindo às Leituras Sagradas. Diga: tocar leituras sagradas.';
    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .getResponse();
  }
};

// Handler para a Intent de Liturgia Diária
const LiturgiaDiariaIntentHandler = {
  canHandle(handlerInput) {
    const req = handlerInput.requestEnvelope.request;
    return req.type === 'IntentRequest'
        && req.intent.name === 'LiturgiaDiariaIntent';
  },
  async handle(handlerInput) {
    try {
      const ssml = await getLiturgiaDiaria();
      return handlerInput.responseBuilder
        .speak(ssml)
        .withSimpleCard('Leituras Sagradas', 'Aqui estão suas leituras do dia.')
        .getResponse();
    } catch (error) {
      console.error(error);
      return handlerInput.responseBuilder
        .speak('Desculpe, não consegui carregar as leituras agora. Tente novamente mais tarde.')
        .getResponse();
    }
  }
};

// Handlers padrão de Help, Cancel/Stop e Sessão
const HelpIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
        && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const speechText = 'Você pode dizer: tocar leituras sagradas.';
    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .getResponse();
  }
};

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    const req = handlerInput.requestEnvelope.request;
    return req.type === 'IntentRequest'
        && (req.intent.name === 'AMAZON.CancelIntent' || req.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak('Até logo!')
      .getResponse();
  }
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder.getResponse();
  }
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.error(`Error handled: ${error.message}`);
    return handlerInput.responseBuilder
      .speak('Desculpe, ocorreu um erro.')
      .getResponse();
  }
};

// Exporta o handler principal
exports.handler = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    LaunchRequestHandler,
    LiturgiaDiariaIntentHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
