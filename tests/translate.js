const { translate } = require("../index");

const req = {
  query: {
    lang: "fr",
  },
};
console.log(translate(req, "not_found"));
