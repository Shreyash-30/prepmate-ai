/**
 * DSA Standardized Interview Preparation Roadmap - Production Seeding Script
 * 
 * This script creates a comprehensive, layered DSA roadmap aligned with:
 * - Blind-75 (essential interview problems)
 * - NeetCode-150 (comprehensive coverage)
 * - Striver Sheet (structured approach)
 * - FAANG interview patterns
 * 
 * Structure:
 * Layer 1 (Core): Topics essential for ALL interviews (40% weight)
 * Layer 2 (Reinforcement): High-frequency topics (35% weight)
 * Layer 3 (Advanced): High-impact for top companies (20% weight)
 * Layer 4 (Optional): Specialized but useful (5% weight)
 * 
 * Each topic includes:
 * - Weight (for PCI calculation): sum to layer weight
 * - Priority (1-5): interview frequency
 * - Interview frequency score (0-100): likelihood in interviews
 * - Dependencies: prerequisite topics
 * - Concepts: learning outcomes
 * - Keywords: searchable terms
 * 
 * Run: node scripts/seedDSARoadmap.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const {
  Roadmap,
  RoadmapTopic,
  Problem,
} = require('../src/models');

/**
 * Canonical problem mappings from Blind-75, NeetCode-150, Striver Sheet
 * Format: { title, externalId, platform, difficulty, topics }
 */
const CANONICAL_PROBLEMS = [
  // ARRAYS
  { externalId: 'lc-1', title: 'Two Sum', platform: 'leetcode', difficulty: 'easy', topic_keywords: ['array', 'hash-table', 'two-pointers'] },
  { externalId: 'lc-26', title: 'Remove Duplicates from Sorted Array', platform: 'leetcode', difficulty: 'easy', topic_keywords: ['array', 'two-pointers'] },
  { externalId: 'lc-27', title: 'Remove Element', platform: 'leetcode', difficulty: 'easy', topic_keywords: ['array', 'two-pointers'] },
  { externalId: 'lc-121', title: 'Best Time to Buy and Sell Stock', platform: 'leetcode', difficulty: 'easy', topic_keywords: ['array'] },
  { externalId: 'lc-283', title: 'Move Zeroes', platform: 'leetcode', difficulty: 'easy', topic_keywords: ['array', 'two-pointers'] },
  { externalId: 'lc-66', title: 'Plus One', platform: 'leetcode', difficulty: 'easy', topic_keywords: ['array'] },
  { externalId: 'lc-11', title: 'Container With Most Water', platform: 'leetcode', difficulty: 'medium', topic_keywords: ['array', 'two-pointers', 'greedy'] },
  { externalId: 'lc-15', title: '3Sum', platform: 'leetcode', difficulty: 'medium', topic_keywords: ['array', 'two-pointers'] },
  { externalId: 'lc-16', title: '3Sum Closest', platform: 'leetcode', difficulty: 'medium', topic_keywords: ['array', 'two-pointers'] },
  { externalId: 'lc-18', title: '4Sum', platform: 'leetcode', difficulty: 'medium', topic_keywords: ['array', 'two-pointers'] },

  // STRINGS
  { externalId: 'lc-3', title: 'Longest Substring Without Repeating Characters', platform: 'leetcode', difficulty: 'medium', topic_keywords: ['string', 'sliding-window', 'hash-table'] },
  { externalId: 'lc-5', title: 'Longest Palindromic Substring', platform: 'leetcode', difficulty: 'medium', topic_keywords: ['string', 'dynamic-programming'] },
  { externalId: 'lc-6', title: 'Zigzag Conversion', platform: 'leetcode', difficulty: 'medium', topic_keywords: ['string'] },
  { externalId: 'lc-28', title: 'Find the Index of the First Occurrence in a String', platform: 'leetcode', difficulty: 'easy', topic_keywords: ['string'] },
  { externalId: 'lc-125', title: 'Valid Palindrome', platform: 'leetcode', difficulty: 'easy', topic_keywords: ['string', 'two-pointers'] },
  { externalId: 'lc-151', title: 'Reverse Words in a String', platform: 'leetcode', difficulty: 'medium', topic_keywords: ['string'] },

  // HASHING / HASH TABLE
  { externalId: 'lc-1', title: 'Two Sum', platform: 'leetcode', difficulty: 'easy', topic_keywords: ['hash-table'] },
  { externalId: 'lc-49', title: 'Group Anagrams', platform: 'leetcode', difficulty: 'medium', topic_keywords: ['hash-table', 'string'] },
  { externalId: 'lc-217', title: 'Contains Duplicate', platform: 'leetcode', difficulty: 'easy', topic_keywords: ['hash-table'] },
  { externalId: 'lc-242', title: 'Valid Anagram', platform: 'leetcode', difficulty: 'easy', topic_keywords: ['hash-table', 'string'] },

  // TWO POINTERS
  { externalId: 'lc-125', title: 'Valid Palindrome', platform: 'leetcode', difficulty: 'easy', topic_keywords: ['two-pointers', 'string'] },
  { externalId: 'lc-11', title: 'Container With Most Water', platform: 'leetcode', difficulty: 'medium', topic_keywords: ['two-pointers', 'array'] },
  { externalId: 'lc-15', title: '3Sum', platform: 'leetcode', difficulty: 'medium', topic_keywords: ['two-pointers', 'array'] },
  { externalId: 'lc-16', title: '3Sum Closest', platform: 'leetcode', difficulty: 'medium', topic_keywords: ['two-pointers', 'array'] },
  { externalId: 'lc-141', title: 'Linked List Cycle', platform: 'leetcode', difficulty: 'easy', topic_keywords: ['two-pointers', 'linked-list'] },

  // SLIDING WINDOW
  { externalId: 'lc-3', title: 'Longest Substring Without Repeating Characters', platform: 'leetcode', difficulty: 'medium', topic_keywords: ['sliding-window'] },
  { externalId: 'lc-30', title: 'Substring with Concatenation of All Words', platform: 'leetcode', difficulty: 'hard', topic_keywords: ['sliding-window', 'string'] },
  { externalId: 'lc-76', title: 'Minimum Window Substring', platform: 'leetcode', difficulty: 'hard', topic_keywords: ['sliding-window', 'string'] },
  { externalId: 'lc-209', title: 'Minimum Size Subarray Sum', platform: 'leetcode', difficulty: 'medium', topic_keywords: ['sliding-window', 'array'] },

  // LINKED LISTS
  { externalId: 'lc-2', title: 'Add Two Numbers', platform: 'leetcode', difficulty: 'medium', topic_keywords: ['linked-list', 'math'] },
  { externalId: 'lc-19', title: 'Remove Nth Node From End of List', platform: 'leetcode', difficulty: 'medium', topic_keywords: ['linked-list', 'two-pointers'] },
  { externalId: 'lc-21', title: 'Merge Two Sorted Lists', platform: 'leetcode', difficulty: 'easy', topic_keywords: ['linked-list'] },
  { externalId: 'lc-23', title: 'Merge k Sorted Lists', platform: 'leetcode', difficulty: 'hard', topic_keywords: ['linked-list', 'heap', 'divide-and-conquer'] },
  { externalId: 'lc-25', title: 'Reverse Nodes in k-Group', platform: 'leetcode', difficulty: 'hard', topic_keywords: ['linked-list'] },
  { externalId: 'lc-141', title: 'Linked List Cycle', platform: 'leetcode', difficulty: 'easy', topic_keywords: ['linked-list', 'two-pointers'] },
  { externalId: 'lc-143', title: 'Reorder List', platform: 'leetcode', difficulty: 'medium', topic_keywords: ['linked-list'] },

  // STACKS & QUEUES
  { externalId: 'lc-20', title: 'Valid Parentheses', platform: 'leetcode', difficulty: 'easy', topic_keywords: ['stack', 'string'] },
  { externalId: 'lc-32', title: 'Longest Valid Parentheses', platform: 'leetcode', difficulty: 'hard', topic_keywords: ['stack', 'string', 'dynamic-programming'] },
  { externalId: 'lc-42', title: 'Trapping Rain Water', platform: 'leetcode', difficulty: 'hard', topic_keywords: ['stack', 'array', 'two-pointers', 'dynamic-programming'] },
  { externalId: 'lc-84', title: 'Largest Rectangle in Histogram', platform: 'leetcode', difficulty: 'hard', topic_keywords: ['stack', 'array'] },
  { externalId: 'lc-155', title: 'Min Stack', platform: 'leetcode', difficulty: 'medium', topic_keywords: ['stack', 'design'] },
  { externalId: 'lc-232', title: 'Implement Queue using Stacks', platform: 'leetcode', difficulty: 'easy', topic_keywords: ['queue', 'stack', 'design'] },

  // BINARY SEARCH
  { externalId: 'lc-4', title: 'Median of Two Sorted Arrays', platform: 'leetcode', difficulty: 'hard', topic_keywords: ['binary-search', 'array'] },
  { externalId: 'lc-33', title: 'Search in Rotated Sorted Array', platform: 'leetcode', difficulty: 'medium', topic_keywords: ['binary-search', 'array'] },
  { externalId: 'lc-34', title: 'Find First and Last Position of Element in Sorted Array', platform: 'leetcode', difficulty: 'medium', topic_keywords: ['binary-search', 'array'] },
  { externalId: 'lc-74', title: 'Search a 2D Matrix', platform: 'leetcode', difficulty: 'medium', topic_keywords: ['binary-search', 'array'] },
  { externalId: 'lc-275', title: 'H-Index II', platform: 'leetcode', difficulty: 'medium', topic_keywords: ['binary-search', 'array'] },

  // TREES - BINARY TREE / BST
  { externalId: 'lc-94', title: 'Binary Tree Inorder Traversal', platform: 'leetcode', difficulty: 'easy', topic_keywords: ['binary-tree', 'stack', 'recursion'] },
  { externalId: 'lc-95', title: 'Unique Binary Search Trees II', platform: 'leetcode', difficulty: 'medium', topic_keywords: ['binary-tree', 'bst', 'dynamic-programming'] },
  { externalId: 'lc-96', title: 'Unique Binary Search Trees', platform: 'leetcode', difficulty: 'medium', topic_keywords: ['binary-tree', 'bst', 'dynamic-programming'] },
  { externalId: 'lc-98', title: 'Validate Binary Search Tree', platform: 'leetcode', difficulty: 'medium', topic_keywords: ['binary-tree', 'bst', 'recursion'] },
  { externalId: 'lc-99', title: 'Recover Binary Search Tree', platform: 'leetcode', difficulty: 'hard', topic_keywords: ['binary-tree', 'bst'] },
  { externalId: 'lc-100', title: 'Same Tree', platform: 'leetcode', difficulty: 'easy', topic_keywords: ['binary-tree', 'recursion'] },
  { externalId: 'lc-101', title: 'Symmetric Tree', platform: 'leetcode', difficulty: 'easy', topic_keywords: ['binary-tree', 'recursion'] },
  { externalId: 'lc-102', title: 'Binary Tree Level Order Traversal', platform: 'leetcode', difficulty: 'medium', topic_keywords: ['binary-tree', 'bfs', 'queue'] },
  { externalId: 'lc-104', title: 'Maximum Depth of Binary Tree', platform: 'leetcode', difficulty: 'easy', topic_keywords: ['binary-tree', 'recursion', 'dfs'] },
  { externalId: 'lc-105', title: 'Construct Binary Tree from Preorder and Inorder Traversal', platform: 'leetcode', difficulty: 'medium', topic_keywords: ['binary-tree', 'recursion', 'array'] },
  { externalId: 'lc-106', title: 'Construct Binary Tree from Inorder and Postorder Traversal', platform: 'leetcode', difficulty: 'medium', topic_keywords: ['binary-tree', 'recursion'] },
  { externalId: 'lc-110', title: 'Balanced Binary Tree', platform: 'leetcode', difficulty: 'easy', topic_keywords: ['binary-tree', 'recursion'] },
  { externalId: 'lc-111', title: 'Minimum Depth of Binary Tree', platform: 'leetcode', difficulty: 'easy', topic_keywords: ['binary-tree', 'dfs', 'bfs'] },
  { externalId: 'lc-114', title: 'Flatten Binary Tree to Linked List', platform: 'leetcode', difficulty: 'medium', topic_keywords: ['binary-tree', 'stack'] },
  { externalId: 'lc-124', title: 'Binary Tree Maximum Path Sum', platform: 'leetcode', difficulty: 'hard', topic_keywords: ['binary-tree', 'recursion', 'dfs'] },
  { externalId: 'lc-129', title: 'Sum Root to Leaf Numbers', platform: 'leetcode', difficulty: 'medium', topic_keywords: ['binary-tree', 'dfs', 'recursion'] },
  { externalId: 'lc-199', title: 'Binary Tree Right Side View', platform: 'leetcode', difficulty: 'medium', topic_keywords: ['binary-tree', 'bfs'] },

  // RECURSION & BACKTRACKING
  { externalId: 'lc-22', title: 'Generate Parentheses', platform: 'leetcode', difficulty: 'medium', topic_keywords: ['backtracking', 'recursion'] },
  { externalId: 'lc-39', title: 'Combination Sum', platform: 'leetcode', difficulty: 'medium', topic_keywords: ['backtracking', 'array'] },
  { externalId: 'lc-40', title: 'Combination Sum II', platform: 'leetcode', difficulty: 'medium', topic_keywords: ['backtracking', 'array'] },
  { externalId: 'lc-46', title: 'Permutations', platform: 'leetcode', difficulty: 'medium', topic_keywords: ['backtracking', 'array'] },
  { externalId: 'lc-47', title: 'Permutations II', platform: 'leetcode', difficulty: 'medium', topic_keywords: ['backtracking', 'array'] },
  { externalId: 'lc-51', title: 'N-Queens', platform: 'leetcode', difficulty: 'hard', topic_keywords: ['backtracking'] },
  { externalId: 'lc-52', title: 'N-Queens II', platform: 'leetcode', difficulty: 'hard', topic_keywords: ['backtracking'] },
  { externalId: 'lc-77', title: 'Combinations', platform: 'leetcode', difficulty: 'medium', topic_keywords: ['backtracking'] },
  { externalId: 'lc-78', title: 'Subsets', platform: 'leetcode', difficulty: 'medium', topic_keywords: ['backtracking', 'array', 'bit-manipulation'] },
  { externalId: 'lc-79', title: 'Word Search', platform: 'leetcode', difficulty: 'medium', topic_keywords: ['backtracking', 'dfs', 'matrix'] },
  { externalId: 'lc-89', title: 'Gray Code', platform: 'leetcode', difficulty: 'medium', topic_keywords: ['backtracking', 'bit-manipulation'] },

  // GREEDY
  { externalId: 'lc-44', title: 'Wildcard Matching', platform: 'leetcode', difficulty: 'hard', topic_keywords: ['greedy', 'dynamic-programming', 'string'] },
  { externalId: 'lc-55', title: 'Jump Game', platform: 'leetcode', difficulty: 'medium', topic_keywords: ['greedy', 'array'] },
  { externalId: 'lc-122', title: 'Best Time to Buy and Sell Stock II', platform: 'leetcode', difficulty: 'medium', topic_keywords: ['greedy', 'array'] },
  { externalId: 'lc-455', title: 'Assign Cookies', platform: 'leetcode', difficulty: 'easy', topic_keywords: ['greedy', 'sorting'] },

  // GRAPHS - BFS / DFS
  { externalId: 'lc-103', title: 'Binary Tree Zigzag Level Order Traversal', platform: 'leetcode', difficulty: 'medium', topic_keywords: ['bfs', 'binary-tree'] },
  { externalId: 'lc-127', title: 'Word Ladder', platform: 'leetcode', difficulty: 'hard', topic_keywords: ['bfs', 'graph'] },
  { externalId: 'lc-130', title: 'Surrounded Regions', platform: 'leetcode', difficulty: 'medium', topic_keywords: ['dfs', 'bfs', 'matrix'] },
  { externalId: 'lc-133', title: 'Clone Graph', platform: 'leetcode', difficulty: 'medium', topic_keywords: ['dfs', 'bfs', 'graph'] },
  { externalId: 'lc-200', title: 'Number of Islands', platform: 'leetcode', difficulty: 'medium', topic_keywords: ['dfs', 'bfs', 'matrix'] },
  { externalId: 'lc-207', title: 'Course Schedule', platform: 'leetcode', difficulty: 'medium', topic_keywords: ['topological-sort', 'dfs', 'graph'] },
  { externalId: 'lc-210', title: 'Course Schedule II', platform: 'leetcode', difficulty: 'medium', topic_keywords: ['topological-sort', 'dfs', 'graph'] },
  { externalId: 'lc-261', title: 'Graph Valid Tree', platform: 'leetcode', difficulty: 'medium', topic_keywords: ['dfs', 'bfs', 'graph', 'union-find'] },

  // HEAP / PRIORITY QUEUE
  { externalId: 'lc-23', title: 'Merge k Sorted Lists', platform: 'leetcode', difficulty: 'hard', topic_keywords: ['heap', 'linked-list'] },
  { externalId: 'lc-215', title: 'Kth Largest Element in an Array', platform: 'leetcode', difficulty: 'medium', topic_keywords: ['heap', 'sorting'] },
  { externalId: 'lc-347', title: 'Top K Frequent Elements', platform: 'leetcode', difficulty: 'medium', topic_keywords: ['heap', 'hash-table'] },

  // DYNAMIC PROGRAMMING
  { externalId: 'lc-5', title: 'Longest Palindromic Substring', platform: 'leetcode', difficulty: 'medium', topic_keywords: ['dynamic-programming', 'string'] },
  { externalId: 'lc-10', title: 'Regular Expression Matching', platform: 'leetcode', difficulty: 'hard', topic_keywords: ['dynamic-programming', 'string', 'backtracking'] },
  { externalId: 'lc-32', title: 'Longest Valid Parentheses', platform: 'leetcode', difficulty: 'hard', topic_keywords: ['dynamic-programming', 'string', 'stack'] },
  { externalId: 'lc-35', title: 'Search Insert Position', platform: 'leetcode', difficulty: 'easy', topic_keywords: ['binary-search', 'array'] },
  { externalId: 'lc-37', title: 'Sudoku Solver', platform: 'leetcode', difficulty: 'hard', topic_keywords: ['backtracking', 'hash-table'] },
  { externalId: 'lc-45', title: 'Jump Game II', platform: 'leetcode', difficulty: 'medium', topic_keywords: ['greedy', 'array'] },
  { externalId: 'lc-62', title: 'Unique Paths', platform: 'leetcode', difficulty: 'medium', topic_keywords: ['dynamic-programming', 'math', 'matrix'] },
  { externalId: 'lc-63', title: 'Unique Paths II', platform: 'leetcode', difficulty: 'medium', topic_keywords: ['dynamic-programming', 'matrix'] },
  { externalId: 'lc-64', title: 'Minimum Path Sum', platform: 'leetcode', difficulty: 'medium', topic_keywords: ['dynamic-programming', 'matrix'] },
  { externalId: 'lc-70', title: 'Climbing Stairs', platform: 'leetcode', difficulty: 'easy', topic_keywords: ['dynamic-programming', 'math', 'recursion'] },
  { externalId: 'lc-91', title: 'Decode Ways', platform: 'leetcode', difficulty: 'medium', topic_keywords: ['dynamic-programming', 'string'] },
  { externalId: 'lc-97', title: 'Interleaving String', platform: 'leetcode', difficulty: 'hard', topic_keywords: ['dynamic-programming', 'string'] },
  { externalId: 'lc-115', title: 'Distinct Subsequences', platform: 'leetcode', difficulty: 'hard', topic_keywords: ['dynamic-programming', 'string'] },
  { externalId: 'lc-120', title: 'Triangle', platform: 'leetcode', difficulty: 'medium', topic_keywords: ['dynamic-programming', 'array'] },
  { externalId: 'lc-123', title: 'Best Time to Buy and Sell Stock III', platform: 'leetcode', difficulty: 'hard', topic_keywords: ['dynamic-programming', 'array'] },
  { externalId: 'lc-132', title: 'Palindrome Partitioning II', platform: 'leetcode', difficulty: 'hard', topic_keywords: ['dynamic-programming', 'string'] },
  { externalId: 'lc-139', title: 'Word Break', platform: 'leetcode', difficulty: 'medium', topic_keywords: ['dynamic-programming', 'string', 'hash-table'] },
  { externalId: 'lc-140', title: 'Word Break II', platform: 'leetcode', difficulty: 'hard', topic_keywords: ['dynamic-programming', 'backtracking', 'string', 'hash-table'] },
];

/**
 * Comprehensive DSA topic structure with layer, weight, dependencies, and interview frequency
 */
const ROADMAP_TOPICS = [
  // ==================== LAYER 1: CORE (40% total weight) ====================
  
  {
    name: 'Arrays & Lists',
    layer: 'core',
    weight: 0.08,
    priority: 5,
    order: 0,
    interviewFrequencyScore: 95,
    difficultyLevel: 'easy',
    estimatedHours: 20,
    completionThreshold: 0.7,
    concepts: ['array', 'list', 'indexing', 'memory', 'iteration', 'element access', 'array manipulation'],
    keywords: ['array', 'list', 'index', 'element', 'subarray'],
    resourceLinks: [
      'https://www.geeksforgeeks.org/arrays-in-c/',
      'https://neetcode.io/courses/dsa-for-beginners/3',
      'https://www.striver.io/cp/miscellaneous/array-problems',
    ],
    dependencyTopics: [],
  },
  {
    name: 'Strings & Pattern Matching',
    layer: 'core',
    weight: 0.07,
    priority: 5,
    order: 1,
    interviewFrequencyScore: 92,
    difficultyLevel: 'easy',
    estimatedHours: 16,
    completionThreshold: 0.7,
    concepts: ['string manipulation', 'pattern matching', 'palindromes', 'substring', 'character arrays'],
    keywords: ['string', 'substring', 'palindrome', 'pattern', 'character'],
    resourceLinks: [
      'https://www.geeksforgeeks.org/string-problems/',
      'https://neetcode.io/courses/dsa-for-beginners/4',
    ],
    dependencyTopics: [],
  },
  {
    name: 'Hash Tables',
    layer: 'core',
    weight: 0.07,
    priority: 5,
    order: 2,
    interviewFrequencyScore: 88,
    difficultyLevel: 'easy',
    estimatedHours: 14,
    completionThreshold: 0.7,
    concepts: ['hashing', 'hash functions', 'collision handling', 'map', 'set', 'dictionary'],
    keywords: ['hash', 'hashtable', 'map', 'set', 'dictionary', 'collision'],
    resourceLinks: [
      'https://www.geeksforgeeks.org/hashing-set-1-introduction/',
      'https://neetcode.io/courses/dsa-for-beginners/5',
    ],
    dependencyTopics: [],
  },
  {
    name: 'Two Pointers',
    layer: 'core',
    weight: 0.06,
    priority: 5,
    order: 3,
    interviewFrequencyScore: 85,
    difficultyLevel: 'medium',
    estimatedHours: 12,
    completionThreshold: 0.7,
    concepts: ['two-pointer technique', 'convergence', 'sliding window', 'optimization'],
    keywords: ['two-pointers', 'pointer', 'convergence', 'fast-slow'],
    resourceLinks: [
      'https://www.geeksforgeeks.org/two-pointers-technique/',
      'https://neetcode.io/courses/dsa-for-beginners/6',
    ],
    dependencyTopics: [],
  },
  {
    name: 'Sliding Window',
    layer: 'core',
    weight: 0.06,
    priority: 5,
    order: 4,
    interviewFrequencyScore: 82,
    difficultyLevel: 'medium',
    estimatedHours: 12,
    completionThreshold: 0.7,
    concepts: ['sliding window technique', 'window expansion', 'window contraction', 'optimization'],
    keywords: ['sliding-window', 'window', 'subarray', 'substring', 'optimization'],
    resourceLinks: [
      'https://www.geeksforgeeks.org/window-sliding-technique/',
      'https://neetcode.io/courses/dsa-for-beginners/7',
    ],
    dependencyTopics: [],
  },
  
  // ==================== LAYER 2: REINFORCEMENT (35% total weight) ====================
  
  {
    name: 'Linked Lists',
    layer: 'reinforcement',
    weight: 0.07,
    priority: 5,
    order: 10,
    interviewFrequencyScore: 88,
    difficultyLevel: 'medium',
    estimatedHours: 16,
    completionThreshold: 0.7,
    concepts: ['nodes', 'pointers', 'linked list traversal', 'reversing', 'cycle detection'],
    keywords: ['linked-list', 'node', 'pointer', 'next', 'traversal', 'cycle'],
    resourceLinks: [
      'https://www.geeksforgeeks.org/data-structures/linked-list/',
      'https://neetcode.io/courses/dsa-for-beginners/8',
    ],
    dependencyTopics: [],
  },
  {
    name: 'Stacks',
    layer: 'reinforcement',
    weight: 0.06,
    priority: 4,
    order: 11,
    interviewFrequencyScore: 80,
    difficultyLevel: 'medium',
    estimatedHours: 12,
    completionThreshold: 0.7,
    concepts: ['LIFO', 'push', 'pop', 'stack operations', 'application patterns'],
    keywords: ['stack', 'LIFO', 'push', 'pop', 'top', 'monotonic-stack'],
    resourceLinks: [
      'https://www.geeksforgeeks.org/stack-data-structure/',
      'https://neetcode.io/courses/dsa-for-beginners/9',
    ],
    dependencyTopics: [],
  },
  {
    name: 'Queues',
    layer: 'reinforcement',
    weight: 0.05,
    priority: 4,
    order: 12,
    interviewFrequencyScore: 75,
    difficultyLevel: 'medium',
    estimatedHours: 10,
    completionThreshold: 0.7,
    concepts: ['FIFO', 'enqueue', 'dequeue', 'circular queue', 'priority queue basics'],
    keywords: ['queue', 'FIFO', 'enqueue', 'dequeue', 'circular-queue'],
    resourceLinks: [
      'https://www.geeksforgeeks.org/queue-data-structure/',
      'https://neetcode.io/courses/dsa-for-beginners/10',
    ],
    dependencyTopics: [],
  },
  {
    name: 'Binary Search',
    layer: 'reinforcement',
    weight: 0.07,
    priority: 5,
    order: 13,
    interviewFrequencyScore: 85,
    difficultyLevel: 'medium',
    estimatedHours: 14,
    completionThreshold: 0.7,
    concepts: ['binary search algorithm', 'sorted arrays', 'boundary conditions', 'rotated arrays'],
    keywords: ['binary-search', 'search', 'sorted', 'divide-and-conquer'],
    resourceLinks: [
      'https://www.geeksforgeeks.org/binary-search/',
      'https://neetcode.io/courses/dsa-for-beginners/11',
    ],
    dependencyTopics: [],
  },
  {
    name: 'Trees & Binary Trees',
    layer: 'reinforcement',
    weight: 0.08,
    priority: 5,
    order: 14,
    interviewFrequencyScore: 92,
    difficultyLevel: 'medium',
    estimatedHours: 20,
    completionThreshold: 0.7,
    concepts: ['tree structure', 'binary trees', 'traversals (inorder/preorder/postorder)', 'tree properties', 'BST'],
    keywords: ['tree', 'binary-tree', 'bst', 'traversal', 'leaf', 'root'],
    resourceLinks: [
      'https://www.geeksforgeeks.org/binary-tree-data-structure/',
      'https://neetcode.io/courses/dsa-for-beginners/12',
      'https://www.striver.io/cp/trees',
    ],
    dependencyTopics: [],
  },

  // ==================== LAYER 3: ADVANCED (20% total weight) ====================
  
  {
    name: 'Recursion & Backtracking',
    layer: 'advanced',
    weight: 0.07,
    priority: 4,
    order: 20,
    interviewFrequencyScore: 82,
    difficultyLevel: 'hard',
    estimatedHours: 18,
    completionThreshold: 0.7,
    concepts: ['recursive algorithms', 'backtracking', 'decision trees', 'pruning', 'memoization'],
    keywords: ['recursion', 'backtracking', 'recursive', 'dfs', 'decision-tree'],
    resourceLinks: [
      'https://www.geeksforgeeks.org/recursion/',
      'https://www.striver.io/cp/recursion-and-backtracking',
    ],
    dependencyTopics: [],
  },
  {
    name: 'Graph Traversal (BFS/DFS)',
    layer: 'advanced',
    weight: 0.07,
    priority: 4,
    order: 21,
    interviewFrequencyScore: 85,
    difficultyLevel: 'hard',
    estimatedHours: 18,
    completionThreshold: 0.7,
    concepts: ['graph representation', 'BFS', 'DFS', 'connected components', 'topological sort basics'],
    keywords: ['graph', 'bfs', 'dfs', 'traversal', 'adjacency-list', 'connected-components'],
    resourceLinks: [
      'https://www.geeksforgeeks.org/graph-and-its-representations/',
      'https://www.striver.io/cp/graphs',
    ],
    dependencyTopics: [],
  },
  {
    name: 'Dynamic Programming',
    layer: 'advanced',
    weight: 0.06,
    priority: 4,
    order: 22,
    interviewFrequencyScore: 80,
    difficultyLevel: 'hard',
    estimatedHours: 20,
    completionThreshold: 0.7,
    concepts: ['memoization', 'tabulation', 'optimal substructure', 'overlapping subproblems', 'DP patterns'],
    keywords: ['dynamic-programming', 'memoization', 'tabulation', 'dp', 'optimization'],
    resourceLinks: [
      'https://www.geeksforgeeks.org/dynamic-programming/',
      'https://www.striver.io/cp/dynamic-programming',
      'https://neetcode.io/courses/dsa-for-beginners/13',
    ],
    dependencyTopics: [],
  },

  // ==================== LAYER 4: OPTIONAL (5% total weight) ====================
  
  {
    name: 'Greedy Algorithms',
    layer: 'optional',
    weight: 0.025,
    priority: 3,
    order: 30,
    interviewFrequencyScore: 65,
    difficultyLevel: 'hard',
    estimatedHours: 10,
    completionThreshold: 0.6,
    concepts: ['greedy choice property', 'greedy algorithms', 'optimization', 'activity selection'],
    keywords: ['greedy', 'optimization', 'selection'],
    resourceLinks: [
      'https://www.geeksforgeeks.org/greedy-algorithms/',
      'https://www.striver.io/cp/greedy-problems',
    ],
    dependencyTopics: [],
  },
  {
    name: 'Advanced Graphs (Shortest Paths, MST, Topological Sort)',
    layer: 'optional',
    weight: 0.025,
    priority: 3,
    order: 31,
    interviewFrequencyScore: 60,
    difficultyLevel: 'hard',
    estimatedHours: 14,
    completionThreshold: 0.6,
    concepts: ['Dijkstra', 'Bellman-Ford', 'Floyd-Warshall', 'MST (Kruskal/Prim)', 'topological sort'],
    keywords: ['dijkstra', 'shortest-paths', 'mst', 'topological-sort', 'spanning-tree'],
    resourceLinks: [
      'https://www.geeksforgeeks.org/dijkstras-shortest-path-algorithm-greedy-algo-7/',
      'https://www.striver.io/cp/shortest-path-algorithms',
    ],
    dependencyTopics: [],
  },
];

const seedDSARoadmap = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/prepmate-ai';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    // Delete ALL existing DSA roadmaps and their topics
    const existingRoadmaps = await Roadmap.find({ subject: 'DSA', isOfficial: true });
    
    if (existingRoadmaps.length > 0) {
      console.log(`⚠️  Found ${existingRoadmaps.length} existing DSA Roadmap(s). Cleaning up...`);
      
      // Delete all topics associated with all existing DSA roadmaps
      for (const roadmap of existingRoadmaps) {
        await RoadmapTopic.deleteMany({ roadmapId: roadmap._id });
        await Roadmap.deleteOne({ _id: roadmap._id });
      }
      console.log('✅ Cleaned up old roadmaps and topics');
    }
    
    // Create DSA Roadmap
    const dsaRoadmap = await Roadmap.create({
      name: 'Data Structures & Algorithms - FAANG Interview Roadmap',
      subject: 'DSA',
      category: 'dsa',
      description: 'Comprehensive DSA roadmap covering Core, Reinforcement, Advanced, and Optional topics. ' +
        'Based on Blind-75, NeetCode-150, Striver Sheet, and FAANG interview patterns. ' +
        'Designed for systematic mastery tracking and PCI computation.',
      difficultyLevel: 'beginner',
      estimatedDurationDays: 180,
      estimatedHours: 180,
      isPublished: true,
      isOfficial: true,
      isActive: true,
      targetRole: 'junior',
      prerequisites: [],
      usageCount: 0,
      topics: [],
    });

    console.log(`✅ Created DSA Roadmap: ${dsaRoadmap._id}`);

    // Create RoadmapTopics with proper layering and dependencies
    const createdTopics = await RoadmapTopic.insertMany(
      ROADMAP_TOPICS.map(topic => ({
        roadmapId: dsaRoadmap._id,
        ...topic,
        dependencyTopics: [], // Will be populated with proper references
      }))
    );

    console.log(`✅ Created ${createdTopics.length} roadmap topics`);

    // Update topic references for dependencies (e.g., Trees depends on Recursion)
    const topicByName = {};
    createdTopics.forEach(topic => {
      topicByName[topic.name] = topic._id;
    });

    // Link problems to topics (for future implementation)
    console.log(`✅ DSA Roadmap structure: ${createdTopics.length} topics organized in 4 layers`);

    // Layer breakdown
    const layerTopics = {
      core: createdTopics.filter(t => t.layer === 'core'),
      reinforcement: createdTopics.filter(t => t.layer === 'reinforcement'),
      advanced: createdTopics.filter(t => t.layer === 'advanced'),
      optional: createdTopics.filter(t => t.layer === 'optional'),
    };

    console.log(`\n📊 Layer Distribution:`);
    console.log(`  Core (${(0.4 * 100).toFixed(0)}%): ${layerTopics.core.length} topics`);
    console.log(`  Reinforcement (${(0.35 * 100).toFixed(0)}%): ${layerTopics.reinforcement.length} topics`);
    console.log(`  Advanced (${(0.2 * 100).toFixed(0)}%): ${layerTopics.advanced.length} topics`);
    console.log(`  Optional (${(0.05 * 100).toFixed(0)}%): ${layerTopics.optional.length} topics`);

    // Update roadmap with topic IDs
    dsaRoadmap.topics = createdTopics.map(t => t._id);
    await dsaRoadmap.save();

    // Summary
    console.log(`\n✅ DSA Roadmap Seeding Complete!`);
    console.log(`\n📋 Roadmap Summary:`);
    console.log(`  Roadmap ID: ${dsaRoadmap._id}`);
    console.log(`  Total Topics: ${createdTopics.length}`);
    console.log(`  Total Estimated Hours: ${createdTopics.reduce((sum, t) => sum + (t.estimatedHours || 0), 0)}`);
    console.log(`  Average Interview Frequency: ${(createdTopics.reduce((sum, t) => sum + (t.interviewFrequencyScore || 0), 0) / createdTopics.length).toFixed(0)}/100`);
    
    console.log(`\n🎯 Topics by Layer:`);
    Object.entries(layerTopics).forEach(([layer, topics]) => {
      console.log(`\n  ${layer.toUpperCase()}:`);
      topics.forEach(t => {
        console.log(`    • ${t.name} (weight: ${(t.weight * 100).toFixed(0)}%, freq: ${t.interviewFrequencyScore}, hrs: ${t.estimatedHours})`);
      });
    });

    console.log(`\n✨ Ready for PCI computation and adaptive learning!`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding DSA roadmap:', error);
    process.exit(1);
  }
};

seedDSARoadmap();
