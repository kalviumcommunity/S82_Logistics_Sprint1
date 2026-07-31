/**
 * MODULE 1: MATHEMATICAL RISK EVALUATION ENGINE
 * Deterministic multi-factor risk scoring function & predictive classification.
 */

/**
 * Calculates predictive risk score, factor breakdown, status, and downstream impacts.
 * 
 * @param {Object} shipment - Shipment journey object or data
 * @param {Object} currentFacility - Current warehouse node state (queue, dwell, capacity)
 * @param {Object} nextFacility - Target/next warehouse node state
 * @param {Object} routeTelemetry - Route telemetry from Redis (weather, traffic, etc.)
 * @returns {Object} Risk calculation breakdown
 */
export function calculatePredictiveRisk(shipment = {}, currentFacility = {}, nextFacility = {}, routeTelemetry = {}) {
  // 1. Dwell Deviation Score (S_dwell)
  const actualDwell = currentFacility.actualDwell ?? currentFacility.dwellDuration ?? 0; // seconds or minutes
  const dwellTimeAvg = currentFacility.dwellTimeAvg ?? currentFacility.averageDwellTimeMinutes ?? 0;
  
  let sDwell = 0;
  if (dwellTimeAvg > 0) {
    const ratio = actualDwell / dwellTimeAvg;
    if (ratio > 1.25) {
      // Exceeds average by > 25%, scale score up aggressively towards 100
      sDwell = Math.min(100, Math.round(50 + (ratio - 1.25) * 66.67));
    } else if (ratio > 1.0) {
      sDwell = Math.min(50, Math.round((ratio - 1.0) * 200));
    } else {
      sDwell = Math.min(25, Math.round(ratio * 25));
    }
  } else if (actualDwell > 0) {
    sDwell = Math.min(100, Math.round((actualDwell / 3600) * 30));
  }

  // 2. Queue Congestion Score (S_queue)
  // Check target/next facility queue, falling back to current facility if next is not specified
  const targetNode = (nextFacility && Object.keys(nextFacility).length > 0) ? nextFacility : currentFacility;
  const currentQueueLength = targetNode.currentQueueLength ?? targetNode.queueLength ?? 0;
  const capacity = targetNode.capacity ?? 15; // default capacity standard 15 units
  const queueRatio = capacity > 0 ? currentQueueLength / capacity : 0;

  let sQueue = 0;
  if (queueRatio > 0.95) {
    sQueue = 100;
  } else if (queueRatio > 0.80) {
    sQueue = 85;
  } else {
    sQueue = Math.min(84, Math.round((queueRatio / 0.80) * 85));
  }

  // 3. Environmental Telemetry Score (S_env)
  let sEnv = 0;
  const hasWeatherException = 
    routeTelemetry.weatherException === true || 
    routeTelemetry.weatherException === 'true' || 
    routeTelemetry.weather === 'SEVERE' || 
    routeTelemetry.weather === 'STORMY' ||
    routeTelemetry.weatherAlert === 'true';

  const hasHeavyCongestion = 
    routeTelemetry.traffic === 'HEAVY' || 
    routeTelemetry.traffic === 'CONGESTED' || 
    parseFloat(routeTelemetry.congestion || 0) > 0.70;

  if (hasWeatherException) sEnv += 30;
  if (hasHeavyCongestion) sEnv += 20;

  // Additional ambient tags in Redis edge telemetry
  if (routeTelemetry.roadClosure === 'true' || routeTelemetry.delayAlert === 'true') {
    sEnv += 25;
  }
  sEnv = Math.min(100, sEnv);

  // 4. SLA Buffer Margin Score (S_sla)
  const nowMs = Date.now();
  const promisedSlaEta = shipment.promisedSlaEta ? new Date(shipment.promisedSlaEta).getTime() : 
                         shipment.estimatedDelivery ? new Date(shipment.estimatedDelivery).getTime() : 
                         (nowMs + 7200000); // 2 hours default SLA window

  // Calculate estimated transit time remaining
  const remainingTransitMs = shipment.remainingTransitMs ?? 3600000; // 1 hour default remaining transit
  const projectedArrivalMs = nowMs + remainingTransitMs;
  const delayMs = projectedArrivalMs - promisedSlaEta;
  const delayMinutes = delayMs / (1000 * 60);

  let sSla = 0;
  if (delayMinutes > 0) {
    // Exponential scaling when projected ETA breaches SLA margin
    sSla = Math.min(100, Math.round(Math.pow(delayMinutes / 10, 1.8) * 20 + 20));
  } else if (delayMinutes > -15) {
    // Tight buffer (< 15 mins left before breach)
    sSla = Math.round((15 + delayMinutes) * 2);
  }

  // Weights
  const wd = 0.25;
  const wq = 0.35;
  const we = 0.20;
  const ws = 0.20;

  const rawWeightedScore = (wd * sDwell) + (wq * sQueue) + (we * sEnv) + (ws * sSla);
  const overallRiskScore = Math.min(100, Math.max(0, Math.round(rawWeightedScore)));

  // Risk Classification
  let status = 'SAFE';
  if (overallRiskScore >= 70) {
    status = 'DELAYED'; // Cascading Risk
  } else if (overallRiskScore >= 40) {
    status = 'AT_RISK';
  }

  // Delay Projection in Minutes
  const predictedDelayMinutes = Math.max(
    0,
    Math.round((overallRiskScore / 100) * 90 + (sSla > 0 ? delayMinutes : 0))
  );

  // Impacted Downstream Nodes
  const impactedDownstreamNodes = [];
  if (nextFacility.warehouseId || nextFacility.name) {
    impactedDownstreamNodes.push({
      nodeId: nextFacility.warehouseId || nextFacility.id || 'NEXT-HUB',
      name: nextFacility.name || 'Target Warehouse',
      predictedBottleneckSeverity: overallRiskScore >= 70 ? 'CRITICAL' : overallRiskScore >= 40 ? 'MODERATE' : 'LOW',
      queueCongestion: `${Math.round(queueRatio * 100)}%`,
    });
  }

  return {
    overallRiskScore,
    status,
    factors: {
      dwellScore: Math.round(sDwell),
      queueScore: Math.round(sQueue),
      envScore: Math.round(sEnv),
      slaScore: Math.round(sSla),
    },
    predictedDelayMinutes,
    impactedDownstreamNodes,
  };
}

export default {
  calculatePredictiveRisk,
};
