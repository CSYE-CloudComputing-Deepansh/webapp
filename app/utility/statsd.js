// statsd.js
const Lynx = require('lynx');

// Create a Lynx instance, pointing to your StatsD server
const statsdHost = process.env.STATSD_HOST || 'localhost';
const statsdPort = process.env.STATSD_PORT || 8125;
const client = new Lynx(statsdHost, statsdPort, {
  prefix: 'webapp.', // Prefix for all metrics
});

// Function to record custom metrics
const recordMetric = (metricName, value = 1, type = 'increment') => {
  switch (type) {
    case 'increment':
      client.increment(metricName);
      break;
    case 'timing':
      client.timing(metricName, value);
      break;
    default:
      client.gauge(metricName, value);
  }
};

module.exports = recordMetric;
