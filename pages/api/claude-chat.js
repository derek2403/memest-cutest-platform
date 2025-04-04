import Anthropic from "@anthropic-ai/sdk";

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Messages are required and must be an array' });
        }

        // Initialize the Anthropic client with your API key
        const anthropic = new Anthropic({
            apiKey: process.env.CLAUDE_API_KEY,
        });

        // Call the Claude API
        const response = await anthropic.messages.create({
            model: 'claude-3-7-sonnet-20250219',
            max_tokens: 1000,
            messages: messages,
        });

        return res.status(200).json(response);
    } catch (error) {
        console.error('Error calling Claude API:', error);
        return res.status(500).json({ error: 'Failed to process request', details: error.message });
    }
} 