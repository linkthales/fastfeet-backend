import * as Yup from 'yup';
import { Op } from 'sequelize';

import Delivery from '../models/Delivery';
import DeliveryProblem from '../models/DeliveryProblem';
import Recipient from '../models/Recipient';
import Deliveryman from '../models/Deliveryman';
import File from '../models/File';

import Queue from '../../lib/Queue';
import ConfirmationMail from '../jobs/ConfirmationMail';

class ManageDeliveryController {
  async index(request, response) {
    const { q = '', page = 1, onlyWithProblem = false } = request.query;

    const deliveries = await Delivery.findAll({
      where: {
        product: { [Op.iLike]: `%${q}%` },
      },
      attributes: ['id', 'product', 'cancelled_at', 'start_date', 'end_date'],
      limit: 20,
      offset: (page - 1) * 20,
      include: [
        {
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

    if (onlyWithProblem) {
      return response.json(
        deliveries.filter(delivery => delivery.problems.length)
      );
    }

    return response.json(deliveries);
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
      recipient: {
        name: recipientName,
        street,
        street_number,
        complement,
        state,
        city,
        zip_code,
      },
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
            'state',
            'city',
            'zip_code',
          ],
        },
      ],
    });

    const fullAddress = `${street}, ${street_number} ${
      complement ? ` - ${complement}` : ''
    } - ${state} - ${city} ${zip_code}`;

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
