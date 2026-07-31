const mongoose = require('mongoose');
const DonorSchema = new mongoose.Schema({
  fullName:{
    type: String,
    required:[true, 'Full name is required'],
    trim: true
  },
  age:{
    type: Number,
    required:[true, 'Age is required'],
    min:[18,'Blood donor must be above 18 years of age']
  },
  phone:{
    type: String,
    required:[true,'Phone number is required'],
    trim: true
  },
  email:{
    type: String,
    required:[true, 'email id is required'],
    lowercase: true,
    unique:true,
    trim: true
  },
  password:{
    type: String,
    required:[true, 'Password is required']
  },
  address:{
    type: String,
    required:[true, 'Address is required']
  },
  bloodGroup:{
    type: String,
    required:[true, 'Blood Group is required'],
    enum:['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  },
  allergies:{
    type: String,
    default:''
  },
  condition:{
    type:String,
    default:''
  },
  lastDonation:{
    type: Date,
    default: null
  },
  isAvailable:{
    type: Boolean,
    default: true
  }
},{timestamps: true});

module.exports = mongoose.model('Donor', DonorSchema);