import DeliveryProblem from '../models/DeliveryProblem';
import Delivery from '../models/Delivery';
import Deliveryman from '../models/Deliveryman';
import Recipient from '../models/Recipient';

import Queue from '../../lib/Queue';
import CancellationMail from '../jobs/CancellationMail';

class ManageDeliveryProblemController {
  async delete(request, response) {
    const { problem_id } = request.params;

    const deliveryProblem = await DeliveryProblem.findByPk(problem_id, {
      attributes: ['delivery_id'],
      include: [
        {
          model: Delivery,
          as: 'delivery',
          attributes: [
            'id',
            'deliveryman_id',
            'product',
            'end_date',
            'cancelled_at',
          ],
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
        },
      ],
    });

    if (!deliveryProblem) {
      return response.status(400).json({
        error: `DeliveryProblem with id = ${problem_id} doesn't exists.`,
      });
    }

    const { delivery } = deliveryProblem;

    if (!delivery) {
      return response.status(400).json({
        error: `Delivery doesn't exists.`,
      });
    }

    if (delivery.end_date) {
      return response.status(400).json({
        error: `Delivery with id = ${delivery.id} is already delivered.`,
      });
    }

    if (delivery.cancelled_at) {
      return response.status(400).json({
        error: `Delivery with id = ${delivery.id} is already cancelled.`,
      });
    }

    const { id, product, cancelled_at } = await delivery.update({
      cancelled_at: new Date(),
    });

    const {
      deliveryman: { name: deliverymanName, email },
      recipient: { name: recipientName, full_address: fullAddress },
    } = delivery;

    await Queue.add(CancellationMail.key, {
      deliverymanName,
      email,
      recipientName,
      product,
      fullAddress,
    });

    return response.json({ id, product, cancelled_at });
  }
}

export default new ManageDeliveryProblemController();
