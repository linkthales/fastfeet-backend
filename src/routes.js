import { Router } from 'express';
import multer from 'multer';
import multerConfig from './config/multer';

import SessionController from './app/controllers/SessionController';
import FileController from './app/controllers/FileController';
import ManageRecipientController from './app/controllers/ManageRecipientController';
import ManageDeliverymanController from './app/controllers/ManageDeliverymanController';
import ManageDeliveryController from './app/controllers/ManageDeliveryController';
import ManageDeliveryProblemController from './app/controllers/ManageDeliveryProblemController';
import DeliveryController from './app/controllers/DeliveryController';
import OrderController from './app/controllers/OrderController';
import PackageController from './app/controllers/PackageController';
import DeliveryProblemController from './app/controllers/DeliveryProblemController';

import authMiddleware from './app/middlewares/auth';

const routes = new Router();
const upload = multer(multerConfig);

routes.get('/', async (request, response) => {
  return response.json('Lulu server is on.');
});

routes.post('/sessions', SessionController.store);

routes.post('/files', upload.single('file'), FileController.store);

routes.put(
  '/deliverymans/:deliveryman_id/retrieve/:delivery_id',
  OrderController.update
);

routes.put(
  '/deliverymans/:deliveryman_id/deliver/:delivery_id',
  PackageController.update
);

routes.get(
  '/deliverymans/:deliveryman_id/deliveries',
  DeliveryController.index
);

routes.post('/delivery/:delivery_id/problems', DeliveryProblemController.store);

routes.use(authMiddleware);

routes.get('/manage-recipients', ManageRecipientController.index);
routes.post('/manage-recipients', ManageRecipientController.store);
routes.put(
  '/manage-recipients/:recipient_id',
  ManageRecipientController.update
);
routes.delete(
  '/manage-recipients/:recipient_id',
  ManageRecipientController.delete
);

routes.get('/manage-deliverymans', ManageDeliverymanController.index);
routes.post('/manage-deliverymans', ManageDeliverymanController.store);
routes.put(
  '/manage-deliverymans/:deliveryman_id',
  ManageDeliverymanController.update
);
routes.delete(
  '/manage-deliverymans/:deliveryman_id',
  ManageDeliverymanController.delete
);

routes.get('/manage-deliveries', ManageDeliveryController.index);
routes.post('/manage-deliveries', ManageDeliveryController.store);
routes.put('/manage-deliveries/:delivery_id', ManageDeliveryController.update);
routes.delete(
  '/manage-deliveries/:delivery_id',
  ManageDeliveryController.delete
);

routes.get(
  '/manage-deliveries/:delivery_id/problems',
  ManageDeliveryProblemController.index
);
routes.delete(
  '/manage-deliveries/:problem_id/cancel-delivery',
  ManageDeliveryProblemController.delete
);

export default routes;
