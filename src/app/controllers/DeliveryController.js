import { Op } from 'sequelize';

import Delivery from '../models/Delivery';
import Recipient from '../models/Recipient';
import Deliveryman from '../models/Deliveryman';
import File from '../models/File';

const { PAGE_SIZE } = process.env;

class DeliveryController {
  async index(request, response) {
    const {
      params: { deliveryman_id },
      query: { page = 1, delivered = false },
    } = request;

    const { count, rows: deliveries } = await Delivery.findAndCountAll({
      where: {
        deliveryman_id,
        cancelled_at: null,
        end_date: delivered ? { [Op.ne]: null } : null,
      },
      attributes: [
        'id',
        'product',
        'cancelled_at',
        'start_date',
        'end_date',
        'created_at',
      ],
      order: [['end_date', 'DESC'], ['start_date', 'ASC'], 'id'],
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
      include: [
        {
          model: Recipient,
          as: 'recipient',
          attributes: [
            'name',
            'street',
            'street_number',
            'complement',
            'city',
            'state',
            'zip_code',
            'full_address',
          ],
        },
        {
          model: Deliveryman,
          as: 'deliveryman',
          attributes: ['name', 'email'],
          include: [
            {
              model: File,
              as: 'avatar',
              attributes: ['name', 'path', 'url'],
            },
          ],
        },
        {
          model: File,
          as: 'signature',
          attributes: ['name', 'path', 'url'],
        },
      ],
    });

    const pages = Math.floor(count / PAGE_SIZE);
    const remainder = count % PAGE_SIZE;

    return response.json({
      pages: !remainder ? pages : pages + 1,
      deliveries,
    });
  }
}

export default new DeliveryController();
