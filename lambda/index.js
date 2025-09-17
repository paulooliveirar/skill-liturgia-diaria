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
    ssml += `<lang xml:lang="pt-BR">`;
    ssml += `<voice name="Vitoria">`;
    ssml += `<p>Hoje é <say-as interpret-as="date">${data}</say-as>, ${liturgia}.</p>`;

    if (primeiraLeitura.length) {
      ssml += `<p>Primeira Leitura: </p>`;
      ssml += `<break time="1s"/>`;
      ssml += `<p>${primeiraLeitura[0].titulo}.</p>`;
      ssml += `<break time="1s"/>`;
      ssml += `<p><prosody rate='slow'>${checkChapter(
        primeiraLeitura[0].referencia
      )}. </prosody></p>`;
      ssml += `<break time="1s"/>`;
      ssml += `<p>${primeiraLeitura[0].texto.replace(/\d+/g, "")}</p>`;
      ssml += `<p>Palavra do Senhor.</p>`;
      ssml += `<break time="3s"/>`;
    }

    ssml += `</voice>`;

    if (salmo.length) {
      ssml += `<voice name="Camila">`;
      ssml += createPsalm(salmo);
      ssml += `</voice>`;
      ssml += `<break time="3s"/>`;      
    }

    if (segundaLeitura.length) {
      ssml += `<voice name="Vitoria">`;
      ssml += `<p>Segunda Leitura: </p>`;
      ssml += `<break time="1s"/>`;
      ssml += `<p>${segundaLeitura[0].titulo}.</p>`;
      ssml += `<break time="1s"/>`;
      ssml += `<p><prosody rate='slow'>${checkChapter(
        segundaLeitura[0].referencia
      )}. </prosody></p>`;
      ssml += `<break time="1s"/>`;
      ssml += `<p>${segundaLeitura[0].texto.replace(/\d+/g, "")}</p>`;
      ssml += `<break time="1s"/>`;      
      ssml += `<p>Palavra do Senhor</p>`;
      ssml += `<break time="3s"/>`;
      ssml += `</voice>`;
    }

    if (evangelho.length) {
      ssml += `<voice name="Ricardo">`;
      ssml += `<p><prosody rate='slow'>Evangelho: </prosody></p>`;
      ssml += `<break time="1s"/>`;
      ssml += `<p><prosody rate='slow'>${evangelho[0].titulo}. </prosody></p>`;
      ssml += `<break time="2s"/>`;
      ssml += `<p><prosody rate='slow'>${checkChapter(
        evangelho[0].referencia
      )}. </prosody></p>`;
      ssml += `<break time="1s"/>`;
      ssml += `<p>${evangelho[0].texto.replace(/\d+/g, "")}</p>`;
      ssml += `<break time="1s"/>`;
      ssml += `<p><prosody rate='slow'>Palavra da Salvação.</prosody></p>`;
      ssml += `</voice>`;
    }

    ssml += `</lang>`;
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

function createPsalm(psalm) {
  let ssml = '';
  ssml += `<p>Salmo Responsorial: </p>`;
  ssml += `<break time="1s"/>`;
  ssml += `<p><prosody rate='slow'>${psalm[0].referencia.replace("Sl", "Salmo ")}. </prosody></p>`;
  ssml += `<break time="1s"/>`;
  
  let stanzas = psalm[0].texto.replace(/\d+/g, "").split("– ");
  
  stanzas.shift();
  
  ssml += `<p><prosody rate='slow'>${psalm[0].refrao}</prosody></p>`;
  
  stanzas.forEach(stanza => {
    ssml += `<break time="1s"/>`;
    ssml += `<p>${stanza}</p>`;
    ssml += `<break time="1s"/>`;
    ssml += `<p><prosody rate='slow'>${psalm[0].refrao}</prosody></p>`;
  });
  
  ssml += `<p><prosody rate='x-slow'>${psalm[0].refrao}</prosody></p>`;

  return ssml;
}

function checkChapter(book) {
  const aliases = {
    Gn: "Gênesis",
    Ex: "Êxodo",
    Lv: "Levítico",
    Nm: "Números",
    Dt: "aosuteronômio",
    Js: "Josué",
    Jz: "Juízes",
    Rt: "Rute",
    "1Sm": "1º Livro de Samuel",
    "2Sm": "2º Livro de Samuel",
    "1Rs": "1º Livro de Reis",
    "2Rs": "2º Livro de Reis",
    "1Cr": "1º Livro de Crônicas",
    "2Cr": "2º Livro de Crônicas",
    Ed: "Esdras",
    Ne: "Neemias",
    Et: "Ester",
    Jó: "Jó",
    Pv: "Provérbios",
    Ec: "Eclesiastes",
    Ct: "Cântico dos Cânticos",
    Is: "Isaías",
    Jr: "Jeremias",
    Lm: "Lamentações aos Jeremias",
    Ez: "Ezequiel",
    Dn: "Daniel",
    Os: "Oséias",
    Jl: "Joel",
    Am: "Amós",
    Ob: "Obadias",
    Jn: "Jonas",
    Mq: "Miquéias",
    Na: "Naum",
    Hc: "Habacuque",
    Sf: "Sofonias",
    Ag: "Ageu",
    Zc: "Zacarias",
    Ml: "Malaquias",
    Mt: "Mateus",
    Mc: "Marcos",
    Lc: "Lucas",
    Jo: "João",
    At: "Atos dos Apóstolos",
    Rm: "Romanos",
    "1Co": "1ª Carta aos Coríntios",
    "2Co": "2ª Carta aos Coríntios",
    Gl: "Gálatas",
    Ef: "Efésios",
    Fp: "Filipenses",
    Cl: "Colossenses",
    "1Ts": "1ª Carta aos Tessalonicenses",
    "2Ts": "2ª Carta aos Tessalonicenses",
    "1Tm": "1ª Carta a Timóteo",
    "2Tm": "2ª Carta a Timóteo",
    Tt: "Tito",
    Fm: "Filemon",
    Hb: "Hebreus",
    Tg: "Tiago",
    "1Pe": "1ª Carta de Pedro",
    Ap: "Apocalipse",
  };

  let newTitle = book;

  for (const [abbr, fullName] of Object.entries(aliases)) {
    const regex = new RegExp(`\\b${abbr}\\b`, "g");
    newTitle = newTitle.replace(
      regex,
      `<sub alias='${fullName}'>${abbr}</sub> Capítulo`
    );
  }

  newTitle = newTitle.replace(",", ", versículo ");
  return newTitle;
}

exports.handler = Alexa.SkillBuilders.custom()
  .addRequestHandlers(LiturgiaHandler, HelpHandler, CancelAndStopHandler)
  .lambda();
