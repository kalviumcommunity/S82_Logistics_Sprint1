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
    type: [Number], // Array of [longitude, latitude]
    required: true,
  },
}, { _id: false });

const ShipmentEventSchema = new Schema({
  shipmentId: {
    type: String,
    required: true,
    index: true,
  },
  timestamp: {
    type: Date,
    required: true,
    index: true,
  },
  eventType: {
    type: String,
    required: true,
  },
  locationId: {
    type: String,
    required: true,
  },
  coordinates: {
    type: GeoPointSchema,
    required: true,
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true,
});

// Compound index to speed up chronological lookups for a single shipment
ShipmentEventSchema.index({ shipmentId: 1, timestamp: 1 });

const ShipmentEvent = mongoose.model('ShipmentEvent', ShipmentEventSchema);

export default ShipmentEvent;
