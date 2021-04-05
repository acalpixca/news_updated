var fetch = require("node-fetch");
module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    let subscriptionKey = '68d214be8eb24afb9d240f37e4a4ae74'
    let endpoint = 'https://api.bing.microsoft.com/v7.0/search';
    
    const searchString = (req.query.searchString || (req.body && req.body.searchString));

    context.log("Search string es " + searchString);
    let query = searchString; //'Microsoft';
    
    // Market you'd like to search in.
    // let mkt = 'en-US'

    /* let request_params = {
        method: 'GET',
        uri: endpoint,
        headers: {
            'Ocp-Apim-Subscription-Key': subscriptionKey
        },
        qs: {
            q: query // ,
            // mkt: mkt
        },
        json: true
    } */

    var url = new URL(endpoint);

    let params = {
        //qs: {
            q: searchString // ,
            // mkt: mkt // en-US, es-MX y similar
       // }
    };

    Object.keys(params).forEach(key => url.searchParams.append(key, JSON.stringify(params[key])))

    context.log("La URL de la llamada es " + JSON.stringify(url));
    let response = await fetch(url, {
        method: 'GET',
        // body: { }, // , // data can be `string` or {object}!
        headers:{
            'Ocp-Apim-Subscription-Key' : subscriptionKey,
            'Content-Type': 'application/json'
        }
    });
  if (!response.ok) {
    throw new Error(`Error calling: Bing News: ${response.status}`);
  }
  else {
    let respuesta = await response.text();
    //alert("response.ok fue ok y devolveré " + JSON.stringify(respuesta));
    //return(respuesta);
    try {
        // context.res.status(200).json(body.webPages.value);
        context.res.status(200).json(respuesta);// body.webPages.value);
      } catch (error) {
                context.res.status(500).send(error);
      }
  }
} // end of export and it should be end of file