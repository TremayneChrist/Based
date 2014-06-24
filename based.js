'use strict';

var db;


(function() {

  // Invoker used for calling special commands
  var invoker = {};


  // Database Table object
  var DatabaseTable = function(name, columns, options) {

    if (!(typeof name === 'string' && columns instanceof Object)) throw 'Format is invalid';

    var id = 0;

    this.name = name;
    this.items = [];
    this.primaryKeys = [];
    this.index = {};
    this.columns = {};
    this.columnNames = [];
    this.size = '0 KB';

    this.getId = function() {
      if (arguments[0] === invoker) return id;
    };

    this.getNextId = function() {
      if (arguments[0] === invoker) return id++;
    };

    this.setId = function(_id) {
      if (arguments[1] === invoker) id = _id;
    };

    if (where(columns, {
      id: true
    }).length > 1) throw 'You can only have one id column';

    if (where(columns, {
      primaryKey: true
    }).length > 1) throw 'You can only have one primary key column';

    for (var key in columns) {
      this.columns[key] = {
        id: columns[key].id === true,
        primaryKey: columns[key].primaryKey === true,
        required: columns[key].primaryKey === true || columns[key].required === true,
        type: columns[key].hasOwnProperty('type') ? columns[key].type : Object,
        name: key
      };
      this.columnNames.push(key);
    }

    // Get any data from local storage
    this.sync(true);
  };


  // Database Table methods
  DatabaseTable.prototype = {

    // Add an item to the database
    add: function(item, _invoker) {

      doDbTasks(this);

      if (item instanceof Object === false || item instanceof Array === true) throw 'Item format is invalid';
      for (var key in this.columns) {

        // Is the column name supported?
        if (this.columnNames.indexOf(key) == -1) throw 'Table does not support this entry [' + key + ']';

        if (this.columns[key].primaryKey) {
          if (this.primaryKeys.indexOf(item[key]) != -1) throw 'An item with the same primary key has already been added';
          this.primaryKeys.push(item[key]);
        }

        // Check if we are trying to set an ID column
        if (_invoker === invoker) {
          if (this.columns[key].id) {
            this.index[item[key].toString()] = item;
          }
        } else {
          if (this.columns[key].id && item[key] !== undefined) throw 'Column [' + key + '] cannot be set as it is an ID column';
          if (this.columns[key].id) {
            var id = this.getNextId(invoker);
            item[key] = id;
            this.index[id.toString()] = item;
          }
        }

        // Is the field required?
        if (this.columns[key].required && isUndefinedOrNull(item[key])) throw '[' + key + '] is a required field';

        // Is the type correct?
        if (item[key] !== undefined && typeof item[key] != typeof this.columns[key].type() && this.columns[key].type != Object) throw '[' + key + '] was an unexpected type';
        item[key] = item[key]; // Set the property key whether it is undefined or no
      }
      this.items.push(item);
    },

    // Return a subset based on a query
    get: function(query) {

      doDbTasks(this);

      if (typeof query === 'number') {
        var idCol = where(this.columns, {
          id: true
        }).first();
        if (idCol) {
          var result = new TableResult();
          result.push(this.index[query.toString()]);
          return result;
        }
      }
      return where(this.items, query);
    },

    // Remove an item from the table
    delete: function(query) {

      doDbTasks(this);

      var _this = this;
      this.get(query).forEach(function(item) {
        for (var key in _this.columns) {
          if (_this.columns[key].id === true) {
            delete _this.index[item[key].toString()];
            break;
          }
        }
        _this.items.splice(_this.items.indexOf(item), 1);
      });
    },

    // Sync the database table (Currently local storage only)
    sync: function(pull) {
      if (pull) {
        var data = localStorage.getItem('table_' + this.name);
        if (data) {
          data = JSON.parse(data);
          for (var i = 0; i < data.items.length; i++)
            this.add(data.items[i], invoker);
          this.setId(data.id, invoker);
        }
      } else {
        try {
          localStorage.setItem('table_' + this.name, JSON.stringify({
            id: this.getId(invoker),
            items: this.items
          }));
        } catch (e) {
          console.warn('You do not have enough local storage space to sync [' + this.name + '].' +
            '\nYour local storage is currently using ' + localStorageSize());
        }
      }
    }
  };

  // Table result object
  var TableResult = function() {};

  TableResult.prototype = new Array();

  TableResult.prototype.first = function() {
    return this[0];
  };

  TableResult.prototype.last = function() {
    return this[this.length > 0 ? this.length - 1 : 0];
  };

  TableResult.prototype.forEach = function(callback) {
    if (typeof callback !== 'function') throw 'Missing argument';
    for (var i = 0; i < this.length; i++) {
      callback(this[i], i);
    }
  };


  // Create the db tool object
  db = {
    create: function(name, columns, options) {
      return new DatabaseTable(name, columns, options);
    }
  };

  var dbTaskTimer, dbTaskWorker = new Worker(
    window.URL.createObjectURL(
    new Blob(['onmessage = function (e) { self.postMessage(encodeURI(e.data).split(/%..|./).length - 1); }'])));

  function doDbTasks(database) {
    clearTimeout(dbTaskTimer);
    dbTaskTimer = setTimeout(function() {
      dbTaskWorker.onmessage = function(e) {
        database.size = (e.data / 1024).toFixed(2) + ' KB';
      };
      dbTaskWorker.postMessage(JSON.stringify({
        id: database.getId(invoker),
        items: database.items
      }));
    }, 2000);
  }

  function byteCount(s) {
    return encodeURI(s).split(/%..|./).length - 1;
  }

  function localStorageSize() {
    var size = 0;
    for (var key in localStorage) {
      size += byteCount(localStorage[key]);
    }
    return Math.round(size / 1024) + ' KB';
  }

  function isUndefinedOrNull(obj) {
    if (obj === undefined || obj === null)
      return true;
    return false;
  }

  function isUndefinedNullOrEmpty(obj) {
    if (isUndefinedOrNull(obj) || obj === '')
      return true;
    return false;
  }

  function where(obj, query, value) {
    if (obj instanceof Object === false) throw 'Can only query objects';
    if (!(query instanceof Object || typeof query === 'string')) throw 'Query is invalid';

    var q, match = false,
      result = new TableResult();

    if (typeof query === 'string') {
      q = {};
      q[query] = value;
      query = q;
    }

    for (var item in obj) {
      match = true;
      for (var q in query)
        if (obj[item][q] != query[q])
          match = false;
      if (match) result.push(obj[item]);
    }

    return result;
  }

})();
