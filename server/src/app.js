let express = require('express'),
  app = express(),
  port = 2030;

app.get('/', function (req, res) {
  res.send('Like Stat');
});

app.listen(port, function () {
  console.log(`Example app listening on port ${port}!`);
});
