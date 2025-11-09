/**
 * recommendationsController.js
 *
 * Purpose: Lightweight recommendations API. Uses simple heuristics based on
 * user preferences (stored in user.settings.recommendations), records feedback
 * and history. Endpoints return JSON payloads.
 */

const RssItem = require('../models/rssItem');
const Article = require('../models/article');
const RecommendationFeedback = require('../models/recommendationFeedback');
const RecommendationHistory = require('../models/recommendationHistory');

// Simple recommendation: prefer user's preference tags saved in settings.recommendations
/**
 * Get recommendations for current user.
 *
 * Returns: 200 JSON { rss: [...], articles: [...] }
 * Also records a short recommendation history for analytics.
 */
exports.getRecommendations = async (req, res) => {
  try {
    const user = req.user;
    const prefs = (user.settings && user.settings.recommendations) || [];

    let items = [];
    if (prefs && prefs.length > 0) {
      // fetch RssItems matching topics
      items = await RssItem.findAll({ where: { topic: prefs[0] }, order: [['publishedAt','DESC']], limit: 20 });
    }
    if (!items || items.length === 0) {
      // fallback to recent rss items
      items = await RssItem.findAll({ order: [['publishedAt','DESC']], limit: 20 });
    }

    // also include a few recent articles
    const articles = await Article.findAll({ order: [['createdAt','DESC']], limit: 5 });

    const results = { rss: items, articles };

    // record history for top rss items
    try {
      const toRecord = items.slice(0, 10).map(i => ({ userId: user.id, itemType: 'rss', itemId: String(i.id), metadata: { title: i.title } }));
      await Promise.all(toRecord.map(r => RecommendationHistory.create(r)));
    } catch (e) { console.error('history record failed', e.message); }

    return res.json(results);
  } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error' }); }
};

/**
 * Get user's recommendation preferences.
 *
 * Returns: 200 JSON { preferences: [...] }
 */
exports.getPreferences = async (req, res) => {
  const user = req.user;
  const prefs = (user.settings && user.settings.recommendations) || [];
  return res.json({ preferences: prefs });
};

/**
 * Update user's recommendation preferences.
 *
 * Body: { preferences: [...] }
 * Returns: 200 JSON { preferences }
 */
exports.updatePreferences = async (req, res) => {
  try {
    const user = req.user;
    const { preferences } = req.body;
    user.settings = { ...(user.settings || {}), recommendations: preferences };
    await user.save();
    return res.json({ preferences: user.settings.recommendations });
  } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error' }); }
};

/**
 * Post feedback about a recommended item.
 *
 * Body: { itemType, itemId, rating?, comment? }
 * Returns: 201 JSON feedback record.
 */
exports.postFeedback = async (req, res) => {
  try {
    const user = req.user;
    const { itemType, itemId, rating, comment } = req.body;
    const fb = await RecommendationFeedback.create({ userId: user.id, itemType, itemId: String(itemId), rating: rating || null, comment: comment || null });
    return res.status(201).json(fb);
  } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error' }); }
};

/**
 * Get recommendation history for current user.
 *
 * Returns: 200 JSON array of RecommendationHistory records.
 */
exports.getHistory = async (req, res) => {
  try {
    const user = req.user;
    const hist = await RecommendationHistory.findAll({ where: { userId: user.id }, order: [['recommendedAt','DESC']], limit: 200 });
    return res.json(hist);
  } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error' }); }
};

/**
 * Trigger model training (placeholder).
 *
 * Returns: 200 JSON { message }
 */
exports.train = async (req, res) => {
  // placeholder: in real system you'd trigger an async job to train a model
  console.log('Training recommendations model (placeholder)');
  return res.json({ message: 'Training started (placeholder)' });
};
