extractor = require('unfluff');
module.exports = async function (context, req){

        try {		
          context.res.status(200).json(extractor(req.body.fullHtml));
          } catch (error) {
            context.res.status(500).send(error);
        }
    }
