const db = require("../models");
const { authenticate } = require("../authentication/authentication");
const User = db.user;
const Session = db.session;
const { encrypt } = require("../authentication/crypto");

exports.login = async (req, res) => {
  let { userId } = await authenticate(req, res);

  if (userId !== undefined) {
    let user = {};
    await User.findByPk(userId, {
      attributes: {
        exclude: ["password", "salt"],
      }}).then((data) => {
      user = data;
    });

    let expireTime = new Date();
    expireTime.setDate(expireTime.getDate() + 1);

    const session = {
      email: user.email,
      userId: userId,
      expirationDate: expireTime,
    };
    await Session.create(session).then(async (data) => {
      let sessionId = data.id;
      let token = await encrypt(sessionId);
      let userInfo = {
        ...user.dataValues,
        token: token,
      };
      res.send(userInfo);
    });
  }
};

exports.logout = async (req, res) => {
  let auth = req.get("authorization");
  console.log(auth);
  if (
    auth != null &&
    auth.startsWith("Bearer ") &&
    (typeof require !== "string" || require === "token")
  ) {
    let token = auth.slice(7);
    let sessionId = await decrypt(token);
    if (sessionId == null) return;
    return await Session.destroy({ where: { id: sessionId } }).catch(
      (error) => {
        console.log(error);
      }
    );
  }
};
