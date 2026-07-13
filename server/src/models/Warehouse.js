import mongoose from 'mongoose';

const { Schema } = mongoose;

const GeoPointSchema = new Schema({
  type: {
    type: String,
    enum: ['Point'],
    required: true,
    default: 'Point',
  },
  coordinates: {
    type: [Number], // [longitude, latitude]
    required: true,
  },
}, { _id: false });

const WarehouseSchema = new Schema({
  warehouseId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
  },
  coordinates: {
    type: GeoPointSchema,
    required: true,
  },
  currentQueueLength: {
    type: Number,
    required: true,
    default: 0,
  },
  dwellTimeAvg: {
    type: Number, // average delay dwell time at this node in seconds
    required: true,
    default: 0,
  },
}, {
  timestamps: true,
});

const Warehouse = mongoose.model('Warehouse', WarehouseSchema);

export default Warehouse;
