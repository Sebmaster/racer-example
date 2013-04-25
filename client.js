var module = angular.module('racer.js', [], function ($provide) {
	var setImmediate = window && window.setImmediate ? window.setImmediate : function (fn) {
		setTimeout(fn, 0);
	};
	var racer = require('racer');

	$provide.factory('racer', ['$http', '$q', '$rootScope', function ($http, $q, $rootScope) {
		$http.get('/model').success(function (data) {
			racer.init(data);
		});

		var def = $q.defer();
		racer.on('ready', function (model) {
			var operations = ['set', 'del', 'setNull', 'incr', 'push', 'unshift', 'insert', 'pop', 'shift', 'remove', 'move'];
			for (var i = 0; i < operations.length; ++i) {
				(function (i) {
					var op = model[operations[i]];
					model[operations[i]] = function () {
						var args = Array.prototype.slice.call(arguments);
						var cb;
						if (typeof args[args.length - 1] === 'function') {
							cb = args.pop();
						}
						args[args.length] = function () {
							if (cb) cb();
							setImmediate($rootScope.$apply.bind($rootScope));
						};

						op.apply(this, args);
					};
				})(i);
			}

			def.resolve(model);
		});

		return def.promise;
	}]);
});