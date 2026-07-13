import { z } from 'zod';

export const ShipmentEventIngestSchema = z.object({
  shipmentId: z.string().min(1, 'shipmentId is required'),
  eventType: z.string().min(1, 'eventType is required'),
  latitude: z.number().min(-90, 'Latitude must be between -90 and 90').max(90, 'Latitude must be between -90 and 90'),
  longitude: z.number().min(-180, 'Longitude must be between -180 and 180').max(180, 'Longitude must be between -180 and 180'),
  locationId: z.string().min(1, 'locationId is required'),
  timestamp: z.coerce.date({
    invalid_type_error: 'timestamp must be a valid date or date string',
  }),
  metadata: z.record(z.any()).optional().default({}),
});

export default {
  ShipmentEventIngestSchema,
};
