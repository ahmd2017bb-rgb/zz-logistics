const { Store } = require('express-session');

class SQLiteStore extends Store {
  constructor(db) {
    super();
    this.db = db;
    // Prune expired sessions every 15 minutes
    setInterval(() => {
      try { this.db.prepare('DELETE FROM sessions WHERE expired < ?').run(Date.now()); } catch(e) {}
    }, 15 * 60 * 1000);
  }

  get(sid, cb) {
    try {
      const row = this.db.prepare('SELECT sess, expired FROM sessions WHERE sid = ?').get(sid);
      if (!row) return cb(null, null);
      if (Date.now() > row.expired) { this.destroy(sid); return cb(null, null); }
      cb(null, JSON.parse(row.sess));
    } catch(e) { cb(e); }
  }

  set(sid, sess, cb) {
    try {
      const exp = sess.cookie?.expires
        ? new Date(sess.cookie.expires).getTime()
        : Date.now() + 8 * 3600 * 1000;
      this.db.prepare(`
        INSERT INTO sessions (sid, sess, expired) VALUES (?,?,?)
        ON CONFLICT(sid) DO UPDATE SET sess=excluded.sess, expired=excluded.expired
      `).run(sid, JSON.stringify(sess), exp);
      cb && cb(null);
    } catch(e) { cb && cb(e); }
  }

  destroy(sid, cb) {
    try { this.db.prepare('DELETE FROM sessions WHERE sid = ?').run(sid); cb && cb(null); }
    catch(e) { cb && cb(e); }
  }

  touch(sid, sess, cb) { this.set(sid, sess, cb); }
}

module.exports = SQLiteStore;
