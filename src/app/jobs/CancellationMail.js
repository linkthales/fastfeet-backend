import Mail from '../../lib/Mail';

class CancellationMail {
  get key() {
    return 'CancellationMail';
  }

  async handle({ data }) {
    const {
      deliverymanName,
      email,
      recipientName,
      product,
      fullAddress,
    } = data;

    await Mail.sendMail({
      to: `${deliverymanName} <${email}>`,
      subject: 'Package delivery cancelled',
      template: 'cancellation',
      context: {
        deliverymanName,
        recipientName,
        product,
        fullAddress,
      },
    });
  }
}

export default new CancellationMail();
