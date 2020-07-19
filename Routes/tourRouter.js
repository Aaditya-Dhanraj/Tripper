const express = require('express');
const tourControllers = require('./../controllers/tourControllers');
const authControllers = require('./../controllers/authControllers');

const router = express.Router();

// router.param('id', tourControllers.checkId);

//ALIAS ROUTE
router
  .route('/top-5-cheap')
  .get(tourControllers.aliasTopTours, tourControllers.getAllTours);

router.route('/tours-stats').get(tourControllers.getTourStats);

router.route('/monthly-plans/:year').get(tourControllers.getMonthlyPlans);

router
  .route('/')
  .get(authControllers.protect, tourControllers.getAllTours)
  .post(tourControllers.createTour);

router
  .route('/:id')
  .get(tourControllers.getTour)
  .patch(tourControllers.updateTour)
  .delete(
    authControllers.protect,
    authControllers.restrictTo('admin', 'user-guide'),
    tourControllers.deleteTour
  );

module.exports = router;
