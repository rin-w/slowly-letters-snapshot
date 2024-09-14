simple thing that captures the JSON data received when logged in to web.slowly.app

1. get token. input in browser console:
```js
JSON.parse(JSON.parse(localStorage['persist:slowly']).me).token
```

```cmd
node index.js -t <token>
```