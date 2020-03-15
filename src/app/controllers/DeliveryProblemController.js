import * as Yup from 'yup';

import DeliveryProblem from '../models/DeliveryProblem';
import Delivery from '../models/Delivery';

const { PAGE_SIZE } = process.env;

class DeliveryProblemController {
  async index(request, response) {
    const {
      params: { delivery_id },
      query: { page = 1 },
    } = request;

    const { count, rows: deliveries } = await DeliveryProblem.findAndCountAll({
      where: {
        delivery_id,
      },
      attributes: ['id', 'delivery_id', 'description', 'created_at'],
      order: [['created_at', 'DESC']],
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
    });

    const pages = Math.floor(count / PAGE_SIZE);
    const remainder = count % PAGE_SIZE;

    return response.json({
      pages: !remainder ? pages : pages + 1,
      problems: deliveries,
    });
  }

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
