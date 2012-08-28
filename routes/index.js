var HTTPStatus = require('http-status');
// Print "Internal Server Error"

function makeRoute(str, handl) {
    return {
        routestr: str,
        routehandler: handl
    }
}

function exportRoute(name, handler, route) {
    exports.routes[name] = makeRoute(route || '/' + name, handler);
}

function commonHttpStatHandler(req, res) {
    var statcode = req.route.path;
    statcode = statcode.substring(1, statcode.length);

    var msg = HTTPStatus[statcode];

    statcode = HTTPStatus[statcode].replace(/\s+/g, '_').toUpperCase();

    res.send(msg, HTTPStatus[statcode]);
}


exports.routes = {};


exportRoute('index', function(req, res) {
    res.render('index', {
        title: 'Express'
    })
}, '/');

exportRoute('jquery', function(req, res) {
    res.render('jquery', {
        title: 'Test jquery ajax error handling'
    })
});


for (var stat in HTTPStatus) {
    if (/^[0-9]*$/.test(stat)) exportRoute(stat, commonHttpStatHandler);
}
