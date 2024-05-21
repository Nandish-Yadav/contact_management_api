const {searchByName,searchByPhone} = require('./../controller/searchController');
const { authentication } = require('../controller/authController');

const router = require('express').Router();

router.route('/name').get(authentication,searchByName);
router.route('/phone').get(authentication,searchByPhone);

module.exports = router;