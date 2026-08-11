import ShipmentJourney from '../../models/ShipmentJourney.js';
import { redisClient } from '../../config/redis.js';
import { getIO } from '../../config/socket.js';
import logger from '../../config/logger.js';

/**
 * Controller: processTelemetryPing
 * Processes incoming GPS ping from truck hardware
 */
export async function processTelemetryPing(req, res, next) {
  try {
    const { trackingId, lat, lng, locationId, weatherException, dwellDuration } = req.body;

    if (!trackingId || lat === undefined || lng === undefined) {
      return res.status(400).json({ error: 'Missing required telemetry fields: trackingId, lat, lng' });
    }

    let journey = await ShipmentJourney.findOne({ shipmentId: trackingId });

    if (!journey) {
      // Auto-create shipment if it doesn't exist (solves 404 issue)
      journey = new ShipmentJourney({
        shipmentId: trackingId,
        status: 'SAFE',
        riskScore: 10,
        currentEta: new Date(Date.now() + 86400000), // 24 hours from now
        legs: []
      });
    }

    // Determine status based on weatherException
    if (weatherException) {
      journey.status = 'DELAYED';
      journey.riskScore = 85;
      journey.currentRiskScore = 85;
    } else if (journey.status === 'DELAYED' && !weatherException) {
      // If it was delayed but now fine, maybe normalize it (simplified logic)
      journey.status = 'SAFE';
      journey.riskScore = 20;
      journey.currentRiskScore = 20;
    }

    // Append new leg
    const newLeg = {
      sequenceIndex: journey.legs.length,
      locationId: locationId || `HUB-${trackingId.split('-')[1] || 'UNKNOWN'}`,
      timestamp: new Date(),
      coordinates: {
        type: 'Point',
        coordinates: [lng, lat] // GeoJSON format: [longitude, latitude]
      },
      dwellDuration: dwellDuration || 600,
      weatherException: !!weatherException
    };

    journey.legs.push(newLeg);
    await journey.save();

    // Invalidate Redis cache
    const cacheKey = `journey:${trackingId}`;
    await redisClient.del(cacheKey);

    // Emit real-time WebSockets event
    const io = getIO();
    if (io) {
      io.emit('route:updated', {
        shipmentId: trackingId,
        status: journey.status,
        riskScore: journey.riskScore,
        appliedRouteId: 'LIVE-GPS',
        appliedRouteName: 'Live GPS Telemetry Update',
        rerouteNotes: `Live GPS Ping at [${lat.toFixed(4)}, ${lng.toFixed(4)}]`,
        timestamp: new Date().toISOString(),
        updatedLegs: journey.legs,
      });
    }

    logger.info({ trackingId, lat, lng }, 'Processed incoming telemetry ping');

    return res.status(200).json({
      status: 'success',
      message: 'Telemetry processed successfully',
      data: newLeg
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to process telemetry ping');
    return res.status(500).json({ error: 'Internal server error processing telemetry' });
  }
}
