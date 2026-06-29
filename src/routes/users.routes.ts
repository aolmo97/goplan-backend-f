import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import {
  getMe,
  updateMe,
  getUserById,
  toggleFollow,
  getMyPlans,
  getJoinedPlans,
  saveFcmToken
} from '../controllers/users.controller';

const router = Router();

router.use(authenticate);

router.get('/me', getMe);
router.put('/me', updateMe);
router.post('/fcm-token', saveFcmToken);
router.get('/me/plans', getMyPlans);
router.get('/me/joined', getJoinedPlans);
router.get('/:id', getUserById);
router.post('/:id/follow', toggleFollow);

export default router;
