const Alexa = require('ask-sdk-core');
const { getLiturgiaDiaria } = require('./liturgiaScraper');

const LiturgiaDiariaHandler = {
  canHandle(handlerInput) {
    const req = handlerInput.requestEnvelope.request;
    return req.type === 'IntentRequest'
      && req.intent.name === 'LiturgiaDiariaIntent';
  },
  async handle(handlerInput) {
    try {
      const speechText = await getLiturgiaDiaria();
      return handlerInput.responseBuilder
        .speak(speechText)
        .withSimpleCard('Liturgia Diária', 'Aqui está sua liturgia diária.')
        .getResponse();
    } catch (err) {
      return handlerInput.responseBuilder
        .speak('Desculpe, não consegui carregar a liturgia agora. Tente novamente mais tarde.')
        .getResponse();
    }
  }
};

const SkillBuilder = Alexa.SkillBuilders.custom();
exports.handler = SkillBuilder
  .addRequestHandlers(LiturgiaDiariaHandler)
  .lambda();
