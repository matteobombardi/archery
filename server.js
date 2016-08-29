var express = require('express');
var bodyParser = require("body-parser");
var app = express();
var fs = require("fs");
var mongoose = require('mongoose');

var formidable = require('formidable');
var http = require('https');
var util = require('util');
var qr = require('qr-image');
dateFormat = require('dateformat');

var sha1 = require('sha1');

const SERVER_PORT = process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 8081;
const SERVER_HOST = process.env.OPENSHIFT_NODEJS_IP ||  process.env.HOST  || '127.0.0.1'

const API_HOST = SERVER_HOST;
const API_PORT = SERVER_PORT;
const API_START = 'startTournament';
const API_TOURNAMENT = 'getTournament';

// Connection URL. This is where your mongodb server is running.
const url = Array( 
			'mongodb://192.168.1.101:27017/archery',
			'mongodb://192.168.1.102:27017/archery',
			'mongodb://192.168.1.103:27017/archery'
		);

mongoose.connect(url);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

var Arrow = mongoose.model('Arrow', {
	x: Number, 
	y: Number,
	score: Number
});

var Volley = mongoose.model('Volley', {
	arrows: Array, //[Arrow],
	sent: Date
});

var Session = mongoose.model('Session', {
	user: {type: String, index: true} , 
	date: Date,
	description: String, 
	score: String,
	max: Number,
	volleies: Array, //[Volley],
	tournament: {type: String, index: true}
});

var Tournament = mongoose.model('Tournament', {
	date: Date,
	description: String
});

var Users = mongoose.model('Users', {
	email: {type: String, unique: true},
	password: {type: String, index: true},
	firstName: String,
	lastName: String,
	registerDate: Date
});

var Tokens =  mongoose.model('Tokens', {
	email: String,
	date: Date
});

////////////////// web ////////////////
// set the view engine to ejs
app.set('view engine', 'ejs');

// index page 
app.get('/', function(req, res) {

	Tournament.find().sort('-date').limit(5).exec(function (err, tObj) {
	  
	  tournaments = tObj;
	  
	  res.render('pages/index');
	});

	
});

// start page 
app.post('/start', function(req, res) {

	var form = new formidable.IncomingForm();

	form.parse(req, function (err, fields, files) {
		
		var t = new Tournament({
			date: new Date(),
			description: fields.description
		});
		
		t.save(function (err, tObj) {
		
		  if (err) {
			res.render('pages/tournament');
		  } else {

			res.redirect('/tournament/'+tObj._id);

		  }
		});
		
	});

});


// get tournament API
app.get('/getTournamentData/:id', function(req, res) {

	res.setHeader( "Pragma", "no-cache" );
	res.setHeader( "Cache-Control", "no-cache" );
	res.setHeader( "Expires", 0 );

	Session.find({tournament: req.params.id}, function (err, tObj) {
		  if (err) {
			console.log("error:");
			console.log(err);

			res.send(JSON.stringify(err,null,3));
		  } else {
			res.send(JSON.stringify(tObj,null,3));
		  }
		});
});

// tournament page 
app.get('/tournament/:id', function(req, res) {
	qrtext = req.params.id;
	
	Tournament.findOne({_id: qrtext}, function (err, tObj) {
	  if (err) {
		console.log("error:");
		console.log(err);
	  } else {
		console.log("ok:");

		description = tObj.description;
		date  = tObj.date;
		
		Session.find({tournament: qrtext}, function (err, tObj) {
		  if (err) {
			console.log("error:");
			console.log(err);
		  } else {
			console.log("ok:");
		
			playerNr = tObj.length;
			
			res.render('pages/tournament');
		
		  }
		});
	
	  }
	});

});




// get session API
app.get('/getSessionData/:id', function(req, res) {
	Session.find({_id: req.params.id}, function (err, tObj) {
		  if (err) {
			console.log("error:");
			console.log(err);
			
			res.send(JSON.stringify(err,null,3));
		  } else {
			res.send(JSON.stringify(tObj,null,3));
		  }
	});
});

// session page 
app.get('/session/:id', function(req, res) {
	sessionId = req.params.id;
	
	Session.find({_id: sessionId}, function (err, tObj) {
	  if (err) {
		console.log("error:");
		console.log(err);
	  } else {
		console.log("ok:");
	
		playerNr = tObj.length;
		date = tObj.date;
		description = tObj.description;
		
		res.render('pages/session');
	
	  }
	});
	
});


			

// qr svg //
app.get('/qr/:id', function(req, res) {
	res.setHeader('Content-Type', 'image/svg+xml');
	qrimg = qr.imageSync(req.params.id, { type: 'svg' });
	res.send(qrimg);
});


/*
// about page 
app.get('/about', function(req, res) {
	res.render('pages/about');
});
*/
///////////////////////////////////////



app.post('/listSessions', function (req, res) {

   console.log('loading listSessions....');
   
  // getUserByToken(req.body.user,function(user){
   
	   Session.find({user: req.body.user}, function (err, tObj) {
		  if (err) {
			console.log("error:");
			console.log(err);
			res.send(JSON.stringify(err, null, 3));
		  } else {
			console.log("ok:");
			console.log('send listSessions');
			res.setHeader('Content-Type', 'application/json');
			res.send(JSON.stringify(tObj, null, 3));
			
			
		  }
		});
   
 //  })

   
})



////////////////////////////////////////// AUTH //////////////////////////////////////////

app.post('/login', function (req, res) {
	console.log('login');
	var usr = req.body.usr;
	var pwd = sha1('' + req.body.pwd);
	
	console.log(usr+':'+pwd);
	
	Users.findOne({email: usr, password: pwd}, function( err, tObj){
		if (err) {
			console.log("error:");
			console.log(err);
			res.setHeader('Content-Type', 'application/json');
			res.send(JSON.stringify({login: -1}, null, 3));
		
		}else if (!tObj){
			console.log('Login error');
			res.setHeader('Content-Type', 'application/json');
			res.send(JSON.stringify({login: 0}, null, 3)); 
			
		} else {
 
			var t = new Tokens({
				email: tObj.email, 
				date: new Date()
			});
				
			t.save(function (err, tObj1) {
				if (err) {
					res.setHeader('Content-Type', 'application/json');
					console.log(err);
					res.send(JSON.stringify({login: -1}, null, 3)); 
				} else {
					console.log('ok');
					res.setHeader('Content-Type', 'application/json');
					res.send(JSON.stringify({login: 1, token: t._id, firstName: tObj.firstName, lastName: tObj.lastName }, null, 3)); 
				}
			});
				
		}
	});
	
})

app.post('/register', function (req, res) {
	console.log('register');
	
	console.log(JSON.stringify(req.body,null,3));
	
	Users.findOne({email: req.body.email}, function( err, tObj){
		if (err) {
			console.log("error:");
			console.log(err);
			res.setHeader('Content-Type', 'application/json');
			res.send(JSON.stringify({response: false, message: err}, null, 3));
		
		}else if (tObj){
			console.log('error');
			res.setHeader('Content-Type', 'application/json');
			res.send(JSON.stringify({response: false, message: 'Esiste già una registrazione per questo indirizzo'}, null, 3));
			
		} else {
		
			var t = new Users({
				email: req.body.email,
				password: sha1(''+req.body.password),
				firstName: req.body.firstName,
				lastName: req.body.lastName
			});
			
			
			t.save(function (err, tObj) {
			  if (err) {
				console.log(err);
				res.setHeader('Content-Type', 'application/json');
				res.send(JSON.stringify({response: false, message: err}), null, 3);
			  } else {
				console.log('ok');
				console.log(tObj);
				res.setHeader('Content-Type', 'application/json');
				res.send(JSON.stringify({response: true, message: '-'}), null, 3);
			  }
			});
		
		}
	})
	
})

function getUserByToken(res, token, callback){

	console.log(token);

	Tokens.findOne({_id: token}, function (err, tObj) {
	
		console.log('here');
	
		if (err){
			console.log(err);
			res.setHeader('Content-Type', 'application/json');
			res.send(JSON.stringify(err, null, 3));
		}else if (!tObj){
			console.log('!obj');
			res.setHeader('Content-Type', 'application/json');
			res.send(JSON.stringify({}, null, 3));
		}else{
		
			console.log('ok');

			Users.findOne({email: tObj.email}, function (err, tObj) {
				if (err){
					console.log(err);
					res.setHeader('Content-Type', 'application/json');
					res.send(JSON.stringify(err, null, 3));
				}else{
					callback(tObj);
				}
			});

		}
		
	});
}

app.get('/userByToken/:id', function (req, res) {

	var token = req.params.id;

	getUserByToken(res, token ,function(user){
		res.setHeader('Content-Type', 'application/json');
		res.send(JSON.stringify(user, null, 3));
	});
})

//////////////////////////////////////////////////////////////////////////////////////////


app.post('/joinTournament', function (req, res) {
	console.log('joinTournament');
	
	// utilizzo l'id del torneo letto dal barcode per cercare nel db
	Tournament.findOne({_id: req.body.tournamentID}, function (err, tObj) {
	  if (err) { // in caso di errore
		console.log("error:");
		console.log(err);
		res.send(JSON.stringify(err, null, 3));
	  } else {
		
		console.log(JSON.stringify(tObj, null, 3));
		
		// imposto nuovo torneo
		var t = new Session({
			user: req.body.user, 
			date: new Date(),
			description: tObj.description, 
			score: 0,
			max: 0,
			tournament: req.body.tournamentID
		});
		
		// salvo torneo nel db
		t.save(function (err, tObj) {
		  if (err) { // in acsore di errore
			res.setHeader('Content-Type', 'application/json');
			console.log(err);
			res.send(JSON.stringify(err, null, 3));
		  } else {
			// resituisco i dati del torneo (compreso ID)
			// resituisco i dati del torneo (compreso ID)
			console.log(tObj);
			res.setHeader('Content-Type', 'application/json');
			res.send(JSON.stringify(tObj, null, 3));
		  }
		});
		
	  }
	});

})

app.post('/newSession', function (req, res) {

	var t = new Session({
		user: req.body.user, 
		date: new Date(),
		description: 'Pratica', 
		score: 0,
		max: 0
	});
	
	t.save(function (err, tObj) {
	  if (err) {
		res.setHeader('Content-Type', 'application/json');
		res.send(JSON.stringify(err, null, 3));
	  } else {
		res.setHeader('Content-Type', 'application/json');
		res.send(JSON.stringify(tObj, null, 3));
	  }
	});

})

app.post('/addVolley/:id', function (req, res) {
	
	var id = req.params.id;

	console.log("addVolley " + id);

	Session.findOne({_id: id}, function (err, tObj) {
	  if (err) {
		console.log(err);
		res.setHeader('Content-Type', 'application/json');
		res.send(JSON.stringify(err, null, 3));
	  } else if (tObj) {

		  //Some demo manipulation
		 
		  console.log(JSON.stringify(req.body, null, 3));
		  
		  tObj.volleies.push({arrows: req.body, sent: new Date()});

		  var max=0;
		  var score=0;
		  for (i=0; i<tObj.volleies.length; i++){
			var v = tObj.volleies[i].arrows;
			for (j=0; j<v.length; j++){
				score += parseInt(v[j].score);
				max +=10;
			}
			
			console.log("sent0: " + tObj.volleies[i].sent);
			
			if (tObj.volleies[i].sent == null){
				tObj.volleies[i].sent=new Date();
			}
			
			console.log("sent1: " + tObj.volleies[i].sent);
			
		  }
		  
		  tObj.score=score;
		  tObj.max=max;
		  
		  console.log(tObj);

		  //Lets save it
		  tObj.save(function (err) {
			if (err) {
			  console.log(err);
			  res.setHeader('Content-Type', 'application/json');
			  res.send(JSON.stringify(err, null, 3));
			} else {
			  console.log('Updated', tObj);
			  res.send('');
			}
		  });

	  } else {
		console.log('Session not found!');
		res.send('');
	  }
	});
})	
	
app.get('/getSession/:id', function (req, res) {

	console.log('getSession....');

	Session.findOne({_id: req.params.id}, function (err, tObj) {
	  if (err) {
		console.log(err);
		res.setHeader('Content-Type', 'application/json');
		res.send(JSON.stringify(err, null, 3));
	  } else if (tObj) {
		console.log(JSON.stringify(tObj, null, 3));
		res.setHeader('Content-Type', 'application/json');
		res.send(JSON.stringify(tObj, null, 3));
	  } else {
	    console.log('Session not found!');
		res.send(JSON.stringify('Session not found!', null, 3));
	  }
	});
})


app.delete('/deleteSession/:id', function (req, res) {

	console.log('delete '+req.params.id);

	Session.findOne({_id: req.params.id}).remove().exec();
	res.send('');
	
})

//////////////////////////////////// Static Resources //////////////////////////////////
app.use(express.static('public'));


////////////////////////////////////// WEB SERVER //////////////////////////////////////
var cluster = require('cluster');
if (cluster.isMaster) {

  var numCPUs = require('os').cpus().length;

  console.log('Cluster ' + process.pid + ' is online');
  
  // Fork workers.
  for (var i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('online', function(worker) {
     console.log('Worker ' + worker.process.pid + ' is online');
  });
  
  cluster.on('death', function(worker) {
    console.log('Worker ' + worker.process.pid + ' has died');
	cluster.fork();
  });
  
  cluster.on('exit', function(worker) {
    console.log('Worker ' + worker.process.pid + ' has exited');
	cluster.fork();
  });
 
  ///////// watch for changes - exit if the source changes - the service will restarted by the SO /////////
  fs.watch(process.mainModule.filename.split('/').slice(-1).pop(), function (event, filename) {
	console.log('Service has changed... restarting ('+ event+')');
	process.exit();
  });
  /////////////////////////////////////////////////////////////////////////////////////////////////////////
 
} else {

	////////// start a worker /////////
	var options = {
	  key: fs.readFileSync('ssl/key.pem'),
	  cert: fs.readFileSync('ssl/cert.pem')
	};
  
	var https = require('https');
	var httpsServer = https.createServer(options, app);

	var server = httpsServer.listen(SERVER_PORT, SERVER_HOST, function () {

	  var host = this.address().address
	  var port = this.address().port;
	  
	  this.on('error', function (err, req, res) {
		  res.writeHead(500, {
			'Content-Type': 'text/plain'
		  });

		  res.end('Something went wrong. ' + err);
		});

	});
  
}
////////////////////////////////////////////////////////////////////////////////////////