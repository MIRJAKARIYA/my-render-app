const axios = require('axios');
const Post = require('../models/Post');

const XAI_API_URL = 'https://api.x.ai/v1/chat/completions'; // Check docs for exact endpoint
const API_KEY = process.env.XAI_API_KEY;

async function moderateContent(content) {
  try {
    const response = await axios.post(XAI_API_URL, {
      model: 'grok-4', // Or appropriate model
      messages: [{ role: 'user', content: `Is this content spam or inappropriate? Respond with yes or no: "${content}"` }]
    }, { headers: { Authorization: `Bearer ${API_KEY}` } });

    return response.data.choices[0].message.content.toLowerCase().includes('yes');
  } catch (err) {
    console.error('AI moderation error:', err);
    return false; // Default allow on error
  }
}

async function summarizeThread(threadId) {
  try {
    const posts = await Post.find({ thread: threadId }).sort({ createdAt: 1 });
    const content = posts.map(p => p.content).join('\n');
    const response = await axios.post(XAI_API_URL, {
      model: 'grok-4',
      messages: [{ role: 'user', content: `Summarize this thread: ${content}` }]
    }, { headers: { Authorization: `Bearer ${API_KEY}` } });

    return response.data.choices[0].message.content;
  } catch (err) {
    console.error('AI summary error:', err);
    return 'Summary unavailable';
  }
}

module.exports = { moderateContent, summarizeThread };