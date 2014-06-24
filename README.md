#Based JS

Client-side JavaScript database

----------------

Based JS is an easy to use client-side database which enables fast and manageable data handling for web applications. If required, data can also be persistent with Based's local storage integration.

####Creating a table

To create a new database table, we call `db.create` and pass in two parameters. The first, is the table name which will be used to store and retrieve data from the browser storage. Secondly we have the table schema; here we set the column names and properties.

- __type__: Supported data type of the column. `String`, `Boolean`, `Number`, `Array`, `Object` etc.
- __primaryKey__: Whether this column should be used as the primary key. Column cannot have more than one of the same value.
- __required__: Column requires a value. It cannot be `undefined` or `null`
- __id__: Column will be used as the id column and will increment automatically. Column cannot be set.

```javascript
// Create a settings database table
var settings = db.create('settings', {

  // Set the schema
  name: { type: String, primaryKey: true, required: true },
  value: { type: Object }
  
});

// Add a value
settings.add({
  name: 'locale',
  value: 'en-gb'
});
```

```javascript
// Get the setting value
settings.get({ name: 'locale' }).first().value;
```

--------------

####Compatibility
<img src="http://www.w3schools.com/images/compatible_ie.gif" title="EI10+" /> 
<img src="http://www.w3schools.com/images/compatible_firefox.gif" title="Firefox" /> 
<img src="http://www.w3schools.com/images/compatible_opera.gif" title="Opera" /> 
<img src="http://www.w3schools.com/images/compatible_chrome.gif" title="Chrome" /> 
<img src="http://www.w3schools.com/images/compatible_safari.gif" title="Safari" />
