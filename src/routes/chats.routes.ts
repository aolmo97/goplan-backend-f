import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { getChats, getChatMessages, sendMessage, markRead } from '../controllers/chats.controller';

const router = Router();

router.use(authenticate);

router.get('/', getChats);
router.get('/:id/messages', getChatMessages);
router.post('/:id/messages', sendMessage);
router.put('/:id/read', markRead);

export default router;
