import * as Yup from 'yup';
import { Op } from 'sequelize';

import Delivery from '../models/Delivery';
import DeliveryProblem from '../models/DeliveryProblem';
import Recipient from '../models/Recipient';
import Deliveryman from '../models/Deliveryman';
import File from '../models/File';

import Queue from '../../lib/Queue';
import ConfirmationMail from '../jobs/ConfirmationMail';

const { PAGE_SIZE } = process.env;

class ManageDeliveryController {
  async index(request, response) {
    const {
      id = null,
      q = '',
      page = 1,
      onlyWithProblem = false,
    } = request.query;

    const { count, rows: deliveries } = await Delivery.findAndCountAll({
      distinct: true,
      where: {
        id: id || { [Op.ne]: null },
        product: { [Op.iLike]: `%${q}%` },
      },
      attributes: [
        'id',
        'recipient_id',
        'deliveryman_id',
        'product',
        'cancelled_at',
        'start_date',
        'end_date',
      ],
      order: ['id'],
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
      include: [
        onlyWithProblem
          ? {
              model: DeliveryProblem,
              as: 'problems',
              where: {
                id: { [Op.ne]: null },
              },
              attributes: ['id', 'description'],
            }
          : {
              model: DeliveryProblem,
              as: 'problems',
              attributes: ['id', 'description'],
            },
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

    const deliveriesWithProblems = deliveries.map(delivery =>
      delivery.problems
        ? {
            ...delivery.dataValues,
            last_problem: delivery.problems[delivery.problems.length - 1],
          }
        : { ...delivery.dataValues }
    );

    const pages = Math.floor(count / PAGE_SIZE);
    const remainder = count % PAGE_SIZE;

    return response.json({
      pages: !remainder ? pages : pages + 1,
      deliveries: deliveriesWithProblems,
    });
  }

  async store(request, response) {
    const schema = Yup.object().shape({
      product: Yup.string().required(),
      recipient_id: Yup.number().required(),
      deliveryman_id: Yup.number().required(),
    });

    if (!(await schema.isValid(request.body))) {
      return response.status(400).json({ error: 'Validation fails.' });
    }

    const { id, product, recipient_id, deliveryman_id } = await Delivery.create(
      request.body
    );

    const {
      deliveryman: { name: deliverymanName, email },
      recipient: { name: recipientName, full_address: fullAddress },
    } = await Delivery.findByPk(id, {
      include: [
        {
          model: Deliveryman,
          as: 'deliveryman',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: Recipient,
          as: 'recipient',
          attributes: [
            'id',
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
      ],
    });

    await Queue.add(ConfirmationMail.key, {
      deliverymanName,
      email,
      recipientName,
      product,
      fullAddress,
    });

    return response.json({
      id,
      product,
      recipient_id,
      deliveryman_id,
    });
  }

  async update(request, response) {
    const schema = Yup.object().shape({
      product: Yup.string().required(),
      recipient_id: Yup.number().required(),
      deliveryman_id: Yup.number().required(),
    });

    if (!(await schema.isValid(request.body))) {
      return response.status(400).json({ error: 'Validation fails.' });
    }

    const { delivery_id } = request.params;

    const delivery = await Delivery.findByPk(delivery_id);

    if (!delivery) {
      return response.status(400).json({
        error: `Delivery with id = ${delivery_id} doesn't exists.`,
      });
    }

    await delivery.update(request.body);

    const {
      id,
      product,
      recipient_id,
      deliveryman_id,
    } = await Delivery.findByPk(delivery_id);

    return response.json({
      id,
      product,
      recipient_id,
      deliveryman_id,
    });
  }

  async delete(request, response) {
    const { delivery_id } = request.params;

    const delivery = await Delivery.findByPk(delivery_id, {
      attributes: ['id', 'product'],
    });

    if (!delivery) {
      return response.status(400).json({
        error: `Deliveryman with id = ${delivery_id} doesn't exists.`,
      });
    }

    const { id, product } = delivery;

    await delivery.destroy();

    return response.json({
      id,
      product,
    });
  }
}

export default new ManageDeliveryController();
