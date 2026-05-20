import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { getEvents, getEventById, createEvent, attendEvent } from '../controllers/events.controller';

const router = Router();

router.use(authenticate);

router.get('/', getEvents);
router.get('/:id', getEventById);
router.post('/', requireRole('COMPANY', 'ADMIN'), createEvent);
router.post('/:id/attend', attendEvent);

export default router;
