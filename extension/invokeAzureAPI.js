let documents = { 'documents': [
    {
        'id': '1',
        'language': 'es',
        'text': 'Los cambios propuestos están encaminados a la mayor eficiencia de su producción y uso, así como garantizar el suministro de hidrocarburos y petrolíferos a toda la población, a fin de salvaguardar los intereses y la seguridad nacionales, devolviéndole a las empresas productivas del Estado un papel más activo en las actividades que la Reforma Energética le abrió las puertas a la iniciativa privada. Los cambios propuestos están encaminados a la mayor eficiencia de su producción y uso, así como garantizar el suministro de hidrocarburos y petrolíferos a toda la población, a fin de salvaguardar los intereses y la seguridad nacionales, devolviéndole a las empresas productivas del Estado un papel más activo en las actividades que la Reforma Energética le abrió las puertas a la iniciativa privada.'
        //'text': myQueueItem
    },
]};

let paths = {
  'language': '/text/analytics/v2.1/languages',
  'sentiment': '/text/analytics/v2.1/sentiment',
  'keyPhrases': '/text/analytics/v2.1/keyPhrases',
  'entities': '/text/analytics/v2.1/entities'
}

let textSizeLimit = {
  'language': 5120,
  'sentiment': 5120,
  'keyPhrases': 5120,
  'entities': 5120
}
// ENDPOINT TO YOUR COGNITIVE SERVICES - TEXT ANALYTICS RESOURCE:
let uri ='https://<YOUR RESOURCE NAME>.cognitiveservices.azure.com';

var url = uri + paths['sentiment']; // to have a good url by default
var data = documents;
let accessKey = 'KEY TO YOUR COGNITIVE SERVICES - TEXT ANALYTICS RESOURCE';

async function getBarebonesNews(someHtml) {
  if (someHtml) {
    url = "https://<YOUR FUNCTION APP>.azurewebsites.net/api/getBarebonesNews";
    let response = await fetch(url, {
      method: 'POST', // or 'PUT'
      body: JSON.stringify({fullHtml: someHtml}), // data can be `string` or {object}!
      headers:{
          'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Error calling: getBarebonesNews: ${response.status}`);
    }
    else {
      let respuesta = await response.text();
      return(respuesta);
    }
  } // end if someHtml has content
  else {
    // return("I received an empty chunk of html.");
    throw new Error(`getBarebonesNews invoked with empty parameter.`);
  }
}


async function getBingNewsAPI(searchString) {
  if (searchString) {
    url = "https://<YOUR FUNCTION APP>.azurewebsites.net/api/getBingNewsSearch";
    let response = await fetch(url, {
      method: 'POST', // or 'PUT'
      body: JSON.stringify({searchString: searchString}), // data can be `string` or {object}!
      headers:{
          'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Error calling: getBingNewsAPI: ${response.status}`);
    }
    else {
      let respuesta = await response.text();
      return(respuesta);
    }
  } // end if someHtml has content
  else {
    // return("I received an empty chunk of html.");
    throw new Error(`getBingNewsAPI invoked with empty parameter.`);
  }
}


async function getCognitiveTextAnalysis(requestType, texto, lang = 'en') {
  // make sure our document doesn't exceed the size limit per API
  if (texto.length > textSizeLimit[requestType]) {
    texto = texto.slice(0, textSizeLimit[requestType]-1);
  }
  // populate object document for API call
  documents.documents[0].text = texto;
  if (requestType !== 'language') {
    documents.documents[0].language = lang;
  }
  // create valid endpoint for API call
  url = uri + paths[requestType];
  //alert("NUEVO SENTIMENT ANALYSIS con url " + url + " y data " + JSON.stringify(data) + " y access key " + accessKey);

  let response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(data), // data can be `string` or {object}!
    headers:{
        'Ocp-Apim-Subscription-Key' : accessKey,
        'Content-Type': 'application/json'
    }
  });
  if (!response.ok) {
    throw new Error(`Error calling: Azure Text Analytics: ${response.status}`);
  }
  else {
    let respuesta = await response.text();
    //alert("response.ok fue ok y devolveré " + JSON.stringify(respuesta));
    return(respuesta);
  }
} // end function declaration


function processAPIResult(requestType, obct) {
  let obj = JSON.parse(obct);
  switch (requestType) {
    case 'sentiment':
      //"{\"documents\":[{\"id\":\"1\",\"score\":0.514970064163208}],\"errors\":[]}"
      if (obj.errors.length<=0) {
        let score = 0;
        obj.documents.forEach((item, index) => {
          score +=item.score;
        });
        score = score / obj.documents.length;
        return score;
      }
      else throw new Error("TextApi/" + requestType + " has returned these errors: " + JSON.stringify(obj.errors));
      break;
    case 'language':
    //  "{\"documents\":[{\"id\":\"1\",\"detectedLanguages\":[{\"name\":\"Spanish\",\"iso6391Name\":\"es\",\"score\":0.994587242603302}]}],\"errors\":[]}"
      //alert("Parámetros " + requestType + " y " + obj + " que serializado sería " + JSON.stringify(obj));
      //alert(obj);
      if ((obj.errors.length<=0)) {//  && (obj.documents.length>0)) {
        return(obj.documents[0].detectedLanguages[0].iso6391Name);
      }
      else throw new Error("TextApi/" + requestType + " has returned these errors: " + JSON.stringify(obj.errors));
      break;
    case 'keyPhrases':
      // "{\"documents\":[
	    //{\"id\":\"1\",\"keyPhrases\":[\"REDACCIÓN\",
      // \"comentarios\",
      //\"IÑAKI GIL\",\"Inmunidad de rebaño\",\"Entrevista\"]}],
      //\"errors\":[]}"
      if ((obj.errors.length<=0)) {

        // we keep only the first 5 keyPhrases
        let numItems = obj.documents[0].keyPhrases.length;
        let keyPhrases =[];
        if (numItems <5) keyPhrases = obj.documents[0].keyPhrases.slice(0, numItems);
        else keyPhrases = obj.documents[0].keyPhrases.slice(0, 5);
        // we sort the list alphabetically for further processing.
        keyPhrases.sort(function(a, b){
          if(a < b) { return -1; }
          if(a > b) { return 1; }
          return 0;
        });
        // alert(JSON.stringify(keyPhrases));
        return(keyPhrases);
      }
      else throw new Error("TextApi/" + requestType + " has returned these errors: " + JSON.stringify(obj.errors));
      break;
    case 'entities':
      // "{\"documents\":[
    	//{\"id\":\"1\",
    	//\"entities\":[
    	//	{\"name\":\"contenido\\nSoftware libre\",
    	//	\"matches\":[{
    	//		\"entityTypeScore\":0.76,
    	//		\"text\":\"contenido\\nSoftware libre\",
    	//		\"offset\":10,
    	//		\"length\":24}],
    	//	\"type\":\"Organization\"},
      // we want to create and return a list with the name and the type
      if ((obj.errors.length<=0)) {
        let entities = [];
        obj.documents[0].entities.forEach(item => {
          if (item.type !=="DateTime") {
            entities.push({name: item.name, type: item.type});
          }
        });
        // we only keep the first 5 entities
        let numItems = entities.length;
        let bestEntitites = [];
        if (numItems < 5 ) bestEntities = entities.slice(0, numItems);
        else bestEntities = entities.slice(0, 5);

        // we sort the list alphabetically for further processing.
        bestEntities.sort(function(a, b){
          if(a.name < b.name) { return -1; }
          if(a.name > b.name) { return 1; }
          return 0;
        });
        // alert(JSON.stringify(entities));
        return(bestEntities);
      }
      else throw new Error("TextApi/" + requestType + " has returned these errors: " + JSON.stringify(obj.errors));
      break;
    default:
      alert("This is default because " + requestType + " isn't a valid requestType");
      throw new Error("Error in function processAPIResult: " + requestType + " isn't a valid requestType.");
  }
}
