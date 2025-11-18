const { DataTypes } = require('sequelize');
const { sequelize } = require('../configs/database');
const LessonVocab = require('./lessonVocab');
const Lesson = require('./lesson');
const User = require('./user');
const UserProgress = require('./userProgress');

// Associations
Lesson.hasMany(LessonVocab, { foreignKey: 'lesson_id', as: 'lesson_vocab' });
LessonVocab.belongsTo(Lesson, { foreignKey: 'lesson_id', as: 'lesson' });

User.hasMany(UserProgress, { foreignKey: 'user_id', as: 'progress' });

module.exports = {
    sequelize,
    Lesson,
    LessonVocab,
    User,
};
