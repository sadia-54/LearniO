// Abstraction for user-related persistence
class UserRepository {
  async deleteUserDeep(_userId) { throw new Error('Not implemented'); }
}
module.exports = { UserRepository };
