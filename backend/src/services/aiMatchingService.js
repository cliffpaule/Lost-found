const Anthropic = require('@anthropic-ai/sdk');
const { query, queryOne } = require('../database');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * Analyzes a newly reported item against existing items of opposite type
 * to find potential matches using Claude AI.
 */
async function findAIMatches(newItem, existingItems) {
  if (!existingItems.length) return [];

  const systemPrompt = `You are an expert item matching system for a university Lost and Found platform.
Your job is to compare a ${newItem.type} item report against ${newItem.type === 'lost' ? 'found' : 'lost'} item reports and identify potential matches.

For each potential match, provide:
1. A confidence score (0-100)
2. A brief, clear reasoning (2-3 sentences max)
3. Key matching attributes

Consider: item description, category, location, date, unique identifiers, physical characteristics.
High confidence (>70): Strong description overlap, same category, proximate location/date
Medium confidence (40-70): Some matching features, compatible category
Low confidence (<40): Weak but possible match

Respond ONLY with valid JSON array. No markdown, no explanation outside JSON.`;

  const userPrompt = `
ITEM TO MATCH (${newItem.type.toUpperCase()}):
ID: ${newItem.id}
Title: ${newItem.title}
Description: ${newItem.description}
Category: ${newItem.category_name || 'Unknown'}
Location: ${newItem.location_name || newItem.location_detail || 'Unknown'}
Date: ${newItem.date_occurred}

CANDIDATE ITEMS (${newItem.type === 'lost' ? 'FOUND' : 'LOST'}):
${existingItems.map(item => `
---
ID: ${item.id}
Title: ${item.title}
Description: ${item.description}
Category: ${item.category_name || 'Unknown'}
Location: ${item.location_name || item.location_detail || 'Unknown'}
Date: ${item.date_occurred}
`).join('')}

Return JSON array:
[{"item_id": <id>, "confidence_score": <0-100>, "reasoning": "<brief explanation>", "matching_attributes": ["<attr1>", "<attr2>"]}]

Only include items with confidence_score >= 35. Return empty array [] if no reasonable matches.`;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    });

    const text = response.content[0].text.trim();
    const clean = text.replace(/```json|```/g, '').trim();
    const matches = JSON.parse(clean);
    return Array.isArray(matches) ? matches : [];
  } catch (err) {
    console.error('AI matching error:', err.message);
    return [];
  }
}

/**
 * Run AI matching for a newly posted item and store results
 */
async function runMatchingForItem(itemId) {
  try {
    // Get the new item details
    const item = await queryOne(`
      SELECT i.*, c.name as category_name, l.name as location_name
      FROM items i
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN locations l ON i.location_id = l.id
      WHERE i.id = ?
    `, [itemId]);

    if (!item) return;

    const oppositeType = item.type === 'lost' ? 'found' : 'lost';

    // Get candidate items (opposite type, open, recent 60 days, same/similar category)
    const candidates = await query(`
      SELECT i.*, c.name as category_name, l.name as location_name
      FROM items i
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN locations l ON i.location_id = l.id
      WHERE i.type = ?
        AND i.status = 'open'
        AND i.date_occurred >= DATE_SUB(?, INTERVAL 60 DAY)
        AND i.id != ?
      ORDER BY i.created_at DESC
      LIMIT 20
    `, [oppositeType, item.date_occurred, itemId]);

    if (!candidates.length) return;

    // Run AI matching
    const matches = await findAIMatches(item, candidates);

    // Store matches in database
    for (const match of matches) {
      const lostId = item.type === 'lost' ? itemId : match.item_id;
      const foundId = item.type === 'found' ? itemId : match.item_id;

      try {
        await query(`
          INSERT INTO ai_matches (lost_item_id, found_item_id, confidence_score, ai_reasoning)
          VALUES (?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE confidence_score = VALUES(confidence_score), ai_reasoning = VALUES(ai_reasoning)
        `, [lostId, foundId, match.confidence_score, JSON.stringify({
          reasoning: match.reasoning,
          attributes: match.matching_attributes
        })]);

        // Notify item owner if high confidence match
        if (match.confidence_score >= 65) {
          const notifyUserId = item.user_id;
          const matchedItem = candidates.find(c => c.id === match.item_id);
          if (matchedItem) {
            await query(`
              INSERT INTO notifications (user_id, type, title, body, data)
              VALUES (?, 'match_found', ?, ?, ?)
            `, [
              notifyUserId,
              `Potential match found for your ${item.type} item!`,
              `AI found a ${Math.round(match.confidence_score)}% match for "${item.title}". Check it out!`,
              JSON.stringify({ item_id: itemId, match_id: match.item_id, confidence: match.confidence_score })
            ]);
          }
        }
      } catch (dbErr) {
        // Ignore duplicate entries
      }
    }

    console.log(`✅ AI matching complete for item ${itemId}: ${matches.length} matches found`);
    return matches;
  } catch (err) {
    console.error(`AI matching failed for item ${itemId}:`, err.message);
  }
}

/**
 * Get AI-powered search suggestions
 */
async function getSmartSearchSuggestions(query_text) {
  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `Extract search keywords and synonyms from this lost/found item query for a university database search.
Query: "${query_text}"
Return ONLY JSON: {"keywords": ["word1", "word2"], "category_hints": ["category1"], "expanded_query": "expanded search text"}
No markdown.`
      }]
    });

    const text = response.content[0].text.trim().replace(/```json|```/g, '');
    return JSON.parse(text);
  } catch {
    return { keywords: [query_text], category_hints: [], expanded_query: query_text };
  }
}

module.exports = { runMatchingForItem, findAIMatches, getSmartSearchSuggestions };
