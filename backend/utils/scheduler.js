const cron = require('node-cron');
const Ride = require('../models/Ride');

// Schedule job to run every minute to check for expired rides
const scheduleRideExpiration = () => {
  // Run every minute
  cron.schedule('* * * * *', async () => {
    try {
      console.log('Checking for expired rides...');
      const expiredCount = await Ride.markExpiredRides();
      
      if (expiredCount > 0) {
        console.log(`Successfully marked ${expiredCount} rides as expired`);
      }
    } catch (error) {
      console.error('Error in ride expiration scheduler:', error);
    }
  });
  
  console.log('Ride expiration scheduler started - checking every minute');
};

// Alternative: Run every 5 minutes for better performance
const scheduleRideExpirationEvery5Minutes = () => {
  cron.schedule('*/5 * * * *', async () => {
    try {
      console.log('Checking for expired rides (every 5 minutes)...');
      const expiredCount = await Ride.markExpiredRides();
      
      if (expiredCount > 0) {
        console.log(`Successfully marked ${expiredCount} rides as expired`);
      }
    } catch (error) {
      console.error('Error in ride expiration scheduler:', error);
    }
  });
  
  console.log('Ride expiration scheduler started - checking every 5 minutes');
};

module.exports = {
  scheduleRideExpiration,
  scheduleRideExpirationEvery5Minutes
};



