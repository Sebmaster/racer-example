var racer = require('racer');
var express = require('express');

var app = express();
var http = require('http');
var server = http.createServer(app);

var store;
if (process.env.MONGO_URL) {
	racer.use(require('racer-db-mongo'));
	store = racer.createStore({
		listen: server,
		db: {
			type: 'Mongo',
			uri: process.env.MONGO_URL
		}
	});
} else {
	store = racer.createStore({
		listen: server
	});
}

if (process.env.VMC_APP_PORT) { // disable websockets on appfog
	racer.io.set('transports', ['xhr-polling']);
}

var serverModel = store.createModel();
serverModel.set('entries', {});
serverModel.subscribe('entries', function () { });

app.use(express.static(__dirname + '/public'));
app.use(express.bodyParser());

app.get('/', function (req, res) {
	res.sendfile(__dirname + '/public/index.htm');
});

app.get('/model', function (req, res) {
	var model = store.createModel();
	model.subscribe('entries', function (err, entries) {
		if (err) {
			res.status(500);
			res.send(err);
		} else {
			model.bundle(function (bundle) {
				res.send(bundle.toString());
			});
		}
	});
});

racer.js({ entry: __dirname + '/client.js' }, function (err, js) {
	app.get('/script.js', function (req, res) {
		res.type('js');
		res.send(js);
	});
});



server.listen(process.env.VMC_APP_PORT || 8081);
