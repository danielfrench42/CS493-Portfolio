const express = require('express');
const app = express();

const {Datastore} = require('@google-cloud/datastore');
const bodyParser = require('body-parser');
const { entity } = require('@google-cloud/datastore/build/src/entity');

const datastore = new Datastore();

const router = express.Router();

app.use(bodyParser.json());

function fromDatastore(item){
    item.id = item[Datastore.KEY].id;
    return item;
}

/* ----------------------- Begin Model Functions ------------------- */










/* ------------------------ End Model Functions -------------------- */

/* ----------------------- Begin Route Handlers -------------------- */

router.get('/', function(req, res){
    res.status(200).send('Hello All!');
})




/* ------------------------ End Router Handlers -------------------- */

app.use('/', router);

// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});