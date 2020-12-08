const express = require('express');
const app = express();

const {Datastore} = require('@google-cloud/datastore');
const bodyParser = require('body-parser');
const { entity } = require('@google-cloud/datastore/build/src/entity');
const path = require('path');

const request = require('request');

const jwt = require('express-jwt');
const jwksRsa = require('jwks-rsa');

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

const CLIENT_ID = 'Cs1hgFzVaWQNLdMp1lg11g4Yej00u3RW';
const CLIENT_SECRET = 'pRA9DFJV1EJWchGGGf-WTtYYvBh_pZ2SAyyeT9qYQ0s-F1oS94zb_20Y8zIyFtPY';
const DOMAIN = 'dev-iaamra6k.us.auth0.com';

const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${DOMAIN}/.well-known/jwks.json`
  }),
  credentialsRequired: false,
  // Validate the audience and the issuer.
  issuer: `https://${DOMAIN}/`,
  algorithms: ['RS256']
});



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
      // console.log(findSlip)
      if (findSlip == false){
        return false
      }
      else{
        return findSlip;
      }
    });
}

function post_slip(number){
  if (number == undefined){
      return -1;
  }
  else{
    var date = new Date();
    var timeCreated = (date.getMonth()+1) + "/" + date.getDate() + "/"
    + date.getFullYear() + " " + date.getHours() + ":"  
    + date.getMinutes() + ":" + date.getSeconds();
    // console.log(timeCreated)
    const new_slip = {"number": number, "current_boat": null, "date_created": timeCreated};
    var key = datastore.key(SLIP);
    return datastore.save({"key":key, "data":new_slip}).then(() => {return {key, timeCreated}});
  }
}

async function patch_slip(bid, number){
  const key = datastore.key([SLIP, parseInt(bid,10)]);
    
  //check if boat exists
  const entity = await datastore.get(key)
  .then( (slip) => {
      // console.log(boat)
      if (slip[0] == undefined){
          return false;
      }
      return slip;
  } );

  //if slip doesn't exist
  if (entity == false){
      return -1 
  }

  // console.log(entity[0])
  const data = {
      "number": number,
      "current_boat": entity[0].current_boat,
      "date_created": entity[0].date_created,
      "id": bid
  }
  const new_entity = {
      key: key,
      data: data
  }
  return datastore.update(new_entity).then(() => { return new_entity.data}).catch(() => {return false})
}

async function put_slip(sid, bid){
  const findSlip = await get_slip_by_id(sid)
  const findBoat = await get_boat_by_id(bid)

  // console.log(findBoat);
  if (findSlip == false || findBoat == false)
      return -1;
  if (findSlip.current_boat != null)
      return false;
  else {
      const key = datastore.key([SLIP, parseInt(sid,10)]);
      // console.log(findSlip.number);
      const data = {
          "number": findSlip.number,
          "current_boat": bid,
          "date_created": findSlip.date_created,
          "id": sid
      }
      const new_entity = {
          key: key,
          data: data
      }
      return datastore.update(new_entity).then(() => { return new_entity.data}).catch(() => {return false})
  }
}


async function delete_slip(id){
  const key = datastore.key([SLIP, parseInt(id,10)]);

  const entity = await datastore.get(key)
  .then( (slip) => {
      // console.log(boat)
      if (slip[0] == undefined){
          return false;
      }
      return slip;
  } );
  if (entity == false){
    return entity;
  }
  else {
    datastore.delete(key, (err, apiResp) => {
        return true;
    });
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
function get_owner_boats(owner){
	const q = datastore.createQuery(BOAT);
	return datastore.runQuery(q).then( (entities) => {
      return entities[0].map(fromDatastore).filter( item => item.owner == owner);
		});
}

function get_boat_by_id(bid, owner){
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
        if (findBoat.owner != owner){
            return -1;
        }
        else{
          return findBoat;
        }
      }
    });
}

function get_boat_by_id_unprotected(bid){
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

function post_boat(name, type, length, owner){  
  const new_boat = {"name": name, "type": type, "length": length, "owner": owner};
  if ((name == undefined) || (type == undefined) || (length == undefined)){
      return -1;
  }
  else
      var key = datastore.key(BOAT);
      return datastore.save({"key":key, "data":new_boat}).then(() => {return key});
}

async function patch_boat(bid, name, type, length, owner){
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

  //if boat doesn't exist
  if (entity == false){
      return -1 
  }
  // console.log(entity[0])
  // console.log(entity[0].owner)
  if (entity[0].owner != owner){
      return -2;
  }
  //initialize new data assuming nothing is given, edit fields as they are given
  const data = {
      "name": entity[0].name,
      "type": entity[0].type,
      "length": entity[0].length,
      "owner": entity[0].owner,
      "id": bid
  }
  // console.log(data)
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

async function boat_depart(sid,bid){
  const findSlip = await get_slip_by_id(sid)
  const findBoat = await get_boat_by_id_unprotected(bid)
  // console.log(findSlip)
  // console.log(findBoat)
  if (findSlip == false || findBoat == false){
      // console.log(findSlip)
      // console.log(findBoat)
      return -1;
  }
  if (findSlip.current_boat != findBoat.id)
      return false;
  else {
      const key = datastore.key([SLIP, parseInt(sid,10)]);
      // console.log(findSlip.number);
      const data = {
          "number": findSlip.number,
          "current_boat": null,
          "date_created": findSlip.date_created,
          "id": sid
      }
      const new_entity = {
          key: key,
          data: data
      }
      return datastore.update(new_entity).then(() => { return new_entity.data}).catch(() => {return -2})
  }

}



async function delete_boat(id, owner){
  const key = datastore.key([BOAT, parseInt(id,10)]);

  const entity = await datastore.get(key)
  .then( (boat) => {
      // console.log(boat)
      if (boat[0] == undefined){
          return false;
      }
      if (boat[0].owner != owner){
        // console.log(boat)
        // console.log(owner)
        return -1
      }
      return boat;
  } );
  // console.log(entity)
  if (entity == false){
    return entity;
  }
  else if (entity == -1){
    return entity
  }
  else {
    datastore.delete(key, (err, apiResp) => {
        return true;
    });
  }
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


boats.get('/', checkJwt, function(req, res){
  if (req.get('accept') !== 'application/json'){
    res.status(415).send({"Error": "Server only accepts application/json data."})
  }
  else {
    const boats = get_owner_boats(req.user.sub)
    // const boats = get_boats()
    .then( (boats) => {
        // console.log(boats);
        boats.forEach( function(x) {
            x["self"] = req.protocol + "://" + req.get('host') + req.baseUrl + '/' +x.id;
        })
        res.status(200).json(boats);
    });
  }
});

boats.get('/:boat_id', checkJwt, function(req, res){
  if(req.user == undefined){
    res.status(401).send({"Error": "Token has not been given"})
  }
  else{
      if (req.get('accept') !== 'application/json'){
        res.status(415).send({"Error": "Server only accepts application/json data."})
      }
      else {
      const boats = get_boat_by_id(req.params.boat_id, req.user.sub)
      .then( (boat) => {
        // console.log(boat)
        if (boat == false){
          res.status(404).send(
            { "Error": "No boat with this boat_id exists" }
          )
        }
        else if (boat == -1) {
          res.status(403).send(
            { "Error": "Forbidden" }
          )
        }
        else{
          boat["self"] = req.protocol + "://" + req.get('host') + req.baseUrl + '/' +boat.id;
          res.status(200).send(boat)
        }
      })
      .catch( (err) => {
        console.log(err)
      })
    }
}
})

boats.post('/', checkJwt, function(req, res){
  if(req.user == undefined){
    res.status(401).send({"Error": "Token has not been given"})
  }
  else{
    if ((req.body.name == undefined) || (req.body.type == undefined) || (req.body.length == undefined) || (req.body == undefined)){
    // if (req.body == undefined){
        res.status(400).send(
          {"Error": "Request is missing at least one of the required attributes"}
        )
    }
    else if (req.get('accept') !== 'application/json'){
      res.status(415).send({"Error": "Server only accepts application/json data."})
    }
    else{
      const boat = post_boat(req.body.name, req.body.type, req.body.length, req.user.sub)
      .then( 
        (key) => {res.status(201).send({
            "id": key.id,
            "name": req.body.name,
            "type": req.body.type,
            "length": req.body.length,
            "owner": req.user.sub,
            "self": req.protocol + "://" + req.get('host') + req.baseUrl + '/' + key.id
        }
        )})
    }
  }
})

boats.patch('/:id', checkJwt, function(req, res){
  if(req.user == undefined){
    res.status(401).send({"Error": "Token has not been given"})
  }
  else{
    if ((req.body.name == undefined) || (req.body.type == undefined) || (req.body.length == undefined)){
        res.status(400).json(
            { "Error": "Request is missing at least one of the required attributes"}
        )
    }
    else if (req.get('accept') !== 'application/json'){
      res.status(415).send({"Error": "Server only accepts application/json data."})
    }
    else {
        patch_boat(req.params.id, req.body.name, req.body.type, req.body.length, req.user.sub)
        .then( (new_entity) => {
            if (new_entity == -1) {
                res.status(404).json({"Error": "No boat with this boat_id exists"});
            }
            else if (new_entity == -2) {
                res.status(403).send({"Error": "Forbidden"})
            }
            else {
                new_entity["self"] = req.protocol + "://" + req.get('host') + req.baseUrl + '/'+req.params.id
                res.status(200).json(new_entity).end();
            }
        });
    }
  }
});

boats.delete('/:boat_id', checkJwt, async function(req, res){

    if(req.user == undefined){
      res.status(401).send({"Error": "Token has not been given"})
    }
    else{
      const boats_delete = await delete_boat(req.params.boat_id, req.user.sub)
      .then( (boat) => {
        if (boat == false){
          res.status(400).send(
            { "Error": "No boat with this boat_id exists" }
          )}
        else if (boat == -1){
          res.status(403).send(
            { "Error": "Forbidden"}
          )
        }
        else {
          res.status(204).end();
        }
      })
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
    const slip = get_slip_by_id(req.params.slip_id)
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
              "id": key.key.id,
              "number": req.body.number,
              "date_created": key.timeCreated,
              "current_boat": null,
              "self": req.protocol + "://" + req.get('host') + req.baseUrl + '/' + key.key.id
          }
      )} )
  }
});

slips.patch('/:id', function(req, res){
  if ((req.body.number == undefined)){
      res.status(400).json(
          { "Error": "The request object is missing at least one of the required attributes"}
      )
  }
  else if (req.get('accept') !== 'application/json'){
    res.status(415).send({"Error": "Server only accepts application/json data."})
  }
  else {
      patch_slip(req.params.id, req.body.number)
      .then( (new_entity) => {
          if (new_entity == -1) {
              res.status(404).json({"Error": "No slip with this slip_id exists"});
          }
          else {
              new_entity["self"] = req.protocol + "://" + req.get('host') + req.baseUrl + '/' +req.params.id
              res.status(200).json(new_entity).end();
          }
      });
  }
});

//boat arrives at slip
slips.put('/:slip_id/:boat_id', async function(req, res){
  const slip = put_slip(req.params.slip_id, req.params.boat_id)
  if (await slip == -1)
      res.status(404).json({"Error": "The specified boat and/or slip does not exist"});
  if (await slip == false)
      res.status(403).json({"Error": "The slip is not empty"});
  else
      (res.status(204).end());
});

//boat departs slip
slips.delete('/:slip_id/:boat_id', async function(req, res){
  const depart = boat_depart(req.params.slip_id, req.params.boat_id);
  // console.log(await depart);
  if (await depart == false || await depart == -1){
      console.log(depart)
      res.status(404).json({"Error": "No boat with this boat_id is at the slip with this slip_id"});
  }
  else
      res.status(204).end();
});


slips.delete('/:slip_id', async function(req, res){

  const slips_delete = await delete_slip(req.params.slip_id)
  .then( (slip) => {
    if (slip == false){
      res.status(400).send(
        { "Error": "No slip with this slip_id exists" }
      )}
    else {
      res.status(204).end();
    }
  })

});


login.get('/', function(req, res){
  res.sendFile(path.join(__dirname + '/authorize.html'))
})

login.get('/test', function(req,res){
  // res.send('Nice')
  // console.log(req.query.code)
  var options = { method: 'POST',
  url: `https://${DOMAIN}/oauth/token`,
  headers: { 'content-type': 'application/json' },
  body:
   { grant_type: 'authorization_code',
     client_id: CLIENT_ID,
     client_secret: CLIENT_SECRET,
     code: req.query.code,
     redirect_uri: 'https://portfolio-frenchda.wl.r.appspot.com/login/test'
   },
  json: true };
  request(options, (error, response, body) => {
    if (error){
        res.status(500).send(error);
    } else {
        // console.log(response.body)
        res.redirect(
                '/login/userInfo'+'?id_token='+response.body.id_token
            );
    }
  });
})

login.get('/userInfo', function(req, res){
  // console.log(req.user)
  var options = { method: 'POST',
  url: `https://portfolio-frenchda.wl.r.appspot.com/login/userInfo`,
  headers: { 
    'content-type': 'application/json', 
    'Authorization': 'Bearer '+req.query.id_token
  },
   json: true
  };
  request(options, (error, response, body) => {
    if (error){
        res.status(500).send(error);
    } else {
        // console.log(response.body)
        var userID = response.body
        res.send(
          '<h2>User\'s JWT</h2>'+
          '<div><p>'+ req.query.id_token + '</p>'+
          '<h2>User ID</h2>'+
          '<p>'+ userID +'</p></div>')
    }
  });
})

login.post('/userInfo', checkJwt, function(req, res){
    console.log(req.query)
    res.send(req.user.sub)

});

login.get('/logout', function(req, res){

  const url = 'https://dev-iaamra6k.us.auth0.com/v2/logout?'+
              'client_id='+ CLIENT_ID +'&'+
              'returnTo=https://portfolio-frenchda.wl.r.appspot.com/login&';

  res.redirect(url)

});

router.get('/authorize', function(req, res){
  // console.log(JSON.stringify(req.user));
  const url = 'https://dev-iaamra6k.us.auth0.com/authorize?'+
              'response_type=code&'+
              'client_id='+CLIENT_ID+'&'+
              'scope=openid email'+
              'audience=https://dev-iaamra6k.us.auth0.com/api/v2/&'+
              'connection=Username-Password-Authentication&'+
              'redirect_uri=https://portfolio-frenchda.wl.r.appspot.com/login/test&'+
              'state=vjUipnglO';
  res.redirect(url)
});

router.get('/users', checkJwt, function(req, res){
  // console.log(req.get('Authorization'))
  var options = { method: 'POST',
  url: `https://${DOMAIN}/api/v2/users`,
  params: {search_engine: 'v3'},
  headers: { 
    'content-type': 'application/json', 
    'Authorization': req.get('Authorization')
  },
   json: true
  };
  request(options, (error, response, body) => {
    if (error){
        res.status(500).send(error);
    } else {
        // console.log(response.body)
        res.send(response)
      }
  });

})

/* ------------------------ End Router Handlers -------------------- */

app.use('/', router);
app.use('/boats', boats);
app.use('/slips', slips);
app.use('/login', login);

app.use(function (err, req, res, next){
  if(err.name == 'UnauthorizedError') {
      res.status(401).send({'Error': 'Invalid Token'});
  }
  else {
      console.error(err.stack)
      res.status(500).send('Error was either not caught or there was an internal error')
      }
})

// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});