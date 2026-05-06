const { query, queryOne } = require('../database');

// GET /api/messages/conversations
const getConversations = async (req, res) => {
  try {
    const conversations = await query(`
      SELECT
        CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END as other_user_id,
        u.full_name as other_user_name, u.avatar_url as other_user_avatar, u.student_id,
        MAX(m.created_at) as last_message_time,
        (SELECT content FROM messages WHERE
          ((sender_id = ? AND receiver_id = other_user_id) OR (sender_id = other_user_id AND receiver_id = ?))
          ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT COUNT(*) FROM messages WHERE receiver_id = ? AND sender_id = other_user_id AND is_read = 0) as unread_count
      FROM messages m
      JOIN users u ON u.id = CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END
      WHERE m.sender_id = ? OR m.receiver_id = ?
      GROUP BY other_user_id
      ORDER BY last_message_time DESC
    `, Array(7).fill(req.user.id));

    res.json({ success: true, data: conversations });
  } catch (err) {
    console.error('Get conversations error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch conversations' });
  }
};

// GET /api/messages/:userId
const getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const messages = await query(`
      SELECT m.*, u.full_name as sender_name, u.avatar_url as sender_avatar
      FROM messages m
      JOIN users u ON u.id = m.sender_id
      WHERE (m.sender_id = ? AND m.receiver_id = ?)
         OR (m.sender_id = ? AND m.receiver_id = ?)
      ORDER BY m.created_at DESC
      LIMIT ? OFFSET ?
    `, [req.user.id, userId, userId, req.user.id, parseInt(limit), offset]);

    // Mark messages as read
    await query(
      'UPDATE messages SET is_read = 1 WHERE receiver_id = ? AND sender_id = ? AND is_read = 0',
      [req.user.id, userId]
    );

    res.json({ success: true, data: messages.reverse() });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch messages' });
  }
};

// POST /api/messages/:userId
const sendMessage = async (req, res) => {
  try {
    const { userId } = req.params;
    const { content, item_id } = req.body;

    if (!content?.trim()) return res.status(400).json({ success: false, message: 'Message content is required' });

    const receiver = await queryOne('SELECT id, full_name FROM users WHERE id = ?', [userId]);
    if (!receiver) return res.status(404).json({ success: false, message: 'User not found' });

    const result = await query(
      'INSERT INTO messages (sender_id, receiver_id, content, item_id) VALUES (?, ?, ?, ?)',
      [req.user.id, userId, content.trim(), item_id || null]
    );

    // Create notification
    await query(
      "INSERT INTO notifications (user_id, type, title, body, data) VALUES (?, 'message_received', ?, ?, ?)",
      [userId, `New message from ${req.user.full_name}`,
       content.substring(0, 100), JSON.stringify({ sender_id: req.user.id, message_id: result.insertId })]
    );

    const message = await queryOne(`
      SELECT m.*, u.full_name as sender_name, u.avatar_url as sender_avatar
      FROM messages m JOIN users u ON u.id = m.sender_id
      WHERE m.id = ?
    `, [result.insertId]);

    // Emit socket event if available
    if (req.app.get('io')) {
      req.app.get('io').to(`user_${userId}`).emit('new_message', message);
    }

    res.status(201).json({ success: true, data: message });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
};

// GET /api/messages/unread/count
const getUnreadCount = async (req, res) => {
  try {
    const [result] = await query(
      'SELECT COUNT(*) as count FROM messages WHERE receiver_id = ? AND is_read = 0',
      [req.user.id]
    );
    res.json({ success: true, data: { count: result.count } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get unread count' });
  }
};

module.exports = { getConversations, getMessages, sendMessage, getUnreadCount };
