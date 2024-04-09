const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const passport = require('passport');
const bodyParser = require('body-parser');
const keys = require('./config/keys');
const cors = require('express-cors')

require('./models/User');
require('./models/Blog');
require('./services/passport');

mongoose.Promise = global.Promise;
mongoose.connect(keys.mongoURI);

mongoose.connection.on('open', function (ref) {
    console.log('Connected to mongo server.');

    mongoose.connection.db.listCollections().toArray(function (err, names) {
      console.log("🚀 ~ names:", names)
        console.log(names);
    });
})

const app = express();

app.use(bodyParser.json());
app.use(cors({
  allowedOrigins: [
        'http://localhost', 'localhost', 'http://localhost:3000',
    ]
}))
app.use(
  cookieSession({
    name: 'session',
    maxAge: 24 * 60 * 60 * 1000,
    keys: [keys.cookieKey],
  })
);
app.use(passport.initialize());
app.use(passport.session());

require('./routes/authRoutes')(app);
require('./routes/blogRoutes')(app);


if (['production'].includes(process.env.NODE_ENV)) {
  app.use(express.static('client/build'));

  const path = require('path');
  app.get('*', (req, res) => {
    res.sendFile(path.resolve('client', 'build', 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Listening on port`, PORT);
});
