var racer = require('racer');
var express = require('express');

var app = express();
var http = require('http');
var server = http.createServer(app);

var store = racer.createStore({
	server: server,
	db: require('livedb-mongo')(process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'localhost:27017/test?auto_reconnect', { safe: true }),
    redis: require('redis-url').connect(process.env.REDISCLOUD_URL)
});

app.use(express.static(__dirname + '/public'));
app.use(require('racer-browserchannel')(store));
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
			model.bundle(function (err, bundle) {
				res.send(JSON.stringify(bundle));
			});
		}
	});
});

store.bundle(__dirname + '/client.js', function (err, js) {
	app.get('/script.js', function (req, res) {
		res.type('js');
		res.send(js);
	});
});



server.listen(process.env.PORT || 8081);
