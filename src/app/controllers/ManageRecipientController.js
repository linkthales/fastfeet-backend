import * as Yup from 'yup';
import { Op } from 'sequelize';

import Recipient from '../models/Recipient';

const { PAGE_SIZE } = process.env;

class ManageRecipientController {
  async index(request, response) {
    const { id = null, q = '', page = 1, getAll = false } = request.query;

    const { count, rows: recipients } = await Recipient.findAndCountAll({
      where: {
        id: id || { [Op.ne]: null },
        name: { [Op.iLike]: `%${q}%` },
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
        'full_address',
      ],
      order: ['id'],
      limit: getAll ? undefined : PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
    });

    const pages = Math.floor(count / PAGE_SIZE);
    const remainder = count % PAGE_SIZE;

    return response.json({ pages: !remainder ? pages : pages + 1, recipients });
  }

  async store(request, response) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      street: Yup.string().required(),
      street_number: Yup.number().required(),
      complement: Yup.string(),
      state: Yup.string().required(),
      city: Yup.string().required(),
      zip_code: Yup.string()
        .length(9)
        .required(),
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
      zip_code: Yup.string().length(9),
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
    const { recipient_id } = request.params;

    const recipient = await Recipient.findByPk(recipient_id, {
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
