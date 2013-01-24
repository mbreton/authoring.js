/**
 * This file is responsible for two things:
 * - expose an API to manipulate and render activity objects
 * - add the learner environemnent including feedback and other consumer related behaviors
 */

/*global Mingus, Handlebars*/
(function() {
  'use strict';
  /**
   * Handle
   */
  Handlebars.registerHelper('ifequalhelp', function(val1, val2, options) {
    // var context = (options.fn.contexts && options.fn.contexts[0]) || this;
    // var val1 = Ember.Handlebars.getPath(context, val1, options.fn);
    // var val2 = Ember.Handlebars.getPath(context, val2, options.fn);
    if (val1 === val2) {
      return options.fn(this);
    } else {
      return options.inverse(this);
    }
  });

  (function() {
    var nameIndex = 0;
    Handlebars.registerHelper('index', function() {
      nameIndex++;
      return nameIndex;
    });
    Handlebars.registerHelper('reset_index', function() {
      nameIndex = 0;
    });
  })();


  // var session;
  var ifr;
  var bb;
  var pubVersion;

  // Explicit API
  this.LxxlLib.Masher = function() {
    var parse = function(payload, flavor) {
      switch (flavor) {
        case 'application/json':
          return JSON.parse(payload);
          // Workaround nasty shit when on public
          // if(!('draft' in ret))
          //   ret.draft = ret.published;
          // return ret;
        case 'text/html':
          // return (new DOMParser()).parseFromString(payload, 'text/xml');
          return Handlebars.compile(payload);
        default:
          break;
      }
      return payload;
    };

    var readDataUri = function(toLoad) {
      var a = toLoad.path.split(',');
      var t = a.shift().split(';');
      if (t.pop() != 'base64')
        throw 'Only base64 encoded data is supported';
      parse(atob(a.join(',')), t.pop());
    };

    var guessType = function(ext) {
      switch (ext) {
        case 'json':
          return 'application/json';
        case 'tpl':
          return 'text/html';
      }
      return null;
    };

    var loader = function(iri, callback) {
      var toLoad;
      try {
        toLoad = Mingus.grammar.IRI.parse(iri);
      }catch (e) {
        // Eg: receiving something that is not an IRI
        callback(iri);
        return;
      }
      switch (toLoad.scheme) {
        case 'jshint':
          break;
        case 'data':
          callback(readDataUri(toLoad));
          break;
        default:
          // case 'http':
          // case 'file':
          var r = new XMLHttpRequest();
          r.open('GET', iri);
          r.onreadystatechange = function() {
            if (r.readyState == 4) {
              callback(parse(r.responseText, guessType(toLoad.path.split('.').pop()) || 'application/json'));
            }
          };
          r.send();
          break;
      }
    };

    var init = 0;
    var done = 0;
    var tpl;
    var act;
    var styles = [];
    var completionCallback;


    var loadingComplete = function() {
      if (completionCallback)
        completionCallback();
    };

    var note = function(data) {
      if (typeof data == 'function')
        tpl = data;
      else
        act = data;
      init++;
      if (init == done) {
        // ++ All that should migrate into sessionManager
        LxxlLib.sessionManager.start(act, pubVersion);
        var deref = LxxlLib.sessionManager.activity;
        deref = pubVersion ? deref.published : deref.draft;
        deref.styleData = [];
        deref.styleUri = [];
        // Style mashuping
        styles.forEach(function(item) {
          try {
            Mingus.grammar.IRI.parse(item);
            deref.styleUri.push({data: item});
          }catch (e) {
            deref.styleData.push({data: item});
          }
        });
        // Fixing the activity
        deref.pages.forEach(function(item, ind) {
          item.id = ind;
        });
        var res = tpl(deref);
        if ('html' in ifr)
          ifr.html(res);
        else
          ifr.innerHTML = res;
        LxxlLib.sessionManager.bindDocument(ifr);
        // -- All that should migrate into sessionManager
        loadingComplete();
      }
    };


    this.setupViewport = function(node, noframe) {
      if (ifr && ifr.parentNode)
        ifr.parentNode.removeChild(ifr);
      if (bb && bb.parentNode){
        bb.parentNode.removeChild(bb);
      }
      if (!noframe) {
        if(!('appendChild' in node))
          node = node[0];
        ifr = document.createElement('iframe');
        bb = ifr;
        node.appendChild(ifr);
        ifr = ifr.contentDocument.body;
      }else
        ifr = node;
    };

    this.addStyle = function(styleBlob) {
      styles.push(styleBlob);
    };


    this.setupTemplate = function(templateIri) {
      done++;
      loader(templateIri || 'activity.tpl', note);
    };

    this.showActivity = function(activityIri, callback, published) {
      pubVersion = published;
      done++;
      completionCallback = callback;
      loader(activityIri, note);
      var c = window.onunload;
      window.onunload = function() {
        LxxlLib.sessionManager.end();
        if (c)
          c();
      };
    };

    // Allow to encode stuff
    var encode = function(obj) {
      return btoa(JSON.stringify(obj));
    };

    this.makeDataUri = function(obj) {
      return 'data:application/json;base64,' + encode(obj);
    };

  };





  /*  Ember.Handlebars.registerHelper('isEqual', function(key, options) {
    return key ==
    options.defaultValue = '---';
    var ret = I18n.translate(key, options);
    return (ret != '---') && ret || null;
  });*/


  /*
  var helpers = new (function() {
    var pad = function(subject, n, pattern) {
      subject = subject + '';
      while (subject.length < n) {
        subject = pattern + '' + subject;
      }
      return subject;
    };

// XXX use this instead of the other crap

// var date = new Date(null);
//       date.setSeconds(this.get('currentPage.limitedTime'));
//       var time = date.toUTCString().split('1970 ').pop().split('GMT').shift().split(':').map(function(i) {
//         return parseInt(i);
//       });


    this.chronometer = function(node, seconds, toutCbk) {
      var cur = seconds;
      $(node).html(pad(Math.floor(cur / 60), 2, '0') + ':' + pad(cur % 60, 2, '0'));
      var tout;

      var ticker = function() {
        if (cur < seconds / 2) {
          $(node).addClass('hurry');
        }

        if (!cur) {
          this.dead = true;
          $(node).addClass('finished');
          toutCbk();
          return;
        }
        cur--;
        $(node).html(pad(Math.floor(cur / 60), 2, '0') + ':' + pad(cur % 60, 2, '0'));
        tout = window.setTimeout(ticker, 1000);
      };

      this.start = function() {
        if (!this.dead)
          ticker();
      };

      this.dead = false;

      this.stop = function() {
        window.clearTimeout(tout);
      };
    };
  })();
  */









  /*
  var ActivityUserController = function(mesh) {
    this.activity = new LxxlLib.model.Activity(mesh);

    this.start = function(node) {
      console.warn('starting activity bound on node', node);
      behaviors(node);
      // var isThere = LxxlLib.scorm.execute(LxxlLib.scorm.INIT);
      // if (!isThere)
      //   console.error('No LMS found - won\'t use the api at all');
    };

    this.end = function() {
      LxxlLib.scorm.execute(LxxlLib.scorm.FINISH);
      console.warn('stopping activity');
    };


    var pageEnter = function(index) {
      console.warn('Entering page ', index);
      if (this.activity.pages[index].chrono)
        this.activity.pages[index].chrono.start();
    };

    var pageExit = function(index) {
      console.warn('Exiting page ', index);
      if (this.activity.pages[index].chrono && !this.activity.pages[index].chrono.dead)
        this.activity.pages[index].chrono.stop();
    };

    var behaviors = function(dom) {
      // Chronometers binding
      $('.clocker').each(function(i, item) {
        var s = parseInt($(item).attr('data-chrono'), 10);
        var id = parseInt($(item).attr('data-binding'), 10);
        if (s) {
          this.activity.pages[i].chrono = new helpers.chronometer(item, s, function() {
            console.warn('Timedout like a mangouste on ', id);
          });
        }else {
          $(item).hide();
        }
      });

    };
  };
  */
}).apply(this);

// Activity may be passed as a json url, or embedded as a datauri?
if (/embed\.html/.test(location.href)) {
  var id = location.href.match(/id=([a-z0-9]+)/i);
  if(id){
    id = id.pop();
    var a = new LxxlLib.Masher();
    a.setupViewport($('#lxxlroot'), true);
    // a.addStyle('body{background-color: blue;}');
    a.setupTemplate('activity.tpl');
    // activity.published
    id = '//api.education-et-numerique.fr/1.0/activities/' + id + '/public';
    a.showActivity(id, function() {
      console.warn('All set baby!');
    });
  }
}


/*
// window.onload = function(){
//   console.warn("loade");
var a = new LxxlLib.activity();
a.setupViewport(document.body, true);
a.addStyle('body{background-color: blue;}');
a.addStyle('http://static.loft.sn.ackitup.net:4242/lib/frameworks/normalize/normalize-2.0.css');
a.setupTemplate('activity.tpl');
a.showActivity('test.json', function(){
  console.warn("All set baby!");
});
// };
*/

// a.makeDataUri({title: "thing", chist: "stuff"});
