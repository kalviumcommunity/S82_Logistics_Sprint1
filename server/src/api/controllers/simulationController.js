import { runRerouteSimulation, applyReroute } from '../../services/simulationEngine.js';
import logger from '../../config/logger.js';

/**
 * POST /api/v1/simulations/run
 * Protected (ADMIN, OPERATIONS_MANAGER)
 * Evaluates What-If reroute paths using prescriptive optimization model
 */
export async function runSimulationController(req, res, next) {
  try {
    const { shipmentId, candidateRouteIds } = req.body;

    if (!shipmentId) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required field: shipmentId',
      });
    }

    const simulationResult = await runRerouteSimulation(shipmentId, candidateRouteIds);

    return res.status(200).json({
      status: 'success',
      ...simulationResult,
    });
  } catch (error) {
    logger.error(error, 'Error in runSimulationController');
    next(error);
  }
}

/**
 * POST /api/v1/simulations/apply
 * Protected (ADMIN, OPERATIONS_MANAGER)
 * Atomically updates shipment journey, clears Redis cache, and emits Socket.IO event
 */
export async function applySimulationController(req, res, next) {
  try {
    const { shipmentId, selectedRouteId, rerouteNotes } = req.body;

    if (!shipmentId || !selectedRouteId) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required parameters: shipmentId and selectedRouteId',
      });
    }

    const result = await applyReroute(shipmentId, selectedRouteId, rerouteNotes);

    return res.status(200).json(result);
  } catch (error) {
    logger.error(error, 'Error in applySimulationController');
    next(error);
  }
}

export default {
  runSimulationController,
  applySimulationController,
};
