const { Op,Sequelize, where } = require('sequelize');
const Contacts = require('./../db/models/contacts');
const User = require('../db/models/user');
const Spam = require('../db/models/spam');


const search = async(req,res)=>{
    try{
      const   {phone,name,pageNum=1,pageSize=10} = req.query;
      if(!phone &&!name){
        throw new Error('need phone or name');
      }
    //   console.log(phone,name)
      let search_arr = [];
      if(phone){
        search_arr.push({phone:{ [Op.like]: `%${phone}%` }})
      };
      if(name){
        search_arr.push({name:{ [Op.like]: `%${name}%` }} )
      };
      const search_results = await contacts.findAll({
        where: {
            [Op.or]: search_arr
          },
          include:user
      });
      return res.status(200).json({
        status: 'success',
        data: search_results,
    });
    }catch(error){
        console.error(error.message)
        return res.status(500).json({
            status: 'error',
            message: error.message,
        });
    }
};


// Search by Name endpoint
const searchByName = async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ message: 'Missing search query' });
  }
  try {
    // Search Users
    const users = await User.findAll({
      where: {
        name: {
          [Op.or]: [
            { [Op.like]: `%${query}%` },
            { [Op.startsWith]: query },
          ],
        },
      },
      attributes: ['id', 'name', 'phone'],
    });

    // Search Contacts (including those not linked to users)
    const contacts = await Contacts.findAll({
      where: {
        name: {
          [Op.or]: [
            { [Op.like]: `%${query}%` },
            { [Op.startsWith]: query },
          ],
        },
      },
      attributes: ['id', 'name', 'phone'],
    });

    // Combine results (users and contacts)
    const results = [...users, ...contacts];

    // Sort results by name (starting with query first)
    results.sort((a, b) => {
      if (a.name.startsWith(query) && !b.name.startsWith(query)) {
        return -1;
      } else if (!a.name.startsWith(query) && b.name.startsWith(query)) {
        return 1;
      }
      return a.name.localeCompare(b.name);
    });

    // Add spam likelihood to each result
    for (const result of results) {
      result.spam_likelihood =await getSpamCount(result.phone) || 'Low';
    }
    return res.status(200).json({
      status: 'success',
       data: results.map((result) => ({
        id: result.id, // Include all necessary properties
        name: result.name,
        phone: result.phone,
        spam_likelihood: result.spam_likelihood, // Explicitly include
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

//Search by Phone endpoint
const searchByPhone = async (req, res) => {
  const { phone } = req.query;
  const loggedInUserId = req.user?.id; 

  if (!phone) {
    return res.status(400).json({ message: 'Missing phone number' });
  }

  try {
    // Search for registered user with phone number
    const user = await User.findOne({
      where: { phone:phone },
      attributes: ['id', 'name', 'email','phone'], // Include email for registered users
    });

    let results;
    if (user) {
      // If registered user found, show only that user
      //Check if user is in searcher's contact list
      results = await  Promise.all([formatUserDetail(user.dataValues, loggedInUserId)]);
    } else {
      // Otherwise, search contacts with matching phone number
      results = await Contacts.findAll({
        where: { phone:phone },
        attributes: ['id', 'name', 'phone']
      });
    }

    // Add spam likelihood to each result
    for (const result of results) {
      result.spam_likelihood = await getSpamCount(result.phone) || undefined;
    }

    return res.status(200).json({
      status: 'success',
      data: results.map((result) => ({
        id: result.id, // Include all necessary properties
        name: result.name,
        phone: result.phone,
        email:result.email?result.email:undefined, 
        spam_likelihood: result.spam_likelihood, // Explicitly include
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {search,searchByName,searchByPhone};


// Function to get spam likelihood for a phone number
async function getSpamCount(phoneNumber) {
  const spamEntry = await Spam.findOne({ where: { phone: phoneNumber } });
  return spamEntry ? spamEntry.count : 0;
}

// Function to format user details with access control
async function formatUserDetail(userObject, loggedInUserId) {
  const user = { ...userObject }; // Clone to avoid modifying original object
  delete user.email; // Exclude email by default

  // Check if user is registered and in searcher's contact list

  const isInContactList = userObject.email ?await Contacts.findAll({
    where:
    {
      phone:user.phone,
      user_id:loggedInUserId
    }
  }):undefined;

  if(isInContactList && isInContactList.length>0 && userObject.email){
    user.email = userObject.email;
  }

  return user;
}
