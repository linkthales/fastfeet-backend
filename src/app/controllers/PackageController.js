import * as Yup from 'yup';

import Delivery from '../models/Delivery';

class PackageController {
  async update(request, response) {
    const schema = Yup.object().shape({
      signature_id: Yup.number().required(),
    });

    const {
      params: { deliveryman_id, delivery_id },
      body: { signature_id },
    } = request;

    if (!(await schema.isValid({ signature_id }))) {
      return response.status(400).json({ error: 'Validation fails.' });
    }

    const delivery = await Delivery.findByPk(delivery_id);

    if (!delivery) {
      return response.status(400).json({
        error: `Delivery with id = ${delivery_id} doesn't exists.`,
      });
    }

    if (delivery.deliveryman_id !== Number(deliveryman_id)) {
      return response.status(401).json({
        error: `You don't have permission to deliver this package.`,
      });
    }

    if (delivery.cancelled_at) {
      return response.status(401).json({
        error: `You cannot deliver a package that has been cancelled.`,
      });
    }

    if (!delivery.start_date) {
      return response.status(401).json({
        error: `Package has not been retrieved yet.`,
      });
    }

    if (delivery.end_date) {
      return response.status(401).json({
        error: `You cannot deliver twice a package.`,
      });
    }

    await delivery.update({ signature_id, end_date: new Date() });

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

export default new PackageController();
