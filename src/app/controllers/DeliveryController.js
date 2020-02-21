import { Op } from 'sequelize';

import Delivery from '../models/Delivery';
import Recipient from '../models/Recipient';
import Deliveryman from '../models/Deliveryman';
import File from '../models/File';

class DeliveryController {
  async index(request, response) {
    const {
      params: { deliveryman_id },
      query: { page = 1, delivered = false },
    } = request;

    const deliveries = await Delivery.findAll({
      where: {
        deliveryman_id,
        cancelled_at: null,
        end_date: delivered ? { [Op.ne]: null } : null,
      },
      attributes: ['id', 'product', 'cancelled_at', 'start_date', 'end_date'],
      limit: 20,
      offset: (page - 1) * 20,
      include: [
        {
          model: Recipient,
          as: 'recipient',
          attributes: [
            'name',
            'street',
            'street_number',
            'complement',
            'state',
            'city',
            'zip_code',
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

    return response.json(deliveries);
  }
}

export default new DeliveryController();
