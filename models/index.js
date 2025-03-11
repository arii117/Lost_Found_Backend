const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize(process.env.MYSQL_URI); // Use your MySQL URI

const LostItem = sequelize.define('LostItem', {
  name: { type: DataTypes.STRING, allowNull: false },
  rollNo: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false },
  phoneNo: { type: DataTypes.STRING, allowNull: false },
  itemName: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.STRING, allowNull: false },
  date: { type: DataTypes.DATE, allowNull: false },
  roomNo: { type: DataTypes.STRING },
  image: { type: DataTypes.STRING },
  urgent: { type: DataTypes.BOOLEAN },
});

const FoundItem = sequelize.define('FoundItem', {
  itemName: { type: DataTypes.STRING, allowNull: false },
  image: { type: DataTypes.STRING, allowNull: false },
  date: { type: DataTypes.DATE, allowNull: false },
  roomNo: { type: DataTypes.STRING, allowNull: false },
});

sequelize.sync();

module.exports = { LostItem, FoundItem, sequelize };
