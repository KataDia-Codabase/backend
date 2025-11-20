const { DataTypes } = require('sequelize');
const { sequelize } = require('../configs/database');
const LessonVocab = require('./lessonVocab');
const Lesson = require('./lesson');
const User = require('./user');
const UserProgress = require('./userProgress');
const PronunciationSubmission = require('./pronunciationSubmission');

// Associations
Lesson.hasMany(LessonVocab, { foreignKey: 'lesson_id', as: 'lesson_vocab' });
LessonVocab.belongsTo(Lesson, { foreignKey: 'lesson_id', as: 'lesson' });

User.hasMany(UserProgress, { foreignKey: 'user_id', as: 'progress' });
User.hasMany(PronunciationSubmission, {
    foreignKey: 'user_id',
    as: 'pronunciations',
});
UserProgress.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
PronunciationSubmission.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
LessonVocab.hasMany(PronunciationSubmission, {
    foreignKey: 'lesson_vocab_id',
    as: 'submissions',
});
PronunciationSubmission.belongsTo(LessonVocab, {
    foreignKey: 'lesson_vocab_id',
    as: 'lesson_vocab',
});

module.exports = {
    sequelize,
    Lesson,
    LessonVocab,
    User,
    PronunciationSubmission,
    UserProgress,
};
