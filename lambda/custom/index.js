// index.js
const Alexa = require('ask-sdk-core');
const { getLiturgiaDiaria } = require('./liturgiaScraper');

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
  },
  handle(handlerInput) {
    const speechText = 'Bem-vindo à Liturgia Diária. Diga: tocar leituras sagradas.';
    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .getResponse();
  }
};

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
        .withSimpleCard('Liturgia Diária', 'Aqui está sua liturgia.')
        .getResponse();
    } catch (e) {
      return handlerInput.responseBuilder
        .speak('Desculpe, não consegui carregar a liturgia agora. Tente mais tarde.')
        .getResponse();
    }
  }
};

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
    const name = handlerInput.requestEnvelope.request.intent.name;
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && (name === 'AMAZON.CancelIntent' || name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak('Até mais!')
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
  canHandle() { return true; },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);
    return handlerInput.responseBuilder
      .speak('Desculpe, ocorreu um erro.')
      .getResponse();
  }
};

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
