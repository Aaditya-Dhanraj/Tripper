const express = require('express');
const path = require('path');
const morgan = require('morgan');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorControllers');
const tourRouter = require('./Routes/tourRouter');
const userRouter = require('./Routes/userRouter');
const bookingRouter = require('./Routes/bookingRouter');
const reviewRouter = require('./Routes/reviewRouter');
const viewRouter = require('./Routes/viewRouter');
const bookingControllers = require('./controllers/bookingControllers');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const { application, json } = require('express');

// start express app
const app = express();

app.enable('trust proxy');

//setted up pug template engine
app.set('view engine', 'pug');
// set up directory so no need to specify every time
app.set('views', path.join(__dirname, 'views'));

// 1)Global Middlewares
// implementing cors
app.use(cors());

// serving static file
// app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, 'public')));

app.options('*', cors());

// // for request on one route
// app.options('/api/v1/tours/:id', cors());

// set security http headers
app.use(helmet());

// development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// setting up rate limiter to avoid DDOS and Bruteforce attacks  || limit request from same api
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many request from this IP. Please try again',
});

app.use('/api', limiter);

// this webhook is here because stripe wont take json data but will take raw data so awe have to place itjust before it is parsed
app.post(
  '/webhook-checkout',
  express.raw({ type: 'application/json' }),
  bookingControllers.webhookCheckout
);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

//data sanitization against noSQL query injection
app.use(mongoSanitize());

//data sanitization against xss attack
app.use(xss());

//prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

app.use(compression());

//test middleware
app.use((req, res, next) => {
  req.requestedTime = new Date().toISOString();
  // console.log(req.cookies);
  next();
});

// ROUTES

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/booking', bookingRouter);
app.use('/api/v1/reviews', reviewRouter);

// If not handled by any other middleware then it dosent exist handler
app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'Fail',
  //   Message: `Can't find ${req.originalUrl} on this server`,
  // });

  //OR

  // const err = new Error(`Can't find ${req.originalUrl} on this server`);
  // err.status = 'Fail';
  // err.statusCode = 404;

  //OR

  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

// implementing the global err handler
app.use(globalErrorHandler);

module.exports = app;
