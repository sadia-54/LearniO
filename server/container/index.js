const { PrismaUserRepository } = require('../infrastructure/prisma/PrismaUserRepository');
const { DeleteUserUseCase } = require('../application/use-cases/DeleteUserUseCase');

const userRepo = new PrismaUserRepository();
const deleteUserUseCase = new DeleteUserUseCase(userRepo);

module.exports = { deleteUserUseCase };
