const moment = require('moment');

// Format du message
function formatMessage(username, text, isPrivate = false) {
  return {
    username,
    text,
    time: moment().format('HH:mm'),
    isPrivate
  };
}

module.exports = formatMessage;