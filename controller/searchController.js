const { Op,Sequelize, where } = require('sequelize');
const Contacts = require('./../db/models/contacts');
const User = require('../db/models/user');
const Spam = require('../db/models/spam');
const catchAsync = require('../utils/catchAsync');

// Search by Name endpoint
const searchByName = catchAsync(async (req, res,next) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ message: 'Missing search query' });
  }
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
});

//Search by Phone endpoint
const searchByPhone = catchAsync(async (req, res,next) => {
  const { phone } = req.query;
  const loggedInUserId = req.user?.id; 

  if (!phone) {
    return res.status(400).json({ message: 'Missing phone number' });
  }

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
});

module.exports = {searchByName,searchByPhone};


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
