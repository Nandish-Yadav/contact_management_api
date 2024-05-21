const spam = require('./../db/models/spam');
const catchAsync = require('../utils/catchAsync');

const markSpam = catchAsync(async(req,res,next)=>{
        const {phone} = req.body;
        const {id} = req.user;
        let update = null;
        const record = await spam.findOne({where:{phone:phone}});
        if(record){
          update = await spam.increment('count',{by:1,where:{phone:phone,marked_by:id}})
          update = update[0][0][0];
        }else{
            update = await spam.create({phone:phone,marked_by:id,count:1})
        }
            return res.status(200).json({
                status: 'success',
                data: update,
            });
        });

module.exports = {markSpam};