import Sequelize, { Model } from 'sequelize';

class Recipient extends Model {
  static init(sequelize) {
    super.init(
      {
        name: Sequelize.STRING,
        street: Sequelize.STRING,
        street_number: Sequelize.INTEGER,
        complement: Sequelize.STRING,
        state: Sequelize.STRING,
        city: Sequelize.STRING,
        zip_code: Sequelize.INTEGER,
        full_address: {
          type: Sequelize.VIRTUAL,
          get() {
            return `${this.street}, ${this.street_number}, ${this.complement} - ${this.city} - ${this.state} - ${this.zip_code}`;
          },
        },
      },
      {
        sequelize,
      }
    );

    return this;
  }
}

export default Recipient;
