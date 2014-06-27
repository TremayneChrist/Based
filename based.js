'use strict';

var db;


(function() {

  // Invoker used for calling special commands
  var invoker = {},

    // Error codes and summaries
    errors = {
      '0': 'Generic Error',
      '1': 'System Error',
      '1001': 'Table creation error',
      '1002': 'Table modification error',
      '2001': 'Filter Error'
    },

    // Error creator
    error = function(code, message) {
      var e = errors[code.toString()];
      if (e === undefined) throw error(1, 'Error code not found');
      throw '[' + code + '] ' + e + ' - ' + message;
    };


    // Database Table object
  var DatabaseTable = function(name, columns, options) {

    if (!(typeof name === 'string' && columns instanceof Object)) error(1001, 'Format is invalid');

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
    }).length > 1) error(1001, 'You can only have one id column');

    if (where(columns, {
      primaryKey: true
    }).length > 1) error(1001, 'You can only have one primary key column');

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

    doDbTasks(this);

    // Get any data from local storage
    this.sync(true);
  };


  // Database Table methods
  DatabaseTable.prototype = {

    // Add an item to the database
    add: function(item, _invoker) {

      // Check if we can add the item
      validateEntry.bind(this)(item, _invoker);

      for (var key in this.columns) {

        if (this.columns[key].primaryKey) {
          this.primaryKeys[item[key]] = 0;
        }

        // Check if we are trying to set an ID column
        if (_invoker === invoker) {
          if (this.columns[key].id) {
            this.index[item[key].toString()] = item;
          }
        } else {
          if (this.columns[key].id) {
            var id = this.getNextId(invoker);
            item[key] = id;
            this.index[id.toString()] = item;
          }
        }
      }

      this.items.push(item);

      return clone(item, true);
    },

    // Return a subset based on a query
    get: function(query, value, _invoker) {

      doDbTasks(this);

      if (typeof query === 'number') {
        var idCol = where(this.columns, {
          id: true
        }).first();
        if (idCol) {
          var result = new TableResult();
          result.push(_invoker === invoker ? this.index[query.toString()] :
            clone(this.index[query.toString()], true));
          return result;
        }
      }
      return where(this.items, query, value, _invoker);
    },

    // Return all items
    all: function () {

      var result = new TableResult(),
      itemClone = clone(this.items, true);

      for (var i = 0; i < itemClone.length; i++)
        result.push(itemClone[i]);

      return result;

    },

    // Update an item in the table
    update: function(query, data) {

      var _this = this;

      this.get(query, null, invoker).forEach(function(item) {

        // Check if we can add the item
        validateEntry.bind(_this)(data);

        data = clone(data, true);

        for (var key in data) {
          item[key] = data[key];
        }

      });
    },

    // Remove an item from the table
    delete: function(query) {

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
    },

    unsync: function () {
      localStorage.removeItem('table_' + this.name);
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
    if (typeof callback !== 'function') error(0, 'Missing argument');
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
    dbTaskWorker.onmessage = function(e) {
      database.size = (e.data / 1024).toFixed(2) + ' KB';
      dbTaskTimer = setTimeout(function() {
        doDbTasks(database);
      }, 5000);
    };
    dbTaskWorker.postMessage(JSON.stringify({
      id: database.getId(invoker),
      items: database.items
    }));
  }


  /* HELPERS...
  --------------------------------------*/

  function validateEntry(item, _invoker) {

    if (item instanceof Object === false || item instanceof Array === true) error(1002, 'Item format is invalid');

    for (var key in item) {

      // Is the column name supported?
      if (this.columnNames.indexOf(key) == -1)
        error(1002, 'Table does not support this entry [' + key + ']');
    }

    for (var key in this.columns) {

      // Check if we are adding a duplicate primary key
      if (this.columns[key].primaryKey && this.primaryKeys.hasOwnProperty(item[key]))
        error(1002, 'An item with the same primary key has already been added');

      // Check if we are trying to set an ID column
      if (_invoker !== invoker && this.columns[key].id && item[key] !== undefined)
        error(1002, 'Column [' + key + '] cannot be set as it is an ID column');

      // Is the field required?
      if (this.columns[key].required && isUndefinedOrNull(item[key]))
        error(1002, '[' + key + '] is a required field');

      // Is the type correct?
      if (item[key] !== undefined && typeof item[key] != typeof this.columns[key].type() && this.columns[key].type != Object)
        error(1002, '[' + key + '] was an unexpected type');
    }
  }

  function localStorageSize() {
    var size = 0;
    for (var key in localStorage) {
      size += encodeURI(localStorage[key]).split(/%..|./).length - 1;
    }
    return (size / 1024).toFixed(2) + ' KB';
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

  function clone(obj, deep) {

    if (typeof obj !== 'object')
      error(1, 'Can only clone objects and/or arrays');

    var result = obj instanceof Array ? [] : {};

    for (var key in obj) {
      if (typeof obj[key] === 'object' && deep === true) {
        result[key] = clone(obj[key], deep);
      } else {
        result[key] = obj[key];
      }
    }

    return result;

  };

  function where(obj, query, value, _invoker) {
    if (obj instanceof Object === false) error(2001, 'Can only query objects');
    if (!(query instanceof Object || typeof query === 'string')) error(2001, 'Query is invalid');

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
      if (match) result.push(_invoker === invoker ? obj[item] : clone(obj[item], true));
    }
    return result;
  }

})();
