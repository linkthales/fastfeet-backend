import {
  isAfter,
  isBefore,
  setHours,
  startOfDay,
  endOfDay,
  startOfHour,
} from 'date-fns';

import { Op } from 'sequelize';
import Delivery from '../models/Delivery';

class OrderController {
  async update(request, response) {
    const { deliveryman_id, delivery_id } = request.params;

    const retrievedPackagesToday = await Delivery.findAll({
      where: {
        deliveryman_id,
        start_date: {
          [Op.and]: {
            [Op.gt]: startOfDay(new Date()),
            [Op.lt]: endOfDay(new Date()),
          },
        },
      },
      attributes: ['id'],
      limit: 5,
    });

    if (retrievedPackagesToday.length > 4) {
      return response.status(400).json({
        error: `You can only retrieve 5 packages per day.`,
      });
    }

    const delivery = await Delivery.findByPk(delivery_id);

    if (!delivery) {
      return response.status(400).json({
        error: `Delivery with id = ${delivery_id} doesn't exists.`,
      });
    }

    if (delivery.deliveryman_id !== Number(deliveryman_id)) {
      return response.status(401).json({
        error: `You don't have permission to retrieve this package.`,
      });
    }

    if (delivery.start_date) {
      return response.status(401).json({
        error: `You cannot retrieve twice a package.`,
      });
    }

    if (
      isBefore(new Date(), startOfHour(setHours(new Date(), 8))) ||
      isAfter(new Date(), startOfHour(setHours(new Date(), 18)))
    ) {
      return response.status(401).json({
        error: `You can only retrieve a package from 08:00 to 18:00h.`,
      });
    }

    await delivery.update({ start_date: new Date() });

    const { id, product, start_date, end_date } = await Delivery.findByPk(
      delivery_id
    );

    return response.json({
      id,
      product,
      start_date,
      end_date,
    });
  }
}

export default new OrderController();
