import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import {
  getFeed,
  getSwipeFeed,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
  getPlanRequests
} from '../controllers/plans.controller';

const router = Router();

router.use(authenticate);

router.get('/', getFeed);
router.get('/swipe', getSwipeFeed);
router.get('/:id', getPlanById);
router.get('/:id/requests', getPlanRequests);
router.post('/', createPlan);
router.put('/:id', updatePlan);
router.delete('/:id', deletePlan);

export default router;
