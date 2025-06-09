var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('Home');
})

/* GET Login page. */
router.get('/login', function(req, res, next) {
  res.render('Login');
});


/* GET Cadastro page. */
router.get('/cadastro', function(req, res, next) {
  res.render('Cadastro');
});

/* GET Dashboard page. */
router.get('/dashboard', function(req, res, next) {
  res.render('Dashboard');
});

module.exports = router;
