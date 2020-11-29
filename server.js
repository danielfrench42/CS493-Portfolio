const express = require('express');
const app = express();

const {Datastore} = require('@google-cloud/datastore');
const bodyParser = require('body-parser');
const { entity } = require('@google-cloud/datastore/build/src/entity');
const axios = require('axios')

const datastore = new Datastore();

const router = express.Router();
const boats = express.Router();
const slips = express.Router();
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
function get_slips(){
	const q = datastore.createQuery(SLIP);
	return datastore.runQuery(q).then( (entities) => {
      return entities[0].map(fromDatastore);
		});
}

function get_slip_by_id(bid){
  const q = datastore.createQuery(SLIP);
  var findSlip = false
  return datastore.runQuery(q).then( (entities) => {
      const slips = entities[0].map(fromDatastore); 
      slips.forEach( (x) => {
        if (x.id == bid){
          // console.log(x)
          findSlip = x
        }
          // console.log(x)
      })
      // console.log(findBoat)
      if (findSlip == false){
        return false
      }
      else{
        return findSlip;
      }
    });
}

function post_slip(number){
  const new_slip = {"number": number, "current_boat": null};
  if (number == undefined){
      return -1;
  }
  else{
      var key = datastore.key(SLIP);
      return datastore.save({"key":key, "data":new_slip}).then(() => {return key});
  }
}

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

async function patch_boat(bid, name, type, length){
  const key = datastore.key([BOAT, parseInt(bid,10)]);
    
  //check if boat exists
  const entity = await datastore.get(key)
  .then( (boat) => {
      // console.log(boat)
      if (boat[0] == undefined){
          return false;
      }
      return boat;
  } );

  //check if name exists
  // const findBoat = await get_boats()
  //     .then( (boats) => {

  //         function findBoat (arr, bname) {
  //             for(var i = 0; i < arr.length; i++){
  //                 // console.log(i)
  //                 if(arr[i].name == bname)
  //                     return true;
  //             }
  //             return false;
  //         }
  //         const foundBoat = findBoat(boats, name);
  //         if (foundBoat == true){
  //             return -1;
  //         }
  //     });
  
  // if (findBoat == -1){
  //     return -2
  // }

  //if boat doesn't exist
  if (entity == false){
      return -1 
  }
  //initialize new data assuming nothing is given, edit fields as they are given
  const data = {
      "name": entity.name,
      "type": entity.type,
      "length": entity.length,
      "id": bid
  }

  //if name is not given
  if (name != undefined){
      data["name"] = name;
  }
  //if type is not given
  if (type != undefined){
      data["type"] = type;
  }
  //if length is not given
  if (length != undefined){
      data["length"] = length;
  }
  //printing new boat

  const new_entity = {
      key: key,
      data: data
  }
  return datastore.update(new_entity).then(() => { return new_entity.data}).catch(() => {return false})
}


/* ------------------------ End Boat Functions --------------------- */
/* ------------------------ End Model Functions -------------------- */

/* ----------------------- Begin Route Handlers -------------------- */

router.delete('/', function (req, res){
  res.set('Accept', 'GET, POST');
  res.status(405).end();
});

router.put('/', function (req, res){
  res.set('Accept', 'GET, POST');
  res.status(405).end();
});


boats.get('/', function(req, res){
  if (req.get('accept') !== 'application/json'){
    res.status(415).send({"Error": "Server only accepts application/json data."})
  }
  else {
    const boats = get_boats()
    .then( (boats) => {
        // console.log(boats);
        boats.forEach( function(x) {
            x["self"] = req.protocol + "://" + req.get('host') + req.baseUrl + '/boats/' +x.id;
        })
        res.status(200).json(boats);
    });
  }
});

boats.get('/:boat_id', function(req, res){
    if (req.get('accept') !== 'application/json'){
      res.status(415).send({"Error": "Server only accepts application/json data."})
    }
    else {
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
  }
})

boats.post('/', function(req, res){
  if ((req.body.name == undefined) || (req.body.type == undefined) || (req.body.length == undefined) || (req.body == undefined)){
      res.status(400).send(
        {"Error": "Request is missing at least one of the required attributes"}
      )
  }
  else if (req.get('accept') !== 'application/json'){
    res.status(415).send({"Error": "Server only accepts application/json data."})
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

boats.patch('/:id', function(req, res){
  if ((req.body.name == undefined) || (req.body.type == undefined) || (req.body.length == undefined)){
      res.status(400).json(
          { "Error": "The request object is missing at least one of the required attributes"}
      )
  }
  else if (req.get('accept') !== 'application/json'){
    res.status(415).send({"Error": "Server only accepts application/json data."})
  }
  else {
      patch_boat(req.params.id, req.body.name, req.body.type, req.body.length)
      .then( (new_entity) => {
          if (new_entity == -1) {
              res.status(404).json({"Error": "No boat with this boat_id exists"});
          }
          else {
              new_entity["self"] = req.protocol + "://" + req.get('host') + req.baseUrl + '/'+req.params.id
              res.status(200).json(new_entity).end();
          }
      });
  }
});


slips.get('/', function(req, res){
  if (req.get('accept') !== 'application/json'){
    res.status(415).send({"Error": "Server only accepts application/json data."})
  }
  else {
    const boats = get_slips()
    .then( (slips) => {
        // console.log(boats);
        res.status(200).json(slips);
    });
  }
})

slips.get('/:slip_id', function(req, res){
  if (req.get('accept') !== 'application/json'){
    res.status(415).send({"Error": "Server only accepts application/json data."})
  }
  else {
    const slip = get_boat_by_id(req.params.boat_id)
    .then( (slip) => {
      // console.log(boat)
      if (slip == false){
        res.status(404).send(
          { "Error": "No slip with this slip_id exists" }
        )
      }
      else{
        res.status(200).send(slip)
      }
    })
    .catch( (err) => {
      console.log(err)
    })
  }
})

slips.post('/', function(req, res){
  if (req.body.number == undefined){
      res.status(400).json(
          { "Error": "Request is missing at least one of the required attributes"}
      )
  }
  else if (req.get('accept') !== 'application/json'){
    res.status(415).send({"Error": "Server only accepts application/json data."})
  }
  else {
      const slip = post_slip(req.body.number)
      .then( 
          (key) => {
              res.status(201).send({
              "id": key.id,
              "number": req.body.number,
              "current_boat": null,
              "self": req.protocol + "://" + req.get('host') + req.baseUrl + '/' + key.id
          }
      )} )
  }
});

login.get('/', function(req, res){
  res.send('Login')
})


/* ------------------------ End Router Handlers -------------------- */

app.use('/', router);
app.use('/boats', boats);
app.use('/slips', slips);
app.use('/login', login);

// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});