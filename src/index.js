const Alexa = require('ask-sdk-core');
const { getLiturgiaDiaria } = require('./liturgiaScraper');

const LiturgiaDiariaHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'LiturgiaDiariaIntent';
  },
  async handle(handlerInput) {
    const speechText = await getLiturgiaDiaria();
    return handlerInput.responseBuilder
      .speak(speechText)
      .withSimpleCard('Liturgia Diária', 'Aqui está sua liturgia diária.')
      .getResponse();
  },
};

exports.handler = Alexa.SkillBuilders.custom()
  .addRequestHandlers(LiturgiaDiariaHandler)
  .lambda();
