const mongoose = require('mongoose');

const connectDB = async () => {
  await mongoose.connect('mongodb+srv://kushss:Honeykush123@kushss.hopcn.mongodb.net/DevTinder');
}

module.exports = connectDB;