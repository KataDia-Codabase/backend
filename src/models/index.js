const { DataTypes } = require('sequelize');
const { sequelize } = require('../configs/database');
const LessonVocab = require('./lessonVocab');
const Lesson = require('./lesson');

// Associations
Lesson.hasMany(LessonVocab, { foreignKey: 'lesson_id', as: 'lesson_vocab' });
LessonVocab.belongsTo(Lesson, { foreignKey: 'lesson_id', as: 'lesson' });

module.exports = {
    sequelize,
    Lesson,
    LessonVocab,
};
