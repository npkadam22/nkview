const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const SubsSchema = new Schema({
  subscription: {
    type: String,
    required: true,
    unique: true
  }
});
module.exports = Item = mongoose.model('subs', SubsSchema);