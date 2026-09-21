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
  lastDonated:{
    type: Date,
    default: null
  },
  lastDonatedDate:{
    type: Date,
    default: null
  },
  totalDonations:{
    type: Number,
    default: 0
  },
  isAvailable:{
    type: Boolean,
    default: true
  },
  liveStatus: {
    type: String,
    enum: ['Pending', 'In Transit', 'In-Transit', 'Accepted', 'Reached', 'Arrived', 'Completed', 'Cancelled'],
    default: 'Pending'
  },
  currentLocationStatus: {
    type: String,
    default: 'Not Started'
  },
  estimatedArrival: {
    type: String,
    default: 'N/A'
  },
  assignedRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BloodRequest',
    default: null
  },
  trackingLogs: [
    {
      status: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
      notes: { type: String, default: '' }
    }
  ],
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0]
    }
  }
},{timestamps: true, strict: false});

DonorSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Donor', DonorSchema);