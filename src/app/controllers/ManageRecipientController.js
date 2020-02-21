import * as Yup from 'yup';
import { Op } from 'sequelize';

import Recipient from '../models/Recipient';

class ManageRecipientController {
  async index(request, response) {
    const { q = '', page = 1 } = request.query;

    const recipients = await Recipient.findAll({
      where: {
        product: { [Op.iLike]: `%${q}%` },
      },
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
      limit: 20,
      offset: (page - 1) * 20,
    });

    return response.json(recipients);
  }

  async store(request, response) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      street: Yup.string().required(),
      street_number: Yup.number().required(),
      complement: Yup.string(),
      state: Yup.string().required(),
      city: Yup.string().required(),
      zip_code: Yup.number().required(),
    });

    if (!(await schema.isValid(request.body))) {
      return response.status(400).json({ error: 'Validation fails.' });
    }

    const recipientExists = await Recipient.findOne({
      where: { name: request.body.name },
    });

    if (recipientExists) {
      return response.status(400).json({ error: 'Recipient already exists.' });
    }

    const {
      id,
      name,
      street,
      street_number,
      complement,
      state,
      city,
      zip_code,
    } = await Recipient.create(request.body);

    return response.json({
      id,
      name,
      street,
      street_number,
      complement,
      state,
      city,
      zip_code,
    });
  }

  async update(request, response) {
    const schema = Yup.object().shape({
      name: Yup.string(),
      street: Yup.string(),
      street_number: Yup.number(),
      complement: Yup.string(),
      state: Yup.string(),
      city: Yup.string(),
      zip_code: Yup.number(),
    });

    if (!(await schema.isValid(request.body))) {
      return response.status(400).json({ error: 'Validation fails.' });
    }

    const recipient = await Recipient.findByPk(request.params.recipient_id);

    await recipient.update(request.body);

    const {
      id,
      name,
      street,
      street_number,
      complement,
      state,
      city,
      zip_code,
    } = await Recipient.findByPk(request.params.recipient_id);

    return response.json({
      id,
      name,
      street,
      street_number,
      complement,
      state,
      city,
      zip_code,
    });
  }

  async delete(request, response) {
    const { delivery_id: recipient_id } = request.params;

    const recipient = await Recipient.findByPk(recipient_id, {
      attributes: ['id', 'product'],
    });

    if (!recipient) {
      return response.status(400).json({
        error: `Recipient with id = ${recipient_id} doesn't exists.`,
      });
    }

    const {
      id,
      name,
      street,
      street_number,
      complement,
      state,
      city,
      zip_code,
    } = recipient;

    await recipient.destroy();
    return response.json({
      id,
      name,
      street,
      street_number,
      complement,
      state,
      city,
      zip_code,
    });
  }
}

export default new ManageRecipientController();
