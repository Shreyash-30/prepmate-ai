/**
 * Taxonomy Mapping Service
 * Maps external platform tags to internal topic taxonomy
 */

const Problem = require('../models/Problem');
const RoadmapTopic = require('../models/RoadmapTopic');

/**
 * Internal topic taxonomy
 */
const INTERNAL_TAXONOMY = {
  // Data Structures
  'arrays': {
    aliases: ['array', 'lists'],
    category: 'data-structures',
    difficulty: 1,
  },
  'linked-lists': {
    aliases: ['linked list', 'linkedlist', 'list'],
    category: 'data-structures',
    difficulty: 2,
  },
  'stacks-queues': {
    aliases: ['stack', 'queue', 'deque'],
    category: 'data-structures',
    difficulty: 2,
  },
  'trees': {
    aliases: ['tree', 'bst', 'binary search tree', 'n-ary tree'],
    category: 'data-structures',
    difficulty: 3,
  },
  'graphs': {
    aliases: ['graph', 'dfs', 'bfs', 'dijkstra'],
    category: 'data-structures',
    difficulty: 4,
  },
  'heaps': {
    aliases: ['heap', 'priority queue', 'min heap', 'max heap'],
    category: 'data-structures',
    difficulty: 2,
  },
  'hash-tables': {
    aliases: ['hash table', 'hashtable', 'hash map', 'hashmap', 'dictionary'],
    category: 'data-structures',
    difficulty: 1,
  },
  'tries': {
    aliases: ['trie', 'ternary search tree'],
    category: 'data-structures',
    difficulty: 3,
  },

  // Algorithms
  'sorting': {
    aliases: ['sort', 'quicksort', 'mergesort', 'heap sort'],
    category: 'algorithms',
    difficulty: 2,
  },
  'searching': {
    aliases: ['search', 'binary search'],
    category: 'algorithms',
    difficulty: 2,
  },
  'dynamic-programming': {
    aliases: ['dp', 'dynamic programming', 'memoization'],
    category: 'algorithms',
    difficulty: 4,
  },
  'recursion': {
    aliases: ['recursive', 'backtracking', 'recursion'],
    category: 'algorithms',
    difficulty: 2,
  },
  'greedy': {
    aliases: ['greedy algorithm', 'greedy'],
    category: 'algorithms',
    difficulty: 3,
  },
  'divide-conquer': {
    aliases: ['divide and conquer', 'merge sort', 'quicksort'],
    category: 'algorithms',
    difficulty: 3,
  },

  // String Algorithms
  'string-manipulation': {
    aliases: ['string', 'substring', 'palindrome'],
    category: 'strings',
    difficulty: 2,
  },
  'pattern-matching': {
    aliases: ['pattern matching', 'regex', 'kmp', 'rabin-karp'],
    category: 'strings',
    difficulty: 3,
  },

  // Graph Algorithms
  'shortest-path': {
    aliases: ['dijkstra', 'bellman ford', 'shortest path', 'spfa'],
    category: 'graph-algorithms',
    difficulty: 3,
  },
  'minimum-spanning-tree': {
    aliases: ['mst', 'kruskal', 'prim', 'spanning tree'],
    category: 'graph-algorithms',
    difficulty: 3,
  },
  'topological-sort': {
    aliases: ['topological', 'topo sort', 'dag'],
    category: 'graph-algorithms',
    difficulty: 3,
  },
  'strongly-connected-components': {
    aliases: ['scc', 'tarjan', 'kosaraju'],
    category: 'graph-algorithms',
    difficulty: 4,
  },

  // System Design
  'system-design': {
    aliases: ['system design', 'architecture'],
    category: 'system-design',
    difficulty: 5,
  },
  'database-design': {
    aliases: ['database', 'dbms', 'sql', 'indexing'],
    category: 'system-design',
    difficulty: 4,
  },
  'caching': {
    aliases: ['cache', 'lru', 'redis'],
    category: 'system-design',
    difficulty: 4,
  },
  'load-balancing': {
    aliases: ['load balancer', 'load balancing'],
    category: 'system-design',
    difficulty: 4,
  },
  'microservices': {
    aliases: ['microservice', 'service architecture'],
    category: 'system-design',
    difficulty: 4,
  },

  // Concurrency
  'multithreading': {
    aliases: ['thread', 'threading', 'concurrent', 'concurrency'],
    category: 'concurrency',
    difficulty: 4,
  },
  'locks-semaphores': {
    aliases: ['lock', 'mutex', 'semaphore', 'synchronization'],
    category: 'concurrency',
    difficulty: 4,
  },

  // Math
  'number-theory': {
    aliases: ['number theory', 'prime', 'gcd', 'modulo'],
    category: 'math',
    difficulty: 3,
  },
  'combinatorics': {
    aliases: ['combination', 'permutation', 'factorial'],
    category: 'math',
    difficulty: 3,
  },
  'geometry': {
    aliases: ['geometry', 'coordinate'],
    category: 'math',
    difficulty: 3,
  },

  // OOP
  'oop-design': {
    aliases: ['design pattern', 'oop', 'object oriented', 'polymorphism', 'inheritance'],
    category: 'oop',
    difficulty: 3,
  },

  // BIT Manipulation
  'bit-manipulation': {
    aliases: ['bit', 'bitwise', 'binary'],
    category: 'bit-manipulation',
    difficulty: 2,
  },
};

class TaxonomyService {
  /**
   * Map external tag to internal topic
   */
  mapTagToTopic(tag) {
    if (!tag) return null;

    const normalizedTag = tag.toLowerCase().trim();

    // Direct match
    if (INTERNAL_TAXONOMY[normalizedTag]) {
      return normalizedTag;
    }

    // Check aliases
    for (const [topic, config] of Object.entries(INTERNAL_TAXONOMY)) {
      if (config.aliases.includes(normalizedTag)) {
        return topic;
      }

      // Partial match for longer aliases
      for (const alias of config.aliases) {
        if (normalizedTag.includes(alias) || alias.includes(normalizedTag)) {
          return topic;
        }
      }
    }

    // Fallback: return as-is if not found
    return normalizedTag;
  }

  /**
   * Map multiple tags to topics
   */
  mapTagsToTopics(tags) {
    if (!tags || !Array.isArray(tags)) return [];
    
    const mapped = tags
      .map(tag => this.mapTagToTopic(tag))
      .filter(t => t !== null);
    
    // Remove duplicates
    return [...new Set(mapped)];
  }

  /**
   * Get taxonomy tree structure
   */
  getTaxonomyTree() {
    const tree = {};

    for (const [topic, config] of Object.entries(INTERNAL_TAXONOMY)) {
      const { category } = config;

      if (!tree[category]) {
        tree[category] = [];
      }

      tree[category].push({
        topic,
        aliases: config.aliases,
        difficulty: config.difficulty,
      });
    }

    return tree;
  }

  /**
   * Get topics for a category
   */
  getTopicsForCategory(category) {
    return Object.entries(INTERNAL_TAXONOMY)
      .filter(([_, config]) => config.category === category)
      .map(([topic, config]) => ({
        topic,
        aliases: config.aliases,
        difficulty: config.difficulty,
      }));
  }

  /**
   * Analyze problem's topics and suggest improvements
   */
  analyzeProblemTopics(problemTags) {
    const mapped = this.mapTagsToTopics(problemTags);

    return {
      original: problemTags,
      mapped: mapped,
      unmapped: problemTags.filter(tag => !mapped.includes(this.mapTagToTopic(tag))),
      categories: [...new Set(
        mapped
          .map(topic => INTERNAL_TAXONOMY[topic]?.category)
          .filter(c => c)
      )],
      averageDifficulty: mapped.length > 0
        ? Math.round(
            mapped.reduce((sum, topic) => sum + (INTERNAL_TAXONOMY[topic]?.difficulty || 0), 0) /
              mapped.length
          )
        : 0,
    };
  }

  /**
   * Update problem with mapped topics
   */
  async mapProblem(problemId) {
    const problem = await Problem.findById(problemId);

    if (!problem) {
      throw new Error('Problem not found');
    }

    const mappedTopics = this.mapTagsToTopics(problem.topics);

    problem.topics = mappedTopics;
    problem.topicMappingMetadata = this.analyzeProblemTopics(problem.topics);

    await problem.save();

    return {
      problemId,
      originalTopics: problem.topics,
      mappedTopics,
      analysis: problem.topicMappingMetadata,
    };
  }

  /**
   * Batch map problems
   */
  async mapProblems(problemIds) {
    const results = [];

    for (const id of problemIds) {
      try {
        const result = await this.mapProblem(id);
        results.push(result);
      } catch (error) {
        results.push({
          problemId: id,
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Get topic dependency graph
   */
  getTopicDependencies() {
    return {
      'arrays': [],
      'linked-lists': ['arrays'],
      'stacks-queues': ['arrays', 'linked-lists'],
      'trees': ['arrays', 'recursion'],
      'binary-search-trees': ['trees'],
      'avl-trees': ['binary-search-trees'],
      'heaps': ['arrays', 'trees'],
      'graphs': ['arrays', 'linked-lists', 'queues'],
      'sorting': ['arrays'],
      'searching': ['arrays', 'sorting', 'binary-search'],
      'hash-tables': ['arrays'],
      'tries': ['trees', 'strings'],
      'dynamic-programming': ['recursion'],
      'greedy': [],
      'bit-manipulation': [],
      'string-manipulation': ['arrays'],
      'pattern-matching': ['strings', 'bit-manipulation'],
      'system-design': ['multithreading', 'database-design', 'caching'],
      'database-design': ['system-design'],
      'multithreading': ['locks-semaphores'],
      'recursion': [],
    };
  }

  /**
   * Suggest prerequisite topics for a topic
   */
  getPrerequisites(topic) {
    const dependencies = this.getTopicDependencies();
    return dependencies[topic] || [];
  }

  /**
   * Get topics that depend on this topic
   */
  getDependentTopics(topic) {
    const dependencies = this.getTopicDependencies();
    return Object.entries(dependencies)
      .filter(([_, deps]) => deps.includes(topic))
      .map(([t]) => t);
  }
}

module.exports = new TaxonomyService();
