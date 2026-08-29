import { Router } from 'express';
import { GlobalSearchController } from './search.controller';
import { requireAuth } from '../../middleware/auth';

const searchRouter = Router();

searchRouter.use(requireAuth);

searchRouter.get('/', GlobalSearchController.search);

export default searchRouter;
