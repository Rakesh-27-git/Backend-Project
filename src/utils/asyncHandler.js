const asyncHandler = (requestHandler) => {
  (req, res, next) => {
    // use promiss
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};


// Using try and catch method 

// const asyncHandler = (requestHandler) => {
//   (req, res, next) => {
//     try {
//       requestHandler(req, res, next);
//     } catch (error) {
//       res.status(err.code || 500).json({
//         success: false,
//         message: error.message || "Server Error"
//       })
//     }
//   };
// };