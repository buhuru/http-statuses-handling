var httpStatuses = {
  100: 'Continue',
  101: 'Switching Protocols',
  200: 'OK',
  201: 'Created',
  202: 'Accepted',
  203: 'Non-Authoritative Information',
  204: 'No Content',
  205: 'Reset Content',
  206: 'Partial Content',
  300: 'Multiple Choices',
  301: 'Moved Permanently',
  302: 'Found',
  303: 'See Other',
  304: 'Not Modified',
  305: 'Use Proxy',
  307: 'Temporary Redirect',
  400: 'Bad Request',
  401: 'Unauthorized',
  402: 'Payment Required',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  406: 'Not Acceptable',
  407: 'Proxy Authentication Required',
  408: 'Request Time-out',
  409: 'Conflict',
  410: 'Gone',
  411: 'Length Required',
  412: 'Precondition Failed',
  413: 'Request Entity Too Large',
  414: 'Request-URI Too Large',
  415: 'Unsupported Media Type',
  416: 'Requested range not satisfiable',
  417: 'Expectation Failed',
  500: 'Internal Server Error',
  501: 'Not Implemented',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Time-out',
  505: 'HTTP Version not supported'
};

$.noop = function() {};

var httpStatuses_light = {
  200: 'OK',
  404: 'Not Found',
  500: 'Internal Server Error'
};

var __s = Array.prototype.slice

function defered(f, ctx) {
  var dargs = __s.call(arguments, 2);
  return function() {
    var args = dargs.concat(__s.call(arguments));
    return function() {
      return f.apply(ctx, args.concat(__s.call(arguments)));
    };
  };
};

function rcarry(f, ctx) {
  var rargs = __s.call(arguments, 2);
  return function() {
    var args = __s.call(arguments);
    return f.apply(ctx, args.concat(rargs))
  }
}

function lcarry(f, ctx) {
  var largs = __s.call(arguments, 2);
  return function() {
    var args = __s.call(arguments);
    return f.apply(ctx, largs.concat(args))
  }
}


function bind(f, ctx) {
  return function() {
    return f.apply(ctx, arguments);
  }
}

function pipeAsync(flag /*many functions and finishing callback*/ ) {

  var args = __s.call(arguments);
  var pipeStack = [];
  var fallback = args.shift();
  var finish = args.slice(-1)[0];

  (function recursor(pipe) {
    var f = pipe[0];
    if (fallback) {
      f = lcarry(f, null, pipeStack.slice(-1)[0]);
    }
    f && f(function(err, res) {
      if (err) return finish(err);

      pipeStack.push(res);
      pipe.shift();

      if (pipe.length === 1) { //last callback
        return finish(null, pipeStack)
      }

      recursor(pipe);
    });

  })(args);

}
var pipe = lcarry(pipeAsync, null, false);


var cslReporter = {
  start: function (m) {
    console.group(m)
  },
  before: function(xhr, opts) {
    console.group(opts.url);
    //console.log('before', arguments)
  },
  success: function() {
    console.log('success');
    console.dir(arguments)
  },
  error: function() {
    console.log('error')
    console.dir(arguments)
  },
  complete: function() {
    //console.log('complete', arguments)
    console.groupEnd()
  },
  finish: function() {
    console.log('All http statuses called.')
    console.groupEnd();
  }
};

var reporter = cslReporter;

function runPipe (pipe, stats, start, finish, title, deferabled , next) {
  var handlers = [];
  for (var stat in stats) {
    handlers.push(deferabled('' + stat))
  }
  handlers.push(function () {
    finish();
    next();
  });

  start(title);
  pipe.apply(null, handlers);
}
var drunCommonPipe = defered(runPipe, null, pipe, httpStatuses, reporter.start, reporter.finish);


function testHttpResponse(timeout, before, success, error, complete, code, next) {
  var baseUrl = '/';

  return $.ajax({
    type: 'GET',
    url: baseUrl + code,
    timeout: timeout,
    beforeSend: before,
    success: function() {
      success.apply(null, arguments);
    },
    error: function() {
      error.apply(null, arguments);
    },
    complete: function() {
      complete();
      next();
    }
  });
}

var dtestHttpResponse = defered(testHttpResponse, null, 1500, reporter.before, reporter.success, reporter.error, reporter.complete);


function testJsonpResponse(timeout, before, success, error, complete, jsoncallback, code, next) {
  var baseUrl = '/';

  return $.ajax({
    type: 'GET',
    url: baseUrl + code,
    dataType: 'jsonp',
    timeout: timeout,
    beforeSend: before,
    jsonpCallback : jsoncallback,
    success: function() {
      success.apply(null, arguments);
    },
    error: function() {
      error.apply(null, arguments);
    },
    complete: function() {
      complete();
      next();
    }
  });
}

var jsoncallback = function () {
  console.log('jsoncallback', arguments)
}

var dtestJsonpResponse = defered(testJsonpResponse, null, 1500, reporter.before, reporter.success, reporter.error, reporter.complete, 'jsoncallback');

pipe(
  drunCommonPipe('Http Ajax', dtestHttpResponse),
  drunCommonPipe('Jsonp Requests', dtestJsonpResponse),
  function () {}
);
