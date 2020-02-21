import * as Yup from 'yup';

import DeliveryProblem from '../models/DeliveryProblem';
import Delivery from '../models/Delivery';

class DeliveryProblemController {
  async store(request, response) {
    const schema = Yup.object().shape({
      delivery_id: Yup.number().required(),
      description: Yup.string().required(),
    });

    const {
      body: { description },
      params: { delivery_id },
    } = request;

    if (!(await schema.isValid({ delivery_id, description }))) {
      return response.status(400).json({ error: 'Validation fails.' });
    }

    const delivery = await Delivery.findByPk(delivery_id);

    if (!delivery) {
      return response.status(400).json({
        error: `Delivery with id = ${delivery_id} doesn't exists.`,
      });
    }

    if (!delivery.start_date) {
      return response.status(400).json({
        error: `Delivery with id = ${delivery_id} has not been retrieved yet.`,
      });
    }

    if (delivery.cancelled_at) {
      return response.status(400).json({
        error: `Delivery with id = ${delivery_id} has already been cancelled.`,
      });
    }

    const { id } = await DeliveryProblem.create({ delivery_id, description });

    return response.json({ id, delivery_id, description });
  }
}

export default new DeliveryProblemController();
