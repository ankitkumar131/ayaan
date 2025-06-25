exports.getStatistics = async (req, res) => {
  const stats = await Promise.all([
    User.countDocuments(),
    Product.countDocuments(),
    Order.aggregate([{ $group: { _id: null, total: { $sum: "$total" } } }])
  ]);
  res.json({
    users: stats[0],
    products: stats[1],
    revenue: stats[2][0]?.total || 0
  });
};