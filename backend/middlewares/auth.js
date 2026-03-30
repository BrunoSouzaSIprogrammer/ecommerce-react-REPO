const db = require("../config/firebase");

exports.isAdmin = async (req, res, next) => {
  const uid = req.headers.uid;

  const user = await db.collection("users").doc(uid).get();

  if (!user.exists || user.data().role !== "admin") {
    return res.status(403).json({ error: "Acesso negado" });
  }

  next();
};