const spam = require('./../db/models/spam');

const markSpam = async(req,res)=>{
    try{
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
        if(update){
            return res.status(200).json({
                status: 'success',
                data: update,
            });
        }
        return res.status(200).json({
            status: 'fail',
            message:"Interal server error",
        });
    }catch(error){
        console.error(error.message)
        return res.status(500).json({
            status: 'error',
            message: error.message,
        });
    }
}

module.exports = {markSpam}