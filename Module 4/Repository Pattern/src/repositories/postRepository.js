/**
 * postRepository.js — Repository layer for Post entities.
 *
 * Implements the Repository Pattern over an in-memory store.
 * Storage-swap proof: The repository uses an internal Map-backed store
 * instead of an array, proving that services depend on a stable repository contract
 * rather than any specific underlying storage technology.
 *
 * SWAP COMMENT:
 * When this repository is replaced by a Prisma-backed implementation:
 *   WHAT WILL CHANGE:
 *     - Only this repository file (postRepository.js) changes.
 *     - The internal Map store and in-memory nextId counter will be replaced with PrismaClient queries:
 *         `findAll()`         → await prisma.post.findMany()
 *         `findById(id)`      → await prisma.post.findUnique({ where: { id: Number(id) } })
 *         `create(fields)`    → await prisma.post.create({ data: fields })
 *         `update(id, patch)` → await prisma.post.update({ where: { id: Number(id) }, data: patch })
 *         `remove(id)`        → await prisma.post.delete({ where: { id: Number(id) } })
 *   WHAT WILL REMAIN UNCHANGED:
 *     - All service files (postService.js) remain untouched; they continue to invoke the same five repository methods.
 *     - All controller files (postController.js) and routes remain untouched; they continue to handle HTTP requests/responses.
 *     - Business rules, validation logic, response shapes, and error status codes stay intact in their respective layers.
 */

const postStore = require('../data/postStore');

// Private Map-backed store — never exported directly.
const posts = new Map(
  (postStore && postStore.posts ? postStore.posts : []).map((post) => [
    post.id,
    { ...post },
  ])
);

let nextId =
  posts.size > 0
    ? Math.max(...Array.from(posts.keys())) + 1
    : 1;

/**
 * Returns a new array containing copies of all post records.
 * Caller mutations will not affect the internal store.
 * @returns {Array<Object>}
 */
function findAll() {
  return Array.from(posts.values()).map((post) => ({ ...post }));
}

/**
 * Finds a single post record by its ID.
 * @param {number|string} id
 * @returns {Object|null} The post record or null if not found.
 */
function findById(id) {
  const post = posts.get(Number(id));
  return post ? { ...post } : null;
}

/**
 * Creates and stores a new post record, generating a unique ID.
 * @param {Object} fields
 * @returns {Object} The complete created record including its generated id.
 */
function create(fields) {
  const post = {
    ...fields,
    body: (fields && fields.body) !== undefined ? fields.body : '',
    id: nextId++,
  };
  posts.set(post.id, post);
  return { ...post };
}

/**
 * Updates an existing post record by its ID with the provided patch.
 * @param {number|string} id
 * @param {Object} patch
 * @returns {Object|null} The updated record or null if the record was not found.
 */
function update(id, patch) {
  const numericId = Number(id);
  const post = posts.get(numericId);
  if (!post) return null;
  if (!patch) return { ...post };

  const updated = { ...post };
  for (const [key, value] of Object.entries(patch)) {
    if (key !== 'id' && value !== undefined) {
      updated[key] = value;
    }
  }

  posts.set(numericId, updated);
  return { ...updated };
}

/**
 * Removes a post record by its ID.
 * @param {number|string} id
 * @returns {boolean} True if a record was removed, false if no record matched.
 */
function remove(id) {
  const numericId = Number(id);
  return posts.delete(numericId);
}

module.exports = {
  findAll,
  findById,
  create,
  update,
  remove,
};
