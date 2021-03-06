angular.module('racer.js', [], ['$provide', function ($provide) {
	function extendObject(from, to) {
		if (from === to) return to;

		if (from.constructor === Array && to && to.constructor === Array) {
			for (var i = 0; i < from.length; ++i) {
				to[i] = extendObject(from[i], to[i]);
			}
			to.splice(from.length, to.length);

			return to;
		} else if (from instanceof Object && to && to instanceof Object) {
			for (var key in to) {
				if (typeof from[key] === 'undefined' || key === '$$hashKey') {
					delete to[key];
				}
			}

			for (var key in from) {
				if (key === '$$hashKey') continue;

				to[key] = extendObject(from[key], to[key]);
			}

			return to;
		} else if (to === undefined) {
			return extendObject(from, new from.constructor());
		} else {
			return from;
		}
	}

	var setImmediate = window && window.setImmediate ? window.setImmediate : function (fn) {
		setTimeout(fn, 0);
	};

	var racer = require('racer');

	$provide.factory('racer', ['$http', '$q', '$rootScope', function ($http, $q, $rootScope) {
		$http.get('/model').success(function (data) {
			racer.init(data);
		});

		var def = $q.defer();
		racer.ready(function (model) {
			var paths = {};

			var oldGet = model.get;
			model.get = function (path) {
				if (!paths[path]) {
					paths[path] = extendObject(oldGet.call(model, path));

					model.on('all', path ? path + '**' : '**', function () {
						// clone data since angular would set $ properties in the racer object otherwise
						var newData = extendObject(oldGet.call(model, path));
						paths[path] = extendObject(newData, paths[path]);
						setImmediate($rootScope.$apply.bind($rootScope));
					});
				}

				return paths[path];
			};

			def.resolve(model);
			$rootScope.$apply();
		});

		return def.promise;
	}]);
}]);