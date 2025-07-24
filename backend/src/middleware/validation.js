const Joi = require('joi');

const validateRegistration = (req, res, next) => {
    const schema = Joi.object({
        username: Joi.string().required().min(3).max(30),
        email: Joi.string().email().required(),
        kyberPublicKey: Joi.string().required(),
        dilithiumPublicKey: Joi.string().required()
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ 
            success: false, 
            error: error.details[0].message 
        });
    }
    next();
};

const validateLoginChallenge = (req, res, next) => {
    const schema = Joi.object({
        identifier: Joi.string().required()
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ 
            success: false, 
            error: error.details[0].message 
        });
    }
    next();
};

const validateChallengeVerification = (req, res, next) => {
    const schema = Joi.object({
        userId: Joi.string().required(),
        challengeId: Joi.string().required(),
        signature: Joi.string().required()
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ 
            success: false, 
            error: error.details[0].message 
        });
    }
    next();
};

module.exports = {
    validateRegistration,
    validateLoginChallenge,
    validateChallengeVerification
};