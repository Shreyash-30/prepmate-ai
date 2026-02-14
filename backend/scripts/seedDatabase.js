/**
 * Database Seed Script
 * Populates MongoDB with sample data for development and testing
 * Run: node scripts/seedDatabase.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const {
  User,
  Problem,
  Topic,
  PlatformIntegration,
} = require('../src/models');

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing data (Roadmaps handled separately in seedDSARoadmap.js)
    await Promise.all([
      User.deleteMany({}),
      Problem.deleteMany({}),
      Topic.deleteMany({}),
      PlatformIntegration.deleteMany({}),
    ]);
    console.log('Cleared existing data');

    // Create seed users (using .create() to trigger password hashing middleware)
    const users = await Promise.all([
      User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'TestPassword123!',
        role: 'student',
        targetCompanies: ['Google', 'Microsoft', 'Amazon'],
        preparationStartDate: new Date('2026-01-01'),
        preparationTargetDate: new Date('2026-06-30'),
        onboardingCompleted: true,
        isActive: true,
      }),
      User.create({
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: 'TestPassword123!',
        role: 'student',
        targetCompanies: ['Meta', 'Apple'],
        preparationStartDate: new Date('2026-02-01'),
        preparationTargetDate: new Date('2026-07-15'),
        onboardingCompleted: false,
        isActive: true,
      }),
      User.create({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'AdminPassword123!',
        role: 'admin',
        onboardingCompleted: true,
        isActive: true,
      }),
    ]);
    console.log(`Created ${users.length} users`);

    // Create seed problems - EXPANDED LeetCode problem set
    // 50+ problems covering all DSA topics
    const problems = await Problem.insertMany([
      // ========== ARRAYS & LISTS (10 problems) ==========
      { externalId: 'lc-1', title: 'Two Sum', difficulty: 'easy', topics: ['array', 'hash-table'], platform: 'leetcode', url: 'https://leetcode.com/problems/two-sum/', acceptanceRate: 47.3 },
      { externalId: 'lc-26', title: 'Remove Duplicates from Sorted Array', difficulty: 'easy', topics: ['array'], platform: 'leetcode', url: 'https://leetcode.com/problems/remove-duplicates-from-sorted-array/', acceptanceRate: 51.8 },
      { externalId: 'lc-27', title: 'Remove Element', difficulty: 'easy', topics: ['array'], platform: 'leetcode', url: 'https://leetcode.com/problems/remove-element/', acceptanceRate: 55.2 },
      { externalId: 'lc-35', title: 'Search Insert Position', difficulty: 'easy', topics: ['array', 'binary-search'], platform: 'leetcode', url: 'https://leetcode.com/problems/search-insert-position/', acceptanceRate: 43.5 },
      { externalId: 'lc-66', title: 'Plus One', difficulty: 'easy', topics: ['array', 'math'], platform: 'leetcode', url: 'https://leetcode.com/problems/plus-one/', acceptanceRate: 42.7 },
      { externalId: 'lc-88', title: 'Merge Sorted Array', difficulty: 'easy', topics: ['array', 'two-pointers'], platform: 'leetcode', url: 'https://leetcode.com/problems/merge-sorted-array/', acceptanceRate: 45.2 },
      { externalId: 'lc-189', title: 'Rotate Array', difficulty: 'medium', topics: ['array'], platform: 'leetcode', url: 'https://leetcode.com/problems/rotate-array/', acceptanceRate: 39.2 },
      { externalId: 'lc-217', title: 'Contains Duplicate', difficulty: 'easy', topics: ['array', 'hash-table'], platform: 'leetcode', url: 'https://leetcode.com/problems/contains-duplicate/', acceptanceRate: 63.7 },
      { externalId: 'lc-238', title: 'Product of Array Except Self', difficulty: 'medium', topics: ['array'], platform: 'leetcode', url: 'https://leetcode.com/problems/product-of-array-except-self/', acceptanceRate: 64.5 },
      { externalId: 'lc-283', title: 'Move Zeroes', difficulty: 'easy', topics: ['array', 'two-pointers'], platform: 'leetcode', url: 'https://leetcode.com/problems/move-zeroes/', acceptanceRate: 63.2 },

      // ========== STRINGS & PATTERN MATCHING (8 problems) ==========
      { externalId: 'lc-3', title: 'Longest Substring Without Repeating Characters', difficulty: 'medium', topics: ['string', 'sliding-window', 'hash-table'], platform: 'leetcode', url: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/', acceptanceRate: 33.5 },
      { externalId: 'lc-14', title: 'Longest Common Prefix', difficulty: 'easy', topics: ['string'], platform: 'leetcode', url: 'https://leetcode.com/problems/longest-common-prefix/', acceptanceRate: 40.5 },
      { externalId: 'lc-28', title: 'Find the Index of the First Occurrence in a String', difficulty: 'easy', topics: ['string'], platform: 'leetcode', url: 'https://leetcode.com/problems/find-the-index-of-the-first-occurrence-in-a-string/', acceptanceRate: 38.2 },
      { externalId: 'lc-151', title: 'Reverse Words in a String', difficulty: 'medium', topics: ['string'], platform: 'leetcode', url: 'https://leetcode.com/problems/reverse-words-in-a-string/', acceptanceRate: 39.5 },
      { externalId: 'lc-205', title: 'Isomorphic Strings', difficulty: 'easy', topics: ['string', 'hash-table'], platform: 'leetcode', url: 'https://leetcode.com/problems/isomorphic-strings/', acceptanceRate: 41.8 },
      { externalId: 'lc-242', title: 'Valid Anagram', difficulty: 'easy', topics: ['string', 'hash-table', 'sorting'], platform: 'leetcode', url: 'https://leetcode.com/problems/valid-anagram/', acceptanceRate: 68.5 },
      { externalId: 'lc-290', title: 'Word Pattern', difficulty: 'easy', topics: ['string', 'hash-table'], platform: 'leetcode', url: 'https://leetcode.com/problems/word-pattern/', acceptanceRate: 41.2 },
      { externalId: 'lc-344', title: 'Reverse String', difficulty: 'easy', topics: ['string', 'two-pointers'], platform: 'leetcode', url: 'https://leetcode.com/problems/reverse-string/', acceptanceRate: 79.5 },

      // ========== HASH TABLES (8 problems) ==========
      { externalId: 'lc-49', title: 'Group Anagrams', difficulty: 'medium', topics: ['hash-table', 'string', 'sorting'], platform: 'leetcode', url: 'https://leetcode.com/problems/group-anagrams/', acceptanceRate: 65.8 },
      { externalId: 'lc-128', title: 'Longest Consecutive', difficulty: 'medium', topics: ['hash-table', 'array'], platform: 'leetcode', url: 'https://leetcode.com/problems/longest-consecutive/', acceptanceRate: 48.5 },
      { externalId: 'lc-136', title: 'Single Number', difficulty: 'easy', topics: ['array', 'bit-manipulation', 'hash-table'], platform: 'leetcode', url: 'https://leetcode.com/problems/single-number/', acceptanceRate: 71.8 },
      { externalId: 'lc-169', title: 'Majority Element', difficulty: 'easy', topics: ['array', 'hash-table'], platform: 'leetcode', url: 'https://leetcode.com/problems/majority-element/', acceptanceRate: 63.2 },
      { externalId: 'lc-202', title: 'Happy Number', difficulty: 'easy', topics: ['hash-table', 'math'], platform: 'leetcode', url: 'https://leetcode.com/problems/happy-number/', acceptanceRate: 53.2 },
      { externalId: 'lc-260', title: 'Single Number III', difficulty: 'medium', topics: ['array', 'bit-manipulation'], platform: 'leetcode', url: 'https://leetcode.com/problems/single-number-iii/', acceptanceRate: 62.8 },
      { externalId: 'lc-349', title: 'Intersection of Two Arrays', difficulty: 'easy', topics: ['array', 'hash-table', 'two-pointers', 'binary-search', 'sorting'], platform: 'leetcode', url: 'https://leetcode.com/problems/intersection-of-two-arrays/', acceptanceRate: 68.5 },
      { externalId: 'lc-350', title: 'Intersection of Two Arrays II', difficulty: 'easy', topics: ['array', 'hash-table', 'two-pointers', 'binary-search', 'sorting'], platform: 'leetcode', url: 'https://leetcode.com/problems/intersection-of-two-arrays-ii/', acceptanceRate: 60.2 },

      // ========== TWO POINTERS (7 problems) ==========
      { externalId: 'lc-11', title: 'Container With Most Water', difficulty: 'medium', topics: ['array', 'two-pointers', 'greedy'], platform: 'leetcode', url: 'https://leetcode.com/problems/container-with-most-water/', acceptanceRate: 52.8 },
      { externalId: 'lc-125', title: 'Valid Palindrome', difficulty: 'easy', topics: ['two-pointers', 'string'], platform: 'leetcode', url: 'https://leetcode.com/problems/valid-palindrome/', acceptanceRate: 41.8 },
      { externalId: 'lc-141', title: 'Linked List Cycle', difficulty: 'easy', topics: ['linked-list', 'two-pointers'], platform: 'leetcode', url: 'https://leetcode.com/problems/linked-list-cycle/', acceptanceRate: 47.4 },
      { externalId: 'lc-167', title: 'Two Sum II - Input Array Is Sorted', difficulty: 'medium', topics: ['array', 'two-pointers', 'binary-search'], platform: 'leetcode', url: 'https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/', acceptanceRate: 59.8 },
      { externalId: 'lc-345', title: 'Reverse Vowels of a String', difficulty: 'easy', topics: ['string', 'two-pointers'], platform: 'leetcode', url: 'https://leetcode.com/problems/reverse-vowels-of-a-string/', acceptanceRate: 53.8 },
      { externalId: 'lc-633', title: 'Sum of Square Numbers', difficulty: 'medium', topics: ['math', 'two-pointers'], platform: 'leetcode', url: 'https://leetcode.com/problems/sum-of-square-numbers/', acceptanceRate: 32.5 },
      { externalId: 'lc-680', title: 'Valid Palindrome II', difficulty: 'easy', topics: ['string', 'two-pointers', 'greedy'], platform: 'leetcode', url: 'https://leetcode.com/problems/valid-palindrome-ii/', acceptanceRate: 36.8 },

      // ========== SLIDING WINDOW (6 problems) ==========
      { externalId: 'lc-30', title: 'Substring with Concatenation of All Words', difficulty: 'hard', topics: ['string', 'hash-table', 'sliding-window'], platform: 'leetcode', url: 'https://leetcode.com/problems/substring-with-concatenation-of-all-words/', acceptanceRate: 28.3 },
      { externalId: 'lc-76', title: 'Minimum Window Substring', difficulty: 'hard', topics: ['string', 'sliding-window', 'hash-table'], platform: 'leetcode', url: 'https://leetcode.com/problems/minimum-window-substring/', acceptanceRate: 36.5 },
      { externalId: 'lc-159', title: 'Longest Substring with At Most Two Distinct Characters', difficulty: 'medium', topics: ['string', 'sliding-window', 'hash-table'], platform: 'leetcode', url: 'https://leetcode.com/problems/longest-substring-with-at-most-two-distinct-characters/', acceptanceRate: 48.2 },
      { externalId: 'lc-209', title: 'Minimum Size Subarray Sum', difficulty: 'medium', topics: ['array', 'sliding-window', 'prefix-sum'], platform: 'leetcode', url: 'https://leetcode.com/problems/minimum-size-subarray-sum/', acceptanceRate: 40.5 },
      { externalId: 'lc-438', title: 'Find All Anagrams in a String', difficulty: 'medium', topics: ['string', 'sliding-window', 'hash-table'], platform: 'leetcode', url: 'https://leetcode.com/problems/find-all-anagrams-in-a-string/', acceptanceRate: 52.3 },
      { externalId: 'lc-567', title: 'Permutation in String', difficulty: 'medium', topics: ['string', 'sliding-window', 'hash-table'], platform: 'leetcode', url: 'https://leetcode.com/problems/permutation-in-string/', acceptanceRate: 43.8 },

      // ========== LINKED LISTS (8 problems) ==========
      { externalId: 'lc-2', title: 'Add Two Numbers', difficulty: 'medium', topics: ['linked-list', 'math', 'recursion'], platform: 'leetcode', url: 'https://leetcode.com/problems/add-two-numbers/', acceptanceRate: 32.7 },
      { externalId: 'lc-21', title: 'Merge Two Sorted Lists', difficulty: 'easy', topics: ['linked-list', 'recursion'], platform: 'leetcode', url: 'https://leetcode.com/problems/merge-two-sorted-lists/', acceptanceRate: 61.8 },
      { externalId: 'lc-83', title: 'Remove Duplicates from Sorted List', difficulty: 'easy', topics: ['linked-list'], platform: 'leetcode', url: 'https://leetcode.com/problems/remove-duplicates-from-sorted-list/', acceptanceRate: 50.2 },
      { externalId: 'lc-92', title: 'Reverse Linked List II', difficulty: 'medium', topics: ['linked-list'], platform: 'leetcode', url: 'https://leetcode.com/problems/reverse-linked-list-ii/', acceptanceRate: 39.8 },
      { externalId: 'lc-206', title: 'Reverse Linked List', difficulty: 'easy', topics: ['linked-list', 'recursion'], platform: 'leetcode', url: 'https://leetcode.com/problems/reverse-linked-list/', acceptanceRate: 74.8 },
      { externalId: 'lc-237', title: 'Delete Node in a Linked List', difficulty: 'medium', topics: ['linked-list'], platform: 'leetcode', url: 'https://leetcode.com/problems/delete-node-in-a-linked-list/', acceptanceRate: 83.8 },
      { externalId: 'lc-328', title: 'Odd Even Linked List', difficulty: 'medium', topics: ['linked-list'], platform: 'leetcode', url: 'https://leetcode.com/problems/odd-even-linked-list/', acceptanceRate: 61.8 },
      { externalId: 'lc-430', title: 'Flatten a Multilevel Doubly Linked List', difficulty: 'medium', topics: ['linked-list', 'depth-first-search'], platform: 'leetcode', url: 'https://leetcode.com/problems/flatten-a-multilevel-doubly-linked-list/', acceptanceRate: 61.5 },

      // ========== STACKS (6 problems) ==========
      { externalId: 'lc-20', title: 'Valid Parentheses', difficulty: 'easy', topics: ['string', 'stack'], platform: 'leetcode', url: 'https://leetcode.com/problems/valid-parentheses/', acceptanceRate: 40.2 },
      { externalId: 'lc-71', title: 'Simplify Path', difficulty: 'medium', topics: ['string', 'stack'], platform: 'leetcode', url: 'https://leetcode.com/problems/simplify-path/', acceptanceRate: 38.5 },
      { externalId: 'lc-155', title: 'Min Stack', difficulty: 'medium', topics: ['stack', 'design'], platform: 'leetcode', url: 'https://leetcode.com/problems/min-stack/', acceptanceRate: 51.8 },
      { externalId: 'lc-456', title: 'Increasing Subsequences', difficulty: 'medium', topics: ['stack', 'depth-first-search'], platform: 'leetcode', url: 'https://leetcode.com/problems/remove-k-digits/', acceptanceRate: 29.2 },
      { externalId: 'lc-496', title: 'Next Greater Element I', difficulty: 'easy', topics: ['array', 'stack', 'hash-table'], platform: 'leetcode', url: 'https://leetcode.com/problems/next-greater-element-i/', acceptanceRate: 70.2 },
      { externalId: 'lc-503', title: 'Next Greater Element II', difficulty: 'medium', topics: ['array', 'stack'], platform: 'leetcode', url: 'https://leetcode.com/problems/next-greater-element-ii/', acceptanceRate: 63.8 },

      // ========== QUEUES (5 problems) ==========
      { externalId: 'lc-225', title: 'Implement Stack using Queues', difficulty: 'easy', topics: ['stack', 'queue', 'design'], platform: 'leetcode', url: 'https://leetcode.com/problems/implement-stack-using-queues/', acceptanceRate: 65.3 },
      { externalId: 'lc-232', title: 'Implement Queue using Stacks', difficulty: 'easy', topics: ['stack', 'queue', 'design'], platform: 'leetcode', url: 'https://leetcode.com/problems/implement-queue-using-stacks/', acceptanceRate: 62.5 },
      { externalId: 'lc-622', title: 'Design Circular Queue', difficulty: 'medium', topics: ['queue', 'design'], platform: 'leetcode', url: 'https://leetcode.com/problems/design-circular-queue/', acceptanceRate: 53.8 },
      { externalId: 'lc-641', title: 'Design Circular Deque', difficulty: 'medium', topics: ['queue', 'design'], platform: 'leetcode', url: 'https://leetcode.com/problems/design-circular-deque/', acceptanceRate: 60.2 },
      { externalId: 'cf-1', title: 'A. Codeforces Help', difficulty: 'easy', topics: ['implementation'], platform: 'codeforces', url: 'https://codeforces.com/problemset/problem/1/A', acceptanceRate: 90.2 },

      // ========== BINARY SEARCH (7 problems) ==========
      { externalId: 'lc-33', title: 'Search in Rotated Sorted Array', difficulty: 'medium', topics: ['array', 'binary-search'], platform: 'leetcode', url: 'https://leetcode.com/problems/search-in-rotated-sorted-array/', acceptanceRate: 38.5 },
      { externalId: 'lc-34', title: 'Find First and Last Position of Element in Sorted Array', difficulty: 'medium', topics: ['array', 'binary-search'], platform: 'leetcode', url: 'https://leetcode.com/problems/find-first-and-last-position-of-element-in-sorted-array/', acceptanceRate: 40.8 },
      { externalId: 'lc-69', title: 'Sqrt(x)', difficulty: 'easy', topics: ['math', 'binary-search'], platform: 'leetcode', url: 'https://leetcode.com/problems/sqrtx/', acceptanceRate: 37.5 },
      { externalId: 'lc-162', title: 'Find Peak Element', difficulty: 'medium', topics: ['array', 'binary-search'], platform: 'leetcode', url: 'https://leetcode.com/problems/find-peak-element/', acceptanceRate: 46.8 },
      { externalId: 'lc-270', title: 'Closest Binary Search Tree Value', difficulty: 'easy', topics: ['tree', 'binary-search', 'depth-first-search'], platform: 'leetcode', url: 'https://leetcode.com/problems/closest-binary-search-tree-value/', acceptanceRate: 48.2 },
      { externalId: 'lc-540', title: 'Single Element in a Sorted Array', difficulty: 'medium', topics: ['array', 'binary-search'], platform: 'leetcode', url: 'https://leetcode.com/problems/single-element-in-a-sorted-array/', acceptanceRate: 60.8 },
      { externalId: 'lc-658', title: 'Find K Closest Elements', difficulty: 'medium', topics: ['array', 'binary-search', 'sorting', 'two-pointers'], platform: 'leetcode', url: 'https://leetcode.com/problems/find-k-closest-elements/', acceptanceRate: 49.5 },

      // ========== TREES & BINARY TREES (10 problems) ==========
      { externalId: 'lc-94', title: 'Binary Tree Inorder Traversal', difficulty: 'easy', topics: ['tree', 'depth-first-search', 'stack'], platform: 'leetcode', url: 'https://leetcode.com/problems/binary-tree-inorder-traversal/', acceptanceRate: 66.5 },
      { externalId: 'lc-100', title: 'Same Tree', difficulty: 'easy', topics: ['tree', 'depth-first-search', 'breadth-first-search'], platform: 'leetcode', url: 'https://leetcode.com/problems/same-tree/', acceptanceRate: 56.2 },
      { externalId: 'lc-101', title: 'Symmetric Tree', difficulty: 'easy', topics: ['tree', 'depth-first-search', 'breadth-first-search'], platform: 'leetcode', url: 'https://leetcode.com/problems/symmetric-tree/', acceptanceRate: 53.8 },
      { externalId: 'lc-102', title: 'Binary Tree Level Order Traversal', difficulty: 'medium', topics: ['tree', 'breadth-first-search'], platform: 'leetcode', url: 'https://leetcode.com/problems/binary-tree-level-order-traversal/', acceptanceRate: 60.3 },
      { externalId: 'lc-104', title: 'Maximum Depth of Binary Tree', difficulty: 'easy', topics: ['tree', 'depth-first-search', 'breadth-first-search'], platform: 'leetcode', url: 'https://leetcode.com/problems/maximum-depth-of-binary-tree/', acceptanceRate: 74.3 },
      { externalId: 'lc-110', title: 'Balanced Binary Tree', difficulty: 'easy', topics: ['tree', 'depth-first-search'], platform: 'leetcode', url: 'https://leetcode.com/problems/balanced-binary-tree/', acceptanceRate: 55.8 },
      { externalId: 'lc-124', title: 'Binary Tree Maximum Path Sum', difficulty: 'hard', topics: ['tree', 'depth-first-search', 'dynamic-programming'], platform: 'leetcode', url: 'https://leetcode.com/problems/binary-tree-maximum-path-sum/', acceptanceRate: 40.5 },
      { externalId: 'lc-235', title: 'Lowest Common Ancestor of a Binary Search Tree', difficulty: 'easy', topics: ['tree', 'depth-first-search'], platform: 'leetcode', url: 'https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/', acceptanceRate: 58.2 },
      { externalId: 'lc-236', title: 'Lowest Common Ancestor of a Binary Tree', difficulty: 'medium', topics: ['tree', 'depth-first-search'], platform: 'leetcode', url: 'https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/', acceptanceRate: 59.3 },
      { externalId: 'lc-297', title: 'Serialize and Deserialize Binary Tree', difficulty: 'hard', topics: ['tree', 'depth-first-search', 'breadth-first-search', 'design'], platform: 'leetcode', url: 'https://leetcode.com/problems/serialize-and-deserialize-binary-tree/', acceptanceRate: 52.2 },

      // ========== RECURSION & BACKTRACKING (8 problems) ==========
      { externalId: 'lc-17', title: 'Letter Combinations of a Phone Number', difficulty: 'medium', topics: ['string', 'backtracking'], platform: 'leetcode', url: 'https://leetcode.com/problems/letter-combinations-of-a-phone-number/', acceptanceRate: 56.2 },
      { externalId: 'lc-39', title: 'Combination Sum', difficulty: 'medium', topics: ['array', 'backtracking'], platform: 'leetcode', url: 'https://leetcode.com/problems/combination-sum/', acceptanceRate: 69.5 },
      { externalId: 'lc-40', title: 'Combination Sum II', difficulty: 'medium', topics: ['array', 'backtracking'], platform: 'leetcode', url: 'https://leetcode.com/problems/combination-sum-ii/', acceptanceRate: 58.5 },
      { externalId: 'lc-46', title: 'Permutations', difficulty: 'medium', topics: ['array', 'backtracking'], platform: 'leetcode', url: 'https://leetcode.com/problems/permutations/', acceptanceRate: 74.2 },
      { externalId: 'lc-47', title: 'Permutations II', difficulty: 'medium', topics: ['array', 'backtracking'], platform: 'leetcode', url: 'https://leetcode.com/problems/permutations-ii/', acceptanceRate: 63.8 },
      { externalId: 'lc-77', title: 'Combinations', difficulty: 'medium', topics: ['backtracking'], platform: 'leetcode', url: 'https://leetcode.com/problems/combinations/', acceptanceRate: 71.5 },
      { externalId: 'lc-79', title: 'Word Search', difficulty: 'medium', topics: ['array', 'backtracking', 'matrix'], platform: 'leetcode', url: 'https://leetcode.com/problems/word-search/', acceptanceRate: 38.5 },
      { externalId: 'lc-90', title: 'Subsets II', difficulty: 'medium', topics: ['array', 'backtracking', 'bit-manipulation'], platform: 'leetcode', url: 'https://leetcode.com/problems/subsets-ii/', acceptanceRate: 60.8 },

      // ========== GRAPH TRAVERSAL (8 problems) ==========
      { externalId: 'lc-97', title: 'Interleaving String', difficulty: 'medium', topics: ['string', 'dynamic-programming'], platform: 'leetcode', url: 'https://leetcode.com/problems/interleaving-string/', acceptanceRate: 39.5 },
      { externalId: 'lc-103', title: 'Binary Tree Zigzag Level Order Traversal', difficulty: 'medium', topics: ['tree', 'breadth-first-search'], platform: 'leetcode', url: 'https://leetcode.com/problems/binary-tree-zigzag-level-order-traversal/', acceptanceRate: 55.8 },
      { externalId: 'lc-133', title: 'Clone Graph', difficulty: 'medium', topics: ['hash-table', 'depth-first-search', 'breadth-first-search', 'graph'], platform: 'leetcode', url: 'https://leetcode.com/problems/clone-graph/', acceptanceRate: 52.8 },
      { externalId: 'lc-200', title: 'Number of Islands', difficulty: 'medium', topics: ['array', 'depth-first-search', 'breadth-first-search', 'union-find', 'matrix'], platform: 'leetcode', url: 'https://leetcode.com/problems/number-of-islands/', acceptanceRate: 61.8 },
      { externalId: 'lc-207', title: 'Course Schedule', difficulty: 'medium', topics: ['depth-first-search', 'breadth-first-search', 'graph', 'topological-sort'], platform: 'leetcode', url: 'https://leetcode.com/problems/course-schedule/', acceptanceRate: 51.2 },
      { externalId: 'lc-210', title: 'Course Schedule II', difficulty: 'medium', topics: ['depth-first-search', 'breadth-first-search', 'graph', 'topological-sort'], platform: 'leetcode', url: 'https://leetcode.com/problems/course-schedule-ii/', acceptanceRate: 54.5 },
      { externalId: 'lc-269', title: 'Alien Dictionary', difficulty: 'hard', topics: ['array', 'string', 'topological-sort'], platform: 'leetcode', url: 'https://leetcode.com/problems/alien-dictionary/', acceptanceRate: 36.2 },
      { externalId: 'lc-310', title: 'Minimum Height Trees', difficulty: 'medium', topics: ['depth-first-search', 'breadth-first-search', 'graph'], platform: 'leetcode', url: 'https://leetcode.com/problems/minimum-height-trees/', acceptanceRate: 39.8 },

      // ========== DYNAMIC PROGRAMMING (10 problems) ==========
      { externalId: 'lc-5', title: 'Longest Palindromic Substring', difficulty: 'medium', topics: ['string', 'dynamic-programming'], platform: 'leetcode', url: 'https://leetcode.com/problems/longest-palindromic-substring/', acceptanceRate: 32.2 },
      { externalId: 'lc-10', title: 'Regular Expression Matching', difficulty: 'hard', topics: ['string', 'dynamic-programming', 'recursion'], platform: 'leetcode', url: 'https://leetcode.com/problems/regular-expression-matching/', acceptanceRate: 28.5 },
      { externalId: 'lc-62', title: 'Unique Paths', difficulty: 'medium', topics: ['math', 'dynamic-programming', 'combinatorics'], platform: 'leetcode', url: 'https://leetcode.com/problems/unique-paths/', acceptanceRate: 63.2 },
      { externalId: 'lc-63', title: 'Unique Paths II', difficulty: 'medium', topics: ['array', 'dynamic-programming', 'matrix'], platform: 'leetcode', url: 'https://leetcode.com/problems/unique-paths-ii/', acceptanceRate: 40.8 },
      { externalId: 'lc-70', title: 'Climbing Stairs', difficulty: 'easy', topics: ['math', 'dynamic-programming', 'memoization'], platform: 'leetcode', url: 'https://leetcode.com/problems/climbing-stairs/', acceptanceRate: 51.8 },
      { externalId: 'lc-72', title: 'Edit Distance', difficulty: 'medium', topics: ['string', 'dynamic-programming'], platform: 'leetcode', url: 'https://leetcode.com/problems/edit-distance/', acceptanceRate: 58.5 },
      { externalId: 'lc-121', title: 'Best Time to Buy and Sell Stock', difficulty: 'easy', topics: ['array', 'dynamic-programming'], platform: 'leetcode', url: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/', acceptanceRate: 52.3 },
      { externalId: 'lc-139', title: 'Word Break', difficulty: 'medium', topics: ['string', 'dynamic-programming', 'memoization', 'trie'], platform: 'leetcode', url: 'https://leetcode.com/problems/word-break/', acceptanceRate: 43.8 },
      { externalId: 'lc-198', title: 'House Robber', difficulty: 'medium', topics: ['array', 'dynamic-programming'], platform: 'leetcode', url: 'https://leetcode.com/problems/house-robber/', acceptanceRate: 54.5 },
      { externalId: 'lc-213', title: 'House Robber II', difficulty: 'medium', topics: ['array', 'dynamic-programming'], platform: 'leetcode', url: 'https://leetcode.com/problems/house-robber-ii/', acceptanceRate: 42.8 },
    ]);
    console.log(`Created ${problems.length} problems`);

    // Create standalone Topics (for custom roadmap creation)
    const topics = await Topic.insertMany([
      {
        name: 'Arrays & Lists',
        category: 'DSA',
        difficulty: 'beginner',
        estimated_hours: 20,
        metadata: {
          prerequisites: [],
          key_concepts: ['array', 'list', 'indexing', 'allocation'],
        },
        is_active: true,
      },
      {
        name: 'Linked Lists',
        category: 'DSA',
        difficulty: 'intermediate',
        estimated_hours: 18,
        metadata: {
          prerequisites: ['Arrays & Lists'],
          key_concepts: ['node', 'pointer', 'traversal', 'linked list'],
        },
        is_active: true,
      },
      {
        name: 'Trees & Graphs',
        category: 'DSA',
        difficulty: 'advanced',
        estimated_hours: 24,
        metadata: {
          prerequisites: ['Linked Lists'],
          key_concepts: ['tree', 'graph', 'traversal', 'BFS', 'DFS'],
        },
        is_active: true,
      },
      {
        name: 'Sorting & Searching',
        category: 'DSA',
        difficulty: 'intermediate',
        estimated_hours: 16,
        metadata: {
          prerequisites: ['Arrays & Lists'],
          key_concepts: ['sorting', 'searching', 'binary search', 'quicksort'],
        },
        is_active: true,
      },
      {
        name: 'Dynamic Programming',
        category: 'DSA',
        difficulty: 'advanced',
        estimated_hours: 20,
        metadata: {
          prerequisites: ['Recursion'],
          key_concepts: ['DP', 'memoization', 'tabulation', 'optimal substructure'],
        },
        is_active: true,
      },
      {
        name: 'System Design Fundamentals',
        category: 'System Design',
        difficulty: 'advanced',
        estimated_hours: 12,
        metadata: {
          prerequisites: [],
          key_concepts: ['scalability', 'load balancing', 'database design'],
        },
        is_active: true,
      },
      {
        name: 'Database Design',
        category: 'DBMS',
        difficulty: 'advanced',
        estimated_hours: 14,
        metadata: {
          prerequisites: [],
          key_concepts: ['SQL', 'normalization', 'indexing', 'transactions'],
        },
        is_active: true,
      },
    ]);
    console.log(`Created ${topics.length} topics`);

    // Note: Roadmaps are now seeded separately via scripts/seedDSARoadmap.js
    // This ensures we maintain the production-grade 15-topic DSA roadmap
    console.log('⚠️  Note: Roadmaps are seeded via seedDSARoadmap.js script');

    // RoadmapTopics are now seeded separately via scripts/seedDSARoadmap.js
    // This keeps the database clean and focused on the production roadmap
    console.log('⚠️  Note: RoadmapTopics are seeded via seedDSARoadmap.js script');

    // Create seed platform integrations
    const integrations = await PlatformIntegration.insertMany([
      {
        userId: users[0]._id,
        platformName: 'leetcode',
        username: 'johndoe',
        syncStatus: 'success',
        lastSyncTime: new Date(),
        profile: {
          solvedProblems: 245,
          totalSubmissions: 389,
          acceptanceRate: 63.0,
          ranking: 12500,
        },
      },
      {
        userId: users[0]._id,
        platformName: 'codeforces',
        username: 'johndoe_cf',
        syncStatus: 'success',
        lastSyncTime: new Date(),
        profile: {
          solvedProblems: 89,
          totalSubmissions: 156,
          acceptanceRate: 57.0,
          ranking: 45000,
        },
      },
      {
        userId: users[1]._id,
        platformName: 'leetcode',
        username: 'jane_smith',
        syncStatus: 'pending',
      },
    ]);
    console.log(`Created ${integrations.length} platform integrations`);

    console.log('\n✅ Database seeded successfully!');
    console.log('\nTest Credentials:');
    console.log('Email: john@example.com | Password: TestPassword123!');
    console.log('Email: jane@example.com | Password: TestPassword123!');
    console.log('Email: admin@example.com | Password: AdminPassword123!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
