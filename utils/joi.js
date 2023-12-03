const Joi = require("joi");

async function noradValidate(input) {
  const schema = Joi.object({
    noradId: Joi.string().pattern(new RegExp("^[0-9]{5}$")),
  });
  try {
    const { err, value } = await schema.validateAsync({ noradId: input });
    return 1;
  } catch (err) {
    return 0;
  }
}

module.exports = noradValidate;
