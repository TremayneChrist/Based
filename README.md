#Database.js

Client-side JavaScript database

----------------

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
