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

const JourneyLegSchema = new Schema({
  sequenceIndex: {
    type: Number,
    required: true,
  },
  locationId: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    required: true,
  },
  coordinates: {
    type: GeoPointSchema,
    required: true,
  },
  dwellDuration: {
    type: Number, // duration spent at this logistics node (in seconds)
    required: true,
    default: 0,
  },
  weatherException: {
    type: Boolean,
    required: true,
    default: false,
  },
}, { _id: false });

const ShipmentJourneySchema = new Schema({
  shipmentId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  status: {
    type: String,
    enum: ['SAFE', 'AT_RISK', 'DELAYED'],
    required: true,
    default: 'SAFE',
  },
  riskScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 0,
  },
  currentEta: {
    type: Date,
    required: true,
  },
  legs: {
    type: [JourneyLegSchema],
    default: [],
  },
}, {
  timestamps: true,
});

const ShipmentJourney = mongoose.model('ShipmentJourney', ShipmentJourneySchema);

export default ShipmentJourney;
