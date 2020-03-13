import * as Yup from 'yup';
import { Op } from 'sequelize';

import Deliveryman from '../models/Deliveryman';
import File from '../models/File';

const { PAGE_SIZE } = process.env;

class ManageDeliverymanController {
  async index(request, response) {
    const { id = null, q = '', page = 1, getAll = false } = request.query;

    const { count, rows: deliverymans } = await Deliveryman.findAndCountAll({
      distinct: true,
      where: {
        id: id || { [Op.ne]: null },
        name: { [Op.iLike]: `%${q}%` },
      },
      attributes: ['id', 'name', 'email', 'avatar_id'],
      order: ['id'],
      limit: getAll ? undefined : PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
      include: [
        {
          model: File,
          as: 'avatar',
          attributes: ['id', 'name', 'path', 'url'],
        },
      ],
    });

    const pages = Math.floor(count / PAGE_SIZE);
    const remainder = count % PAGE_SIZE;

    return response.json({
      pages: !remainder ? pages : pages + 1,
      deliverymans,
    });
  }

  async store(request, response) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string()
        .email()
        .required(),
    });

    if (!(await schema.isValid(request.body))) {
      return response.status(400).json({ error: 'Validation fails.' });
    }

    const { email } = request.body;

    const deliverymanExists = await Deliveryman.findOne({
      where: { email },
    });

    if (deliverymanExists) {
      return response
        .status(400)
        .json({ error: 'Deliveryman already exists.' });
    }

    const { id, name } = await Deliveryman.create(request.body);

    return response.json({
      id,
      name,
      email,
    });
  }

  async update(request, response) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string().required(),
    });

    if (!(await schema.isValid(request.body))) {
      return response.status(400).json({ error: 'Validation fails.' });
    }

    const {
      params: { deliveryman_id },
      body: { avatar_id },
    } = request;

    const deliveryman = await Deliveryman.findByPk(deliveryman_id);

    if (!deliveryman) {
      return response.status(400).json({
        error: `Deliveryman with id = ${deliveryman_id} doesn't exists.`,
      });
    }

    if (avatar_id) {
      const avatar = await File.findByPk(avatar_id);

      if (!avatar) {
        return response.status(400).json({
          error: `Avatar with id = ${avatar_id} doesn't exists.`,
        });
      }
    }

    await deliveryman.update(request.body);

    const { id, name, email } = await Deliveryman.findByPk(deliveryman_id);

    return response.json({
      id,
      name,
      email,
    });
  }

  async delete(request, response) {
    const { deliveryman_id } = request.params;

    const deliveryman = await Deliveryman.findByPk(deliveryman_id, {
      attributes: ['id', 'name', 'email', 'avatar_id'],
      include: [
        {
          model: File,
          as: 'avatar',
          attributes: ['name', 'path', 'url'],
        },
      ],
    });

    if (!deliveryman) {
      return response.status(400).json({
        error: `Deliveryman with id = ${deliveryman_id} doesn't exists.`,
      });
    }

    const { id, name, email, avatar } = deliveryman;

    await deliveryman.destroy();

    return response.json({ id, name, email, avatar });
  }
}

export default new ManageDeliverymanController();
