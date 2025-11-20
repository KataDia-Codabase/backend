const db = require('../configs/database.js');

// ==========================================
// 1. IMPORT SEMUA MODEL
// ==========================================

// Core
const User = require('./User');

// Standard Lessons
const Lesson = require('./Lesson');
const LessonContent = require('./lessonContent');
const LessonQuestion = require('./lessonQuestion');
const LessonOption = require('./lessonOption');
const LessonSpeakingAttempt = require('./LessonSpeakingAttempt');
const UserLessonProgress = require('./UserLessonProgress');

// CEFR Assessment
const CefrTest = require('./cefrTest');
const CefrQuestion = require('./cefrQuestion');
const CefrOption = require('./cefrOption');
const UserCefrResult = require('./userCefrResult');
const UserCefrAnswer = require('./userCefrAnswer');
const UserCefrSpeaking = require('./userCefrSpeaking');

// ==========================================
// 2. DEFINISI RELASI (ASSOCIATIONS)
// ==========================================

// --- A. STANDARD LESSONS RELATIONS ---

// Lesson <-> LessonContent (One-to-Many)
Lesson.hasMany(LessonContent, { foreignKey: 'lesson_id', as: 'contents' });
LessonContent.belongsTo(Lesson, { foreignKey: 'lesson_id', as: 'lesson' });

// LessonContent <-> LessonQuestion (One-to-Many)
// Konten (bacaan/audio) bisa punya banyak pertanyaan
LessonContent.hasMany(LessonQuestion, {
    foreignKey: 'lesson_content_id',
    as: 'questions',
});
LessonQuestion.belongsTo(LessonContent, {
    foreignKey: 'lesson_content_id',
    as: 'content',
});

// LessonQuestion <-> LessonOption (One-to-Many)
// Satu pertanyaan punya banyak pilihan jawaban (A, B, C, D)
LessonQuestion.hasMany(LessonOption, {
    foreignKey: 'question_id',
    as: 'options',
});
LessonOption.belongsTo(LessonQuestion, {
    foreignKey: 'question_id',
    as: 'question',
});

// User <-> LessonSpeakingAttempt (One-to-Many)
// User bisa melakukan banyak percobaan speaking
User.hasMany(LessonSpeakingAttempt, {
    foreignKey: 'user_id',
    as: 'speaking_attempts',
});
LessonSpeakingAttempt.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Lesson <-> LessonSpeakingAttempt (One-to-Many)
// Satu lesson speaking bisa dicoba berkali-kali
Lesson.hasMany(LessonSpeakingAttempt, {
    foreignKey: 'lesson_id',
    as: 'attempts',
});
LessonSpeakingAttempt.belongsTo(Lesson, {
    foreignKey: 'lesson_id',
    as: 'lesson',
});

// User & Lesson <-> UserLessonProgress (Many-to-Many via UserLessonProgress)
User.hasMany(UserLessonProgress, { foreignKey: 'user_id', as: 'progress' });
UserLessonProgress.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Lesson.hasMany(UserLessonProgress, {
    foreignKey: 'lesson_id',
    as: 'user_progress',
});
UserLessonProgress.belongsTo(Lesson, { foreignKey: 'lesson_id', as: 'lesson' });

// --- B. CEFR ASSESSMENT RELATIONS ---

// CefrTest <-> CefrQuestion (One-to-Many)
CefrTest.hasMany(CefrQuestion, { foreignKey: 'cefr_test_id', as: 'questions' });
CefrQuestion.belongsTo(CefrTest, { foreignKey: 'cefr_test_id', as: 'test' });

// CefrQuestion <-> CefrOption (One-to-Many)
CefrQuestion.hasMany(CefrOption, {
    foreignKey: 'cefr_question_id',
    as: 'options',
});
CefrOption.belongsTo(CefrQuestion, {
    foreignKey: 'cefr_question_id',
    as: 'question',
});

// User <-> UserCefrResult (One-to-Many)
User.hasMany(UserCefrResult, { foreignKey: 'user_id', as: 'cefr_results' });
UserCefrResult.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// CefrTest <-> UserCefrResult (One-to-Many)
CefrTest.hasMany(UserCefrResult, { foreignKey: 'cefr_test_id', as: 'results' });
UserCefrResult.belongsTo(CefrTest, { foreignKey: 'cefr_test_id', as: 'test' });

// UserCefrResult <-> UserCefrAnswer (One-to-Many) -> Jawaban Pilihan Ganda
UserCefrResult.hasMany(UserCefrAnswer, {
    foreignKey: 'result_id',
    as: 'answers',
});
UserCefrAnswer.belongsTo(UserCefrResult, {
    foreignKey: 'result_id',
    as: 'result',
});

// CefrQuestion <-> UserCefrAnswer (One-to-Many)
CefrQuestion.hasMany(UserCefrAnswer, {
    foreignKey: 'question_id',
    as: 'user_answers',
});
UserCefrAnswer.belongsTo(CefrQuestion, {
    foreignKey: 'question_id',
    as: 'question',
});

// UserCefrResult <-> UserCefrSpeaking (One-to-Many) -> Jawaban Speaking
UserCefrResult.hasMany(UserCefrSpeaking, {
    foreignKey: 'result_id',
    as: 'speaking_answers',
});
UserCefrSpeaking.belongsTo(UserCefrResult, {
    foreignKey: 'result_id',
    as: 'result',
});

// CefrQuestion <-> UserCefrSpeaking (One-to-Many)
CefrQuestion.hasMany(UserCefrSpeaking, {
    foreignKey: 'question_id',
    as: 'user_speaking_attempts',
});
UserCefrSpeaking.belongsTo(CefrQuestion, {
    foreignKey: 'question_id',
    as: 'question',
});

// ==========================================
// 3. EXPORT
// ==========================================
module.exports = {
    db,
    User,
    Lesson,
    LessonContent,
    LessonQuestion,
    LessonOption,
    LessonSpeakingAttempt,
    UserLessonProgress,
    CefrTest,
    CefrQuestion,
    CefrOption,
    UserCefrResult,
    UserCefrAnswer,
    UserCefrSpeaking,
};
