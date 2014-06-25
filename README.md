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

// Create a media database table
var media = db.create('media', {

  // Set the schema
  id:{ id: true },
  name: { type: String, required: true },
  album: { type: String, required: true },
  artist: { type: String, required: true },
  length: { type: Number, required: true },
  genre: { type: String, required: true }
  
});

```

####Adding a value

To add a value, you must call `add()` on the newly created table and pass in an object which is based on the set schema.

ID columns do not need to be set as the table handles this automatically.

```javascript

// Add a value
media.add({
  name: 'Sing',
  album: 'X,
  artist: 'Ed Sheeran,
  length: 235,
  genre: 'Pop'
});

// returns...
{
  id: 0,
  name: 'Sing',
  album: 'X,
  artist: 'Ed Sheeran,
  length: 235,
  genre: 'Pop'
}


```

####Getting a value

Getting values is easy and can be achieved in different ways. The best way to find the result you are after is to use the `id` as this field is unique and will only ever return one result.
If you want a broader search, however, you can also pass in a query.

_Note: Loose queries will be added shortly, allowing for [less than], [greater than], [contains] etc._

```javascript

// Get a value using id
media.get(0).first(); // returns a result based on id

// Get a value using query
// returns a TableResult array of matches
media.get({ name: 'Sing', artist: 'Ed Sheeran' });

```

####Updating a value

In order to accurately update a value we must know its id. This is so we know we will only be updating a singular result.
Like `get()`, queries are also supported and are helpful for corrections or updates.

```javascript

// Update a value using id
media.update(0, {
  album: 'X (Deluxe Edition)' // Add a '(Deluxe Edition)' to the end
});

// Update a value using query
// This will modify all that matches the query.
media.update({ artist: 'Ed Sheeran' }, {
  artist: 'Ed Sheeran.' // Add a '.' to the end
});

```

####Delete a value

Deleting values is again similar to all the other methods, we can either pass in an id, or a query, and the result set will be removed from the table.

```javascript

// Delete a value using id
media.delete(0);

// Delete a value using query
media.delete({ name: 'Sing', artist: 'Ed Sheeran' });

```

#### Synchronising with local storage

Based JS supports saving your table data to the local storage on your browser. This is only recommended for small sets of data as local storage is usually limited to 5 MB.

To save your data you must call `sync()` on your table...

```javascript

media.sync();

```

This will store the current state to the local storage object, so that when you reload your page, your data will remain in your table.

Database tables automatically restore data on creation. If you wish to unsync your database, call `unsync()`

```javascript

media.unsync();

```

--------------

####Compatibility
<img src="http://www.w3schools.com/images/compatible_ie.gif" title="IE10+" /> 
<img src="http://www.w3schools.com/images/compatible_firefox.gif" title="Firefox" /> 
<img src="http://www.w3schools.com/images/compatible_opera.gif" title="Opera" /> 
<img src="http://www.w3schools.com/images/compatible_chrome.gif" title="Chrome" /> 
<img src="http://www.w3schools.com/images/compatible_safari.gif" title="Safari" />
