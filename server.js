const express = require('express');
const app = express();

const {Datastore} = require('@google-cloud/datastore');
const bodyParser = require('body-parser');
const { entity } = require('@google-cloud/datastore/build/src/entity');
const axios = require('axios')

const datastore = new Datastore();

const router = express.Router();
const login = express.Router();

const SLIP = "Slip";
const BOAT = "Boat";

app.use(bodyParser.json());

function fromDatastore(item){
    item.id = item[Datastore.KEY].id;
    return item;
}

/* ----------------------- Begin Model Functions ------------------- */
/* ----------------------- Begin Slip Functions -------------------- */




/* ------------------------- End Slip Functions -------------------- */

/* ----------------------- Begin Boat Functions -------------------- */

function get_boats(){
	const q = datastore.createQuery(BOAT);
	return datastore.runQuery(q).then( (entities) => {
      return entities[0].map(fromDatastore);
		});
}

function get_boat_by_id(bid){
  const q = datastore.createQuery(BOAT);
  var findBoat = false
  return datastore.runQuery(q).then( (entities) => {
      const boats = entities[0].map(fromDatastore); 
      boats.forEach( (x) => {
        if (x.id == bid){
          // console.log(x)
          findBoat = x
        }
          // console.log(x)
      })
      // console.log(findBoat)
      if (findBoat == false){
        return false
      }
      else{
        return findBoat;
      }
    });
}

function post_boat(name, type, length){  
  const new_boat = {"name": name, "type": type, "length": length};
  if ((name == undefined) || (type == undefined) || (length == undefined)){
      return -1;
  }
  else
      var key = datastore.key(BOAT);
      return datastore.save({"key":key, "data":new_boat}).then(() => {return key});
}

/* ------------------------ End Boat Functions --------------------- */
/* ------------------------ End Model Functions -------------------- */

/* ----------------------- Begin Route Handlers -------------------- */

router.get('/', function(req, res){
  const boats = get_boats()
  .then( (boats) => {
      // console.log(boats);
      boats.forEach( function(x) {
          x["self"] = req.protocol + "://" + req.get('host') + req.baseUrl + '/boats/' +x.id;
      })
      res.status(200).json(boats);
  });
});

router.get('/:boat_id', function(req, res){
    const boats = get_boat_by_id(req.params.boat_id)
    .then( (boat) => {
      // console.log(boat)
      if (boat == false){
        res.status(404).send(
          { "Error": "No boat with this boat_id exists" }
        )
      }
      else{
        res.status(200).send(boat)
      }
    })
    .catch( (err) => {
      console.log(err)
    })
})

router.post('/', function(req, res){
  if ((req.body.name == undefined) || (req.body.type == undefined) || (req.body.length == undefined) || (req.body == undefined)){
      res.status(400).send(
        {"Error": "Request is missing at least one of the required attributes"}
      )
  }
  else{
    const boat = post_boat(req.body.name, req.body.type, req.body.length)
    .then( 
      key => {res.status(201).send({
          "id": key.id,
          "name": req.body.name,
          "type": req.body.type,
          "length": req.body.length,
          "self": req.protocol + "://" + req.get('host') + req.baseUrl + '/boats/' + key.id
      }
      )})
  }
})

login.get('/', function(req, res){
  res.send('Login')
})


/* ------------------------ End Router Handlers -------------------- */

app.use('/boats', router);
app.use('/login', login);

// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});