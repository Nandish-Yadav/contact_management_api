const {markSpam} = require('./../controller/spamController');
const { authentication } = require('../controller/authController');

const router = require('express').Router();

router.route('/').post(authentication,markSpam);

module.exports = router
