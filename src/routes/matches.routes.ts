import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { swipe, getMatches, updateMatch } from '../controllers/matches.controller';

const router = Router();

router.use(authenticate);

router.post('/swipe', swipe);
router.get('/', getMatches);
router.put('/:id', updateMatch);

export default router;
