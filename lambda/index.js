const Alexa = require('ask-sdk-core');
const https = require('https');

const API_URL = 'https://liturgia.up.railway.app/v2/';

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (err) {
          reject(new Error('Erro ao parsear JSON'));
        }
      });
    }).on('error', reject);
  });
}

async function gerarLiturgiaSSML() {
  try {
    const dataFetch = await fetchJson(API_URL);
    const { data, liturgia, leituras } = dataFetch;
    const { primeiraLeitura, salmo, segundaLeitura, evangelho } = leituras;

    let ssml = `<speak>`;
    ssml += `<p>Hoje é <say-as interpret-as="date">${data}</say-as>, <emphasis level="moderate">${liturgia}</emphasis>.</p>`;

    if (primeiraLeitura.length) {
      ssml += `<p><emphasis level="moderate">Primeira Leitura ${primeiraLeitura[0].referencia}</emphasis></p>`;
      ssml += `<p><emphasis level="moderate">${primeiraLeitura[0].titulo}</emphasis></p>`;
      ssml += `<p>${primeiraLeitura[0].texto.replace(/\d+/g, '')}</p>`;
    }

    if (salmo.length) {
      ssml += `<p><emphasis level="moderate">Salmo Responsorial ${salmo[0].referencia}</emphasis></p>`;
      ssml += `<p><emphasis level="moderate">${salmo[0].refrao}</emphasis></p>`;
      ssml += `<p>${salmo[0].texto.replace(/\d+/g, '')}</p>`;
    }

    if (segundaLeitura.length) {
      ssml += `<p><emphasis level="moderate">Segunda Leitura ${segundaLeitura[0].referencia}</emphasis></p>`;
      ssml += `<p><emphasis level="moderate">${segundaLeitura[0].titulo}</emphasis></p>`;
      ssml += `<p>${segundaLeitura[0].texto.replace(/\d+/g, '')}</p>`;
    }

    if (evangelho.length) {
      ssml += `<p><emphasis level="moderate">Evangelho: ${evangelho[0].referencia}</emphasis></p>`;
      ssml += `<p><emphasis level="moderate">${evangelho[0].titulo}</emphasis></p>`;
      ssml += `<p>${evangelho[0].texto.replace(/\d+/g, '')}</p>`;
    }

    ssml += `</speak>`;
    return ssml;
  } catch (err) {
    console.error('Erro ao gerar SSML:', err.message);
    return `<speak>Desculpe, não foi possível obter a liturgia de hoje.</speak>`;
  }
}

const LiturgiaHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest' ||
           Alexa.getIntentName(handlerInput.requestEnvelope) === 'LiturgiaIntent';
  },
  async handle(handlerInput) {
    const ssml = await gerarLiturgiaSSML();
    return handlerInput.responseBuilder
      .speak(ssml)
      .withSimpleCard('Liturgia Diária', 'Confira a liturgia de hoje.')
      .getResponse();
  }
};

const HelpHandler = {
  canHandle(handlerInput) {
    return Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak('Você pode pedir pela liturgia de hoje dizendo: "Alexa, abrir liturgia diária".')
      .reprompt('Como posso te ajudar?')
      .getResponse();
  }
};

const CancelAndStopHandler = {
  canHandle(handlerInput) {
    return ['AMAZON.CancelIntent', 'AMAZON.StopIntent'].includes(Alexa.getIntentName(handlerInput.requestEnvelope));
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak('Até mais!')
      .getResponse();
  }
};

exports.handler = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    LiturgiaHandler,
    HelpHandler,
    CancelAndStopHandler
  )
  .lambda();
  
  