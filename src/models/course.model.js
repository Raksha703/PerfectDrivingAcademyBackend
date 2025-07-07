import mongoose, {Schema} from 'mongoose';

const courseSchema = new Schema({
  category:{
    type: String,
    required: true
  },
  name: { type: String, required: true },
  description: {type: String},
  timing: {type: String},
  features: {type: [String]},
  kmPerDay: {type: Number},
  days: {type: Number}
}, { timestamps: true });

export const Course = mongoose.model('Course', courseSchema);