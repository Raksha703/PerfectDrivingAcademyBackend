import mongoose, {Schema} from 'mongoose';

const logsheetSchema = new Schema({
  username: { type: String, ref: 'User', required: true },
  date: { type: String, required: true },
  kmCovered: { type: Number, required: true },
  learning: { type: String, required: true },
  timingFrom: { type: Date, required: true },
  timingTo: { type: Date, required: true }
}, { timestamps: true });

export const Logsheet = mongoose.model('Logsheet', logsheetSchema);
