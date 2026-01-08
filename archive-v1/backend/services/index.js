// Central exports for all services
const userService = require('./userService');
const routeService = require('./routeService');
const locationService = require('./locationService');
const friendService = require('./friendService');
const runService = require('./runService');
const requestService = require('./requestService');

module.exports = {
  userService,
  routeService,
  locationService,
  friendService,
  runService,
  requestService
};