import mongoose, {Schema} from 'mongoose';

const videoSchema = new Schema({
  candidate: String,
  description: String,
  video: { type: String, required: true }
}, { timestamps: true });

export const Video =  mongoose.model('Video', videoSchema);
