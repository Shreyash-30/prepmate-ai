/**
 * PCI (Preparation Completeness Index) Computation Service
 * Calculates user's topic completion, roadmap progress, and overall PCI score
 */

const UserSubmission = require('../models/UserSubmission');
const UserContest = require('../models/UserContest');
const Roadmap = require('../models/Roadmap');
const RoadmapTopic = require('../models/RoadmapTopic');
const RoadmapTopicProblem = require('../models/RoadmapTopicProblem');

class PCIComputationService {
  /**
   * Compute PCI for a user on a roadmap
   * PCI = (Completed Topics Score / Total Topics Score) * 100
   */
  async computeUserPCI(userId, roadmapId) {
    try {
      const roadmap = await Roadmap.findById(roadmapId).populate('topics');

      if (!roadmap) {
        throw new Error('Roadmap not found');
      }

      const topicsData = [];
      let totalWeight = 0;
      let completedWeight = 0;

      for (const topic of roadmap.topics) {
        const topicData = await this.computeTopicCompletion(userId, topic._id);

        topicsData.push({
          topicId: topic._id,
          name: topic.name,
          weight: topic.weight || 1,
          ...topicData,
        });

        const weight = topic.weight || 1;
        totalWeight += weight;

        // Weighted completion: (completionPercentage * weight)
        const weightedCompletion = (topicData.completionPercentage * weight) / 100;
        completedWeight += weightedCompletion;
      }

      const pciScore = totalWeight > 0 ? (completedWeight / totalWeight) * 100 : 0;

      return {
        userId,
        roadmapId,
        roadmapName: roadmap.name,
        pciScore: Math.round(pciScore * 100) / 100, // 2 decimal places
        completedTopics: topicsData.filter(t => t.isCompleted).length,
        totalTopics: topicsData.length,
        topics: topicsData,
        computedAt: new Date(),
        strength: this.getPCIStrength(pciScore),
        recommendations: this.getPCIRecommendations(pciScore, topicsData),
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Compute completion for a single topic
   */
  async computeTopicCompletion(userId, topicId) {
    const topic = await RoadmapTopic.findById(topicId);

    if (!topic) {
      throw new Error('Topic not found');
    }

    // Get all problems in this topic
    const topicProblems = await RoadmapTopicProblem.find({ topicId });

    if (topicProblems.length === 0) {
      return {
        completionPercentage: 0,
        solvedProblems: 0,
        totalProblems: 0,
        isCompleted: false,
        avgSolveTime: 0,
        avgAttempts: 0,
      };
    }

    // Check which problems user has solved
    const problemIds = topicProblems.map(tp => tp.problemId);
    const userSubmissions = await UserSubmission.find({
      userId,
      problemId: { $in: problemIds },
      isSolved: true,
    });

    const solvedProblemIds = new Set(userSubmissions.map(s => s.problemId.toString()));
    const solvedCount = solvedProblemIds.size;

    // Calculate based on required problems vs total
    const requiredProblems = topic.requiredProblems || Math.ceil(topicProblems.length * 0.7);
    const completionThreshold = topic.completionThreshold || 0.7;
    const actualRequired = Math.max(1, Math.ceil(topicProblems.length * completionThreshold));

    const completionPercentage = Math.min(100, (solvedCount / actualRequired) * 100);

    // Calculate average metrics
    let totalTime = 0;
    let totalAttempts = 0;

    for (const submission of userSubmissions) {
      totalTime += submission.solveTime || 0;
      totalAttempts += submission.attempts || 1;
    }

    const avgSolveTime = userSubmissions.length > 0 ? totalTime / userSubmissions.length : 0;
    const avgAttempts = userSubmissions.length > 0 ? totalAttempts / userSubmissions.length : 0;

    return {
      completionPercentage: Math.round(completionPercentage),
      solvedProblems: solvedCount,
      totalProblems: topicProblems.length,
      requiredProblems: actualRequired,
      isCompleted: solvedCount >= actualRequired,
      avgSolveTime: Math.round(avgSolveTime),
      avgAttempts: Math.round(avgAttempts * 10) / 10,
    };
  }

  /**
   * Get descriptive strength label for PCI score
   */
  getPCIStrength(pciScore) {
    if (pciScore >= 90) return 'Excellent';
    if (pciScore >= 75) return 'Very Good';
    if (pciScore >= 60) return 'Good';
    if (pciScore >= 45) return 'Fair';
    if (pciScore >= 30) return 'Needs Work';
    return 'Just Started';
  }

  /**
   * Generate recommendations based on PCI and topic data
   */
  getPCIRecommendations(pciScore, topicsData) {
    const recommendations = [];

    // Sort by completion percentage (lowest first)
    const sortedTopics = [...topicsData].sort((a, b) => 
      a.completionPercentage - b.completionPercentage
    );

    // Recommend weakest topics
    if (pciScore < 100) {
      const weakTopics = sortedTopics
        .filter(t => t.completionPercentage < 50)
        .slice(0, 3);

      if (weakTopics.length > 0) {
        recommendations.push({
          type: 'focus_weak_topics',
          message: `Focus on ${weakTopics.map(t => t.name).join(', ')}`,
          topics: weakTopics.map(t => t.name),
          priority: 'high',
        });
      }
    }

    // Recommend completing in-progress topics
    const inProgress = sortedTopics.filter(t => 
      t.completionPercentage > 0 && t.completionPercentage < 100
    );

    if (inProgress.length > 0) {
      const nextTopic = inProgress[0];
      const remaining = nextTopic.requiredProblems - nextTopic.solvedProblems;
      recommendations.push({
        type: 'complete_in_progress',
        message: `Finish ${nextTopic.name} - ${remaining} more problems needed`,
        topic: nextTopic.name,
        remaining,
        priority: 'medium',
      });
    }

    // Encourage completed topics
    const completed = topicsData.filter(t => t.isCompleted);
    if (completed.length > 0) {
      recommendations.push({
        type: 'maintain_momentum',
        message: `Great! You've completed ${completed.length} topic(s). Keep it up!`,
        completedCount: completed.length,
        priority: 'low',
      });
    }

    // Estimate time to completion
    if (pciScore < 100) {
      const incomplete = topicsData.filter(t => !t.isCompleted);
      const totalRemaining = incomplete.reduce(
        (sum, t) => sum + (t.requiredProblems - t.solvedProblems),
        0
      );

      const avgTimePerProblem = topicsData.length > 0
        ? topicsData.reduce((sum, t) => sum + t.avgSolveTime, 0) / topicsData.length
        : 45;

      const estimatedDays = Math.ceil((totalRemaining * avgTimePerProblem) / (2 * 3600)); // 2 hours/day

      recommendations.push({
        type: 'estimate_completion',
        message: `Estimated ${estimatedDays} days to complete all topics (at 2 hrs/day)`,
        estimatedDays,
        priority: 'low',
      });
    }

    return recommendations;
  }

  /**
   * Compute PCI for all roadmaps user is enrolled in
   */
  async computeAllUserPCI(userId) {
    try {
      // Get all roadmaps (for now, just published ones)
      const roadmaps = await Roadmap.find({ isPublished: true })
        .select('_id name subject')
        .limit(10);

      const pciResults = [];

      for (const roadmap of roadmaps) {
        try {
          const pci = await this.computeUserPCI(userId, roadmap._id);
          pciResults.push(pci);
        } catch (error) {
          console.error(`Error computing PCI for roadmap ${roadmap._id}:`, error);
        }
      }

      return {
        userId,
        roadmaps: pciResults,
        overallPCI: pciResults.length > 0
          ? Math.round(
              (pciResults.reduce((sum, r) => sum + r.pciScore, 0) / pciResults.length) * 100
            ) / 100
          : 0,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get topic-specific insights
   */
  async getTopicInsights(userId, topicId) {
    try {
      const topic = await RoadmapTopic.findById(topicId);

      if (!topic) {
        throw new Error('Topic not found');
      }

      // Get all problems in topic
      const topicProblems = await RoadmapTopicProblem.find({ topicId }).populate('problemId');

      // Get user submissions
      const submissions = await UserSubmission.find({
        userId,
        problemId: { $in: topicProblems.map(tp => tp.problemId._id) },
      }).populate('problemId');

      // Organize by difficulty
      const byDifficulty = {
        easy: [],
        medium: [],
        hard: [],
      };

      const byStatus = {
        solved: [],
        attempted: [],
        unsolved: [],
      };

      for (const topicProblem of topicProblems) {
        const submission = submissions.find(
          s => s.problemId._id.equals(topicProblem.problemId._id)
        );

        const problemData = {
          problemId: topicProblem.problemId._id,
          title: topicProblem.problemId.title,
          difficulty: topicProblem.problemId.difficulty,
          importance: topicProblem.importanceScore,
          solved: submission?.isSolved || false,
          attempts: submission?.attempts || 0,
          solveTime: submission?.solveTime || 0,
        };

        // Group by difficulty
        const difficulty = topicProblem.problemId.difficulty || 'medium';
        byDifficulty[difficulty].push(problemData);

        // Group by status
        if (problemData.solved) {
          byStatus.solved.push(problemData);
        } else if (problemData.attempts > 0) {
          byStatus.attempted.push(problemData);
        } else {
          byStatus.unsolved.push(problemData);
        }
      }

      return {
        topicId,
        topicName: topic.name,
        byDifficulty,
        byStatus,
        statistics: {
          totalProblems: topicProblems.length,
          solvedCount: byStatus.solved.length,
          attemptedCount: byStatus.attempted.length,
          unsolvedCount: byStatus.unsolved.length,
          completionPercentage: Math.round(
            (byStatus.solved.length / topicProblems.length) * 100
          ),
        },
        concepts: topic.concepts || [],
        skills: topic.skills || [],
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Compare user's progress across topics
   */
  async compareTopicProgress(userId, topicIds) {
    try {
      const comparison = [];

      for (const topicId of topicIds) {
        const completion = await this.computeTopicCompletion(userId, topicId);
        const topic = await RoadmapTopic.findById(topicId).select('name category');

        comparison.push({
          topicId,
          topicName: topic.name,
          category: topic.category,
          ...completion,
        });
      }

      return comparison.sort((a, b) => b.completionPercentage - a.completionPercentage);
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new PCIComputationService();
