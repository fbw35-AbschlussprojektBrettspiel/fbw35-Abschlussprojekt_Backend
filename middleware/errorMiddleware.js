const errorMiddleware = (err, req, res, next) => {
  res.status(err.statusCode || 500).send({
    error: {
      status: err.statusCode,
      mitteilung: err.message
    }
  });
};

module.exports = errorMiddleware;