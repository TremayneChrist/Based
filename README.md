#Based JS

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

--------------

####Compatibility
<img src="http://www.w3schools.com/images/compatible_ie.gif" title="EI10+" /> 
<img src="http://www.w3schools.com/images/compatible_firefox.gif" title="Firefox" /> 
<img src="http://www.w3schools.com/images/compatible_opera.gif" title="Opera" /> 
<img src="http://www.w3schools.com/images/compatible_chrome.gif" title="Chrome" /> 
<img src="http://www.w3schools.com/images/compatible_safari.gif" title="Safari" />
