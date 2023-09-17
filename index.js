const lang = require("./lang.json");
const axios = require("axios");
const { format } = require("date-fns");
const { validationResult } = require("express-validator");

const slugify = (string) => {
  return string
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

/**
 * handle validation errors
 * @param {object} req Request object
 * @param {object} res Response object
 * @returns {object}
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return badResquestWithMsg(res, errors.array());
  } else {
    next();
  }
};

/**
 * Send notification to
 * @param {*} hook string Slack hook
 * @param {*} content string Content to notify
 */
const custom_notify = async (hook, content) => {
  if (process.env.ALLOW_NOTIF === "true") {
    axios
      .post(hook, content)
      .then(() => {
        // console.log("Nofitication send");
      })
      .catch((err) => {
        const dateTime = `${format(new Date(), "dd/MM/yyyy\tHH:mm:ss")}`;
        error_notification({
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `\`${dateTime}\``,
              },
            },
            {
              type: "context",
              elements: [
                {
                  type: "mrkdwn",
                  text: `*error while sending notification* \n${err}`,
                },
              ],
            },
          ],
        });
      });
  }
};

/**
 * Send error notification to slack channel
 * @param {*} content string Content to notify
 */
const error_notification = async (content) => {
  return custom_notify(process.env.ERROR_HOOK, content);
};

/**
 * Send log notification to slack channel
 * @param {*} content string Content to notify
 */
const log_notification = async (content) => {
  if (process.env.ALLOW_LOG_NOTIF === "true") {
    return custom_notify(process.env.LOG_HOOK, content);
  }
};

/**
 * Translate reponse message to different language
 * @param { object } request Request object
 * @param { string } message message to send
 * @returns { string }
 */
const translate = (request, message) => {
  try {
    return lang[handleLanguage(request)][message];
  } catch (err) {
    return lang.eng[message];
  }
};

/**
 * Handle the language in request query or set to english by default
 * @param { object } request Request object
 * @returns { string }
 */
const handleLanguage = (request) => {
  return !request?.query["lang"] ? "eng" : request?.query["lang"];
};

/**
 * Return a custom response object
 * @param { object } response Response object
 * @param { Integer } statusCode Http status code
 * @param { boolean} success True if success and false if error occured
 * @param { object } data Data to be returned
 * @param { string } message Message to notify
 * @returns { object } object
 */
const custom = (response, statusCode, success, data, message) => {
  return response.status(statusCode).json({
    success: success,
    data: data,
    message: message,
  });
};

/**
 * Return a custom response object with only the data to be sended
 * @param { object } response Response object
 * @param { boolean} success True if success and false if error occured
 * @param { object } data Data to be returned
 * @param { string } message Message to notify
 * @returns { object } object
 */
const _custom = (response, status, data) => {
  return response.status(status || 200).json({
    data: data,
  });
};

/**
 * Return 400 Bad Request error
 * @param { object } req Request object
 * @param { object } res Response object
 * @returns { object }
 */
const badResquest = (req, res) => {
  return res.status(400).send({
    errors: [
      {
        msg: translate(req, "missing_parameters"),
        location: "params",
      },
    ],
  });
};

/**
 * Return 400 Bad Request response with message
 * @param { object } res Response object
 * @param { string } message Message to be returned
 * @returns { object }
 */
const badResquestWithMsg = (res, message) => {
  return res.status(400).json({
    errors: message,
  });
};

/**
 * Return 409 Conflict error
 * @param { object } req Request object
 * @param { object } res Response object
 * @returns { string }
 */
const conflict = (req, res) => {
  return res.status(409).send({
    errors: [
      {
        msg: translate(req, "already_exist"),
        location: "body",
      },
    ],
  });
};

/**
 * Return 404 Not Found error
 * @param { object } req Request object
 * @param { object } res Response object
 * @returns { string }
 */
const notFound = (req, res) => {
  return res.status(404).send({
    errors: [
      {
        msg: translate(req, "not_found"),
        location: "params",
      },
    ],
  });
};

/**
 * Return 201 Created response
 * @param { object } req Request object
 * @param { object } res Response object
 * @returns { object }
 */
const success = (req, res) => {
  return res.status(200).send({
    success: true,
    msg: translate(req, "successfull_operation"),
  });
};

/**
 * Return 201 Created response
 * @param { object } req Request object
 * @param { object } res Response object
 * @returns { object }
 */
const _success = (res, data) => {
  return _custom(res, 201, data);
};

/**
 * Return an error specified at error parameter
 * @param { object } res Response object
 * @param { object } error error object throwed
 * @returns { object }
 */
const error = async (res, error) => {
  const dateTime = `${format(new Date(), "dd/MM/yyyy\tHH:mm:ss")}`;
  await error_notification({
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `\`${dateTime}\``,
        },
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `*ERREUR ${error?.code} - ENV ${process.env.NODE_ENV}* \n MESSAGE: ${error?.message}\n CAUSE: ${error?.cause} \n STACK: ${error?.stack}`,
          },
        ],
      },
    ],
  });
  return res.status(500).json({
    errors: [
      {
        code: error?.code,
        msg: error?.message,
        stack: error?.stack,
        syscall: error?.syscall,
      },
    ],
  });
};

/**
 * Return 403 Forbidden error
 * @param { object } req Request object
 * @param { object } res Response object
 * @returns { object }
 */
const forbidden = (req, res) => {
  return res.status(403).send(translate(req, "forbidden"));
};

/**
 * Return 401 Unauthorized error
 * @param { object } req Request object
 * @param { object } res Response object
 * @returns { object }
 */
const unauthorized = (req, res) => {
  return res.status(401).send(translate(req, "unauthorized"));
};

/**
 * Return 422 Unprocessable Content error
 * @param { object } req Request object
 * @param { object } res Response object
 * @returns { object }
 */
const unprocessable_content = (req, res) => {
  return res.status(422).send(translate(req, "422_error"));
};

/**
 * Return 200 OK response with only one data object
 * @param { object } res Response object
 * @returns { object }
 */
const success_with_data = (res, data) => {
  return res.status(200).json(data);
};

/**
 * Return 200 OK response with array of data object
 * @param { object } res Response object
 * @returns { object }
 */
const success_with_datas = (res, data) => {
  return res.status(200).json({
    data,
  });
};

module.exports = {
  custom,
  handleValidationErrors,
  badResquest,
  badResquestWithMsg,
  conflict,
  notFound,
  success,
  error,
  forbidden,
  unauthorized,
  slugify,
  translate,
  handleLanguage,
  custom_notify,
  error_notification,
  log_notification,
  _custom,
  _success,
  unprocessable_content,
  success_with_data,
  success_with_datas,
};
