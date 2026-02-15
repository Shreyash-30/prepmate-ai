/**
 * Submissions Controller
 * Handles fetching user submissions, solved problems, and progress tracking
 * Integrates with unified intelligence pipeline
 */

const UserSubmission = require('../models/UserSubmission');
const Submission = require('../models/Submission');
const Problem = require('../models/Problem');
const { queueSubmissionIntelligence } = require('../workers/intelligenceWorker');

/**
 * POST /api/submissions/create
 * Create a new user submission and queue for intelligence processing
 * Body: { submissionData }
 * This can be called by sync services or manual upload endpoints
 */
exports.createSubmission = async (req, res) => {
  try {
    const submissionData = req.body;

    // Create the submission
    const submission = await UserSubmission.create(submissionData);

    // Queue for intelligence processing asynchronously
    queueSubmissionIntelligence(submission._id).catch(error => {
      console.error(`Failed to queue submission ${submission._id}: ${error.message}`);
    });

    return res.status(201).json({
      success: true,
      data: submission,
      message: 'Submission created and queued for intelligence processing',
    });
  } catch (error) {
    console.error('Create submission error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * POST /api/submissions/sync
 * Bulk create submissions from platform sync (used by sync services)
 * Body: { submissions: [...] }
 */
exports.bulkCreateSubmissions = async (req, res) => {
  try {
    const { submissions } = req.body;

    if (!Array.isArray(submissions) || !submissions.length) {
      return res.status(400).json({
        success: false,
        message: 'submissions array is required',
      });
    }

    // Create all submissions
    const created = await UserSubmission.insertMany(submissions, { ordered: false });

    // Queue all for intelligence processing
    const queuedIds = [];
    for (const submission of created) {
      queueSubmissionIntelligence(submission._id)
        .then(() => {
          queuedIds.push(submission._id);
        })
        .catch(error => {
          console.error(`Failed to queue submission ${submission._id}: ${error.message}`);
        });
    }

    return res.status(201).json({
      success: true,
      data: {
        created: created.length,
        queued: queuedIds.length,
      },
      message: `${created.length} submissions created and queued for intelligence processing`,
    });
  } catch (error) {
    console.error('Bulk create submissions error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * GET /api/submissions/user/solved
 * Get all problems solved by authenticated user across all platforms
 * Query params: ?platform=leetcode&difficulty=easy&limit=20&page=1
 */
exports.getUserSolvedProblems = async (req, res) => {
  try {
    const userId = req.user.id;
    const { platform, difficulty, topic, limit = 50, page = 1 } = req.query;

    // Build filter query
    const filter = {
      userId,
      isSolved: true,
    };

    if (platform) filter.platform = platform;

    // Get solved submissions with population
    const skip = (page - 1) * limit;
    
    const submissions = await UserSubmission.find(filter)
      .populate({
        path: 'problemId',
        select: 'title difficulty topics platform url acceptanceRate',
        match: difficulty ? { difficulty } : {},
      })
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ lastAttemptTime: -1 })
      .lean();

    // Filter out null problems (from difficulty mismatch)
    const filteredSubmissions = submissions.filter(s => s.problemId);

    // Apply topic filter if specified
    let result = filteredSubmissions;
    if (topic) {
      result = filteredSubmissions.filter(s => 
        s.problemId.topics?.includes(topic)
      );
    }

    // Get total count
    const totalCount = await UserSubmission.countDocuments({
      userId,
      isSolved: true,
      ...filter,
    });

    return res.json({
      success: true,
      data: result.map(sub => ({
        submissionId: sub._id,
        problemId: sub.problemId._id,
        title: sub.problemId.title,
        difficulty: sub.problemId.difficulty,
        platform: sub.platform,
        topics: sub.problemId.topics,
        url: sub.problemId.url,
        acceptanceRate: sub.problemId.acceptanceRate,
        solved: true,
        solvedAt: sub.lastAttemptTime,
        attempts: sub.attempts,
        solveTime: sub.solveTime,
        language: sub.language,
        runtime: sub.runtimeMs,
        memory: sub.memoryUsed,
        hintsUsed: sub.hintsUsed,
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.length,
        totalCount,
        pages: Math.ceil(totalCount / limit),
      },
      summary: {
        totalSolved: result.length,
        solvedByDifficulty: {
          easy: result.filter(s => s.problemId.difficulty === 'easy').length,
          medium: result.filter(s => s.problemId.difficulty === 'medium').length,
          hard: result.filter(s => s.problemId.difficulty === 'hard').length,
        },
        solvedByPlatform: {
          leetcode: result.filter(s => s.platform === 'leetcode').length,
          codeforces: result.filter(s => s.platform === 'codeforces').length,
          hackerrank: result.filter(s => s.platform === 'hackerrank').length,
          geeksforgeeks: result.filter(s => s.platform === 'geeksforgeeks').length,
        },
      },
    });
  } catch (error) {
    console.error('Get user solved problems error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * GET /api/submissions/user/attempts
 * Get all submission attempts (solved and unsolved) by user
 */
exports.getUserSubmissions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { platform, verdict, limit = 50, page = 1 } = req.query;

    const filter = { userId };
    if (platform) filter.platform = platform;
    if (verdict) filter.verdict = verdict;

    const skip = (page - 1) * limit;

    const submissions = await UserSubmission.find(filter)
      .populate('problemId', 'title difficulty topics platform url')
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ lastAttemptTime: -1 })
      .lean();

    const total = await UserSubmission.countDocuments(filter);

    return res.json({
      success: true,
      data: submissions.map(sub => ({
        submissionId: sub._id,
        problemId: sub.problemId._id,
        title: sub.problemId.title,
        difficulty: sub.problemId.difficulty,
        platform: sub.platform,
        solved: sub.isSolved,
        verdict: sub.verdict,
        attempts: sub.attempts,
        language: sub.language,
        runtime: sub.runtimeMs,
        memory: sub.memoryUsed,
        solveTime: sub.solveTime,
        firstAttemptTime: sub.firstAttemptTime,
        lastAttemptTime: sub.lastAttemptTime,
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get user submissions error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * GET /api/submissions/user/stats
 * Get submission statistics for user
 */
exports.getUserSubmissionStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all submissions
    const allSubmissions = await UserSubmission.find({ userId }).lean();
    const solvedSubmissions = allSubmissions.filter(s => s.isSolved);

    // Calculate stats
    const stats = {
      totalSubmissions: allSubmissions.length,
      totalSolved: solvedSubmissions.length,
      totalAttempts: allSubmissions.reduce((sum, s) => sum + s.attempts, 0),
      averageAttemptsPerProblem: allSubmissions.length > 0
        ? (allSubmissions.reduce((sum, s) => sum + s.attempts, 0) / allSubmissions.length).toFixed(2)
        : 0,
      averageSolveTime: solvedSubmissions.length > 0
        ? Math.round(solvedSubmissions.reduce((sum, s) => sum + (s.solveTime || 0), 0) / solvedSubmissions.length)
        : 0,
      hintsUsedTotal: allSubmissions.reduce((sum, s) => sum + (s.hintsUsed || 0), 0),
      verdicts: {
        accepted: allSubmissions.filter(s => s.verdict === 'accepted').length,
        wrong_answer: allSubmissions.filter(s => s.verdict === 'wrong_answer').length,
        time_limit: allSubmissions.filter(s => s.verdict === 'time_limit').length,
        memory_limit: allSubmissions.filter(s => s.verdict === 'memory_limit').length,
        runtime_error: allSubmissions.filter(s => s.verdict === 'runtime_error').length,
        compilation_error: allSubmissions.filter(s => s.verdict === 'compilation_error').length,
      },
      byDifficulty: {
        easy: { total: 0, solved: 0 },
        medium: { total: 0, solved: 0 },
        hard: { total: 0, solved: 0 },
      },
      byPlatform: {},
      successRate: allSubmissions.length > 0
        ? ((solvedSubmissions.length / allSubmissions.length) * 100).toFixed(2)
        : 0,
    };

    // Get problem details for difficulty and platform breakdown
    const problemIds = [...new Set(allSubmissions.map(s => s.problemId))];
    const problems = await Problem.find({ _id: { $in: problemIds } }).lean();
    const problemMap = new Map(problems.map(p => [p._id.toString(), p]));

    for (const sub of allSubmissions) {
      const problem = problemMap.get(sub.problemId.toString());
      if (problem) {
        // By difficulty
        if (stats.byDifficulty[problem.difficulty]) {
          stats.byDifficulty[problem.difficulty].total++;
          if (sub.isSolved) {
            stats.byDifficulty[problem.difficulty].solved++;
          }
        }

        // By platform
        if (!stats.byPlatform[sub.platform]) {
          stats.byPlatform[sub.platform] = { total: 0, solved: 0 };
        }
        stats.byPlatform[sub.platform].total++;
        if (sub.isSolved) {
          stats.byPlatform[sub.platform].solved++;
        }
      }
    }

    return res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Get user submission stats error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * GET /api/submissions/user/by-topic
 * Get solved problems grouped by topic
 */
exports.getUserSolvedByTopic = async (req, res) => {
  try {
    const userId = req.user.id;

    const submissions = await UserSubmission.find({
      userId,
      isSolved: true,
    })
      .populate('problemId', 'title difficulty topics platform')
      .lean();

    // Group by topic
    const byTopic = {};

    for (const sub of submissions) {
      const topics = sub.problemId.topics || [];
      for (const topic of topics) {
        if (!byTopic[topic]) {
          byTopic[topic] = [];
        }
        byTopic[topic].push({
          problemId: sub.problemId._id,
          title: sub.problemId.title,
          difficulty: sub.problemId.difficulty,
          platform: sub.platform,
          solvedAt: sub.lastAttemptTime,
        });
      }
    }

    return res.json({
      success: true,
      data: byTopic,
      summary: {
        totalTopics: Object.keys(byTopic).length,
        topicDistribution: Object.fromEntries(
          Object.entries(byTopic).map(([topic, problems]) => [topic, problems.length])
        ),
      },
    });
  } catch (error) {
    console.error('Get user solved by topic error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * GET /api/submissions/platform/:platform
 * Get all submissions from a specific platform
 */
exports.getPlatformSubmissions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { platform } = req.params;
    const { limit = 50, page = 1 } = req.query;

    const skip = (page - 1) * limit;

    const submissions = await UserSubmission.find({ userId, platform })
      .populate('problemId', 'title difficulty topics url')
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ lastAttemptTime: -1 })
      .lean();

    const total = await UserSubmission.countDocuments({ userId, platform });
    const solved = await UserSubmission.countDocuments({ userId, platform, isSolved: true });

    return res.json({
      success: true,
      platform,
      data: submissions.map(sub => ({
        submissionId: sub._id,
        problemId: sub.problemId._id,
        title: sub.problemId.title,
        difficulty: sub.problemId.difficulty,
        solved: sub.isSolved,
        verdict: sub.verdict,
        attempts: sub.attempts,
        solvedAt: sub.lastAttemptTime,
      })),
      stats: {
        total,
        solved,
        successRate: total > 0 ? ((solved / total) * 100).toFixed(2) : 0,
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get platform submissions error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
