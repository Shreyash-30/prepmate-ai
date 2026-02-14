/**
 * Mentor Controller
 * Handles AI mentor chat and personalized recommendations
 */

/**
 * POST /api/mentor/chat
 * Send message to AI mentor and get response
 */
exports.chat = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user.id;

    if (!message) {
      return res.status(400).json({
        error: 'Message is required',
      });
    }

    // Generate mentor response based on message
    let response = '';

    if (message.toLowerCase().includes('topic') || message.toLowerCase().includes('learn')) {
      response = 'I recommend focusing on Data Structures first. It\'s the foundation for all algorithmic problem solving. Start with arrays and linked lists, then move to trees and graphs.';
    } else if (message.toLowerCase().includes('problem') || message.toLowerCase().includes('practice')) {
      response = 'Try solving 2-3 problems daily. Start with easy difficulty and gradually increase. Focus on understanding the solution approach, not just getting the right answer.';
    } else if (message.toLowerCase().includes('interview') || message.toLowerCase().includes('prepare')) {
      response = 'For an FAANG interview, you need strong DSA fundamentals, system design knowledge, and communication skills. I\'d recommend 3-6 months of consistent preparation.';
    } else if (message.toLowerCase().includes('weak') || message.toLowerCase().includes('struggle')) {
      response = 'It\'s normal to struggle with new topics. Try breaking down complex problems into smaller parts. Use the resources provided and revisit fundamentals.';
    } else {
      response = 'That\'s a great question! Keep practicing and stay consistent. Every expert was once a beginner. Would you like specific recommendations for any topic?';
    }

    const chatMessage = {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: response,
      timestamp: new Date().toISOString(),
    };

    return res.json({
      success: true,
      data: chatMessage,
    });
  } catch (error) {
    console.error('Mentor chat error:', error);
    return res.status(500).json({
      error: error.message,
    });
  }
};

/**
 * GET /api/mentor/history
 * Get chat history with mentor
 */
exports.getHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;

    // Return mock chat history
    const history = [
      {
        id: 'msg-1',
        role: 'user',
        content: 'How should I prepare for interviews?',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'msg-2',
        role: 'assistant',
        content: 'Focus on DSA fundamentals, system design, and behavioral questions. Practice consistently for 3-6 months.',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'msg-3',
        role: 'user',
        content: 'Which topics should I focus on first?',
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'msg-4',
        role: 'assistant',
        content: 'Start with arrays and strings, then move to linked lists and trees. These are the most common interview topics.',
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      },
    ];

    return res.json({
      success: true,
      data: history.slice(0, limit),
    });
  } catch (error) {
    console.error('Get mentor history error:', error);
    return res.status(500).json({
      error: error.message,
    });
  }
};

/**
 * GET /api/mentor/recommendations
 * Get personalized recommendations from mentor
 */
exports.getRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;

    const recommendations = {
      focus_topics: [
        'Data Structures - Arrays & Linked Lists',
        'Sorting & Searching Algorithms',
        'Trees and Graphs',
      ],
      suggested_problems: [
        'Two Sum (LeetCode #1)',
        'Longest Substring Without Repeating Characters (LeetCode #3)',
        'Merge K Sorted Lists (LeetCode #23)',
      ],
      interview_tips: [
        'Always explain your approach before coding',
        'Discuss time and space complexity',
        'Write clean, readable code',
        'Test edge cases before submitting',
      ],
    };

    return res.json({
      success: true,
      data: recommendations,
    });
  } catch (error) {
    console.error('Get recommendations error:', error);
    return res.status(500).json({
      error: error.message,
    });
  }
};
