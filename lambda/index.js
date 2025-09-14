const Alexa = require("ask-sdk-core");
const https = require("https");

const API_URL = "https://liturgia.up.railway.app/v2/";

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const json = JSON.parse(data);
            resolve(json);
          } catch (err) {
            reject(new Error("Erro ao parsear JSON"));
          }
        });
      })
      .on("error", reject);
  });
}

async function gerarLiturgiaSSML() {
  try {
    const dataFetch = await fetchJson(API_URL);
    const { data, liturgia, leituras } = dataFetch;
    const { primeiraLeitura, salmo, segundaLeitura, evangelho } = leituras;

    let ssml = `<speak>`;
    ssml += `<p>Hoje é <say-as interpret-as="date">${data}</say-as>, ${liturgia}.</p>`;

    if (primeiraLeitura.length) {
      ssml += `<p><emphasis level="moderate">Primeira Leitura: </emphasis></p>`;
      ssml += `<break time="1s"/>`;
      ssml += `<p><emphasis level="moderate">${primeiraLeitura[0].titulo}. </emphasis></p>`;
      ssml += `<p><emphasis level="moderate">${checkChapter(primeiraLeitura[0].referencia)}. </emphasis></p>`;
      ssml += `<break time="1s"/>`;
      ssml += `<p>${primeiraLeitura[0].texto.replace(/\d+/g, "")}</p>`;
      ssml += `<break time="1s"/>`;
    }

    if (salmo.length) {
      ssml += `<p><emphasis level="moderate">Salmo Responsorial: </emphasis></p>`;
      ssml += `<break time="1s"/>`;
      ssml += `<p><emphasis level="moderate">${salmo[0].referencia.replace('Sl','Salmos ')}. </emphasis></p>`;
      ssml += `<p><emphasis level="moderate">${salmo[0].refrao}. </emphasis></p>`;
      ssml += `<break time="1s"/>`;
      ssml += `<p>${salmo[0].texto.replace(/\d+/g, "")}</p>`;
      ssml += `<break time="1s"/>`;
    }

    if (segundaLeitura.length) {
      ssml += `<p><emphasis level="moderate">Segunda Leitura: </emphasis></p>`;
      ssml += `<break time="1s"/>`;
      ssml += `<p><emphasis level="moderate">${segundaLeitura[0].titulo}. </emphasis></p>`;
      ssml += `<p><emphasis level="moderate">${checkChapter(segundaLeitura[0].referencia)}. </emphasis></p>`;
      ssml += `<break time="1s"/>`;
      ssml += `<p>${segundaLeitura[0].texto.replace(/\d+/g, "")}</p>`;
      ssml += `<break time="2s"/>`;
    }

    if (evangelho.length) {
      ssml += `<p><emphasis level="moderate">Evangelho: </emphasis></p>`;
      ssml += `<break time="1s"/>`;      
      ssml += `<p><emphasis level="moderate">${evangelho[0].titulo}. </emphasis></p>`;
      ssml += `<break time="2s"/>`;
      ssml += `<p><emphasis level="moderate">${checkChapter(evangelho[0].referencia)}. </emphasis></p>`;
      ssml += `<break time="1s"/>`;
      ssml += `<p>${evangelho[0].texto.replace(/\d+/g, "")}</p>`;
      ssml += `<p><emphasis level="moderate">Palavra do Senhor.</emphasis></p>`;
    }

    ssml += `</speak>`;
    return ssml;
  } catch (err) {
    console.error("Erro ao gerar SSML:", err.message);
    return `<speak>Desculpe, não foi possível obter a liturgia de hoje.</speak>`;
  }
}

const LiturgiaHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "LaunchRequest" ||
      Alexa.getIntentName(handlerInput.requestEnvelope) === "LiturgiaIntent"
    );
  },
  async handle(handlerInput) {
    const ssml = await gerarLiturgiaSSML();
    return handlerInput.responseBuilder
      .speak(ssml)
      .withSimpleCard("Liturgia Diária", "Confira a liturgia de hoje.")
      .getResponse();
  },
};

const HelpHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getIntentName(handlerInput.requestEnvelope) === "AMAZON.HelpIntent"
    );
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(
        'Você pode pedir pela liturgia de hoje dizendo: "Alexa, abrir liturgia diária".'
      )
      .reprompt("Como posso te ajudar?")
      .getResponse();
  },
};

const CancelAndStopHandler = {
  canHandle(handlerInput) {
    return ["AMAZON.CancelIntent", "AMAZON.StopIntent"].includes(
      Alexa.getIntentName(handlerInput.requestEnvelope)
    );
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder.speak("Até mais!").getResponse();
  },
};

function checkChapter(book) {
    const aliases = {
        "Gn": "Gênesis",
        "Ex": "Êxodo",
        "Lv": "Levítico",
        "Nm": "Números",
        "Dt": "Deuteronômio",
        "Js": "Josué",
        "Jz": "Juízes",
        "Ed": "Esdras",
        "Ne": "Neemias",
        "Et": "Ester",
        "Pv": "Provérbios",
        "Is": "Isaías",
        "Jr": "Jeremias",
        "Ez": "Ezequiel",
        "Dn": "Daniel",
        "Mt": "Mateus",
        "Mc": "Marcos",
        "Lc": "Lucas",
        "Jo": "João",
        "At": "Atos dos Apóstolos",
        "Rm": "Romanos",
        "Gl": "Gálatas",
        "Ef": "Efésios",
        "Fp": "Filipenses",
        "Cl": "Colossenses",
        "Hb": "Hebreus",
        "Tg": "Tiago",
        "Ap": "Apocalipse",
        "1 Co": "1ª Coríntios",
        "2 Co": "2ª Coríntios",
        "1 Sm": "1º Livro de Samuel",
        "2 Sm": "2º Livro de Samuel",
        "1 Rs": "1º Livro de Reis",
        "2 Rs": "2º Livro de Reis",
        "1 Cr": "1º Livro de Crônicas",
        "2 Cr": "2º Livro de Crônicas"
    };

    let newTitle = book;

    for (const [abbr, fullName] of Object.entries(aliases)) {
        const regex = new RegExp(`\\b${abbr}\\b`, 'g');
        newTitle = newTitle.replace(regex, `<sub alias='${fullName}'>${abbr}</sub> Capítulo`);
    }

    newTitle = newTitle.replace(",", ", versículo ");
    return newTitle;
}

exports.handler = Alexa.SkillBuilders.custom()
  .addRequestHandlers(LiturgiaHandler, HelpHandler, CancelAndStopHandler)
  .lambda();
