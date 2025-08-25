const { Result } = require('../../core/Result');

class DeleteUserUseCase {
  /** @param {import('../repositories/UserRepository').UserRepository} userRepo */
  constructor(userRepo) { this.userRepo = userRepo; }
  async execute(userId) {
    if (!userId) return Result.fail('userId required');
    try {
      const out = await this.userRepo.deleteUserDeep(userId);
      return Result.ok(out);
    } catch (e) {
      return Result.fail(e?.message || 'Failed to delete user');
    }
  }
}

module.exports = { DeleteUserUseCase };
