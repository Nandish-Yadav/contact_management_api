const { authentication } = require('../controller/authController');
const { getAllUser,getUserById } = require('../controller/userController');

const router = require('express').Router();

router.route('/:id').get(authentication, getUserById);

module.exports = router;
