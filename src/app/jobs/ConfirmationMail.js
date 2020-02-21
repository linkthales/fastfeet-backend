import Mail from '../../lib/Mail';

class ConfirmationMail {
  get key() {
    return 'ConfirmationMail';
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
      subject: 'Package registered for delivery',
      template: 'confirmation',
      context: {
        deliverymanName,
        recipientName,
        product,
        fullAddress,
      },
    });
  }
}

export default new ConfirmationMail();
