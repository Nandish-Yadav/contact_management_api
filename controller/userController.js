const { Sequelize, where } = require('sequelize');
const user = require('../db/models/user');
const catchAsync = require('../utils/catchAsync');
const Contacts = require('../db/models/contacts');



const getUserById = catchAsync(async (req, res, next) => {
    const {id} = req.params;
    const searcherId = req.user.id;
    const result = await user.findByPk(id);
    const userObj = {...result.dataValues};
    delete result.dataValues.password;
      //Check if user is in searcher's contact list
      if(result && result.id !== searcherId && result.email){
        result.dataValues.email = undefined;
        const searcher_contact = await Contacts.findOne({where:{user_id:searcherId,phone:result.dataValues.phone}});
        if(searcher_contact){
          result.dataValues.email = userObj.email;
        }
      }
      
    return res.status(200).json({
        status: 'success',
        data: result,
    });
});

module.exports = { getUserById };
