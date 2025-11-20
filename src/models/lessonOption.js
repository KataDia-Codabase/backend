const { DataTypes } = require('sequelize');
const db = require('../configs/database.js');

const LessonOption = db.define('lesson_options', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  question_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'lesson_questions',
      key: 'id',
    }
  },
  option_text: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  is_correct: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  timestamps: false,
  freezeTableName: true,
});

module.exports = LessonOption;