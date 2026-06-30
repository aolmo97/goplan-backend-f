import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { getNotifications } from '../controllers/notifications.controller';

const router = Router();

router.use(authenticate);
router.get('/', getNotifications);

export default router;
