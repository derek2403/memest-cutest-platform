import Anthropic from "@anthropic-ai/sdk";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { workflowText } = req.body;

    if (!workflowText || typeof workflowText !== 'string') {
      return res.status(400).json({ error: 'Workflow text is required and must be a string' });
    }

    // Initialize the Anthropic client with your API key
    const anthropic = new Anthropic({
      apiKey: process.env.CLAUDE_API_KEY,
    });

    // Generate the prompt for Claude
    const prompt = `
I need you to parse a workflow description into a structured format with nodes and arrows.

The workflow description is: "${workflowText}"

I need you to extract:
1. Nodes: These are services/systems like Start, 1inch (a token swap/bridge service), Gmail, Spreadsheet, MetaMask, Polygon, Celo
2. Arrows: These are the specific actions/conditions between nodes (e.g., "For each transaction", "Notify", "Record", "If transaction > 30USD")

Format the response as a JSON array containing objects with the following structure:
[
  {
    "type": "node",
    "number": 1,
    "content": "Start"
  },
  {
    "type": "arrow",
    "number": 1,
    "content": "For each transaction in"
  },
  {
    "type": "node",
    "number": 2,
    "content": "MetaMask"
  },
  ...
]

Rules:
- The first element should always be a node with content "Start"
- The first arrow should be the ACTUAL first action/condition, NOT generic texts like "Begin workflow", "Start workflow", etc.
- Alternate between nodes and arrows (node -> arrow -> node -> arrow...)
- Every specific action or condition should be an arrow
- Every service or system should be a node (service names should be just the name, not descriptions)
- Nodes should be limited to just the service names like "1inch", "Gmail", "MetaMask", "Polygon", "Celo", "Spreadsheet" - keep them short
- Arrows can be longer and contain full descriptions of actions like "Swap all tokens to Polygon on"
- Number the nodes and arrows sequentially (1, 2, 3...)
- Recognize that 1inch is a token swap/bridge service and should be a NODE, not part of an arrow

Example 1:
Input: "For each transaction in MetaMask notify in Gmail and record in Spreadsheet"
Output should be:
[
  {"type":"node","number":1,"content":"Start"},
  {"type":"arrow","number":1,"content":"For each transaction in"},
  {"type":"node","number":2,"content":"MetaMask"},
  {"type":"arrow","number":2,"content":"Notify in"},
  {"type":"node","number":3,"content":"Gmail"},
  {"type":"arrow","number":3,"content":"Record in"},
  {"type":"node","number":4,"content":"Spreadsheet"}
]

Example 2:
Input: "For each transaction in MetaMask notify in Gmail and record in Spreadsheet and swap all tokens to Polygon on 1inch"
Output should be:
[
  {"type":"node","number":1,"content":"Start"},
  {"type":"arrow","number":1,"content":"For each transaction in"},
  {"type":"node","number":2,"content":"MetaMask"},
  {"type":"arrow","number":2,"content":"Notify in"},
  {"type":"node","number":3,"content":"Gmail"},
  {"type":"arrow","number":3,"content":"Record in"},
  {"type":"node","number":4,"content":"Spreadsheet"},
  {"type":"arrow","number":4,"content":"Swap all tokens to Polygon on"},
  {"type":"node","number":5,"content":"1inch"}
]

Return ONLY the JSON array with no additional text or explanation.
`;

    // Call the Claude API
    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    });

    // Extract the text content
    const textContent = response.content.find(
      (content) => content.type === 'text'
    )?.text;

    if (!textContent) {
      return res.status(500).json({ error: 'Failed to get response from Claude' });
    }

    // Parse the JSON response from Claude
    try {
      // Extract JSON array from the response
      const jsonMatch = textContent.match(/\[[\s\S]*\]/);
      const jsonStr = jsonMatch ? jsonMatch[0] : null;
      
      if (!jsonStr) {
        throw new Error('Could not extract JSON from response');
      }
      
      const workflow = JSON.parse(jsonStr);
      return res.status(200).json({ workflow });
    } catch (parseError) {
      console.error('Error parsing Claude response as JSON:', parseError);
      return res.status(500).json({ 
        error: 'Failed to parse Claude response', 
        details: parseError.message,
        rawResponse: textContent
      });
    }
  } catch (error) {
    console.error('Error calling Claude API for workflow parsing:', error);
    return res.status(500).json({ error: 'Failed to parse workflow', details: error.message });
  }
} 