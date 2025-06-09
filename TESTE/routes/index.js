var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('Home', { title: 'Express' });
});
router.get('/login', function(req, res, next) {
  res.render('Login');
});

router.get('/cadastro', function(req, res, next) {
  res.render('Cadastro');
});

router.get('/dashboard', function(req, res, next) {
  res.render('Dashboard');
});

module.exports = router;
