const UserModel = require('../models/user-model');
const bcrypt = require('bcrypt');
const uuid = require('uuid');
const mailService = require('../service/mail-service');
const tokenService = require('../service/token-service');
const UserDto = require('../dtos/user-dto');
const ApiError = require('../exceptions/api-error');

class UserService {
    async registration(email, password) {
        const candidate = await UserModel.findOne({email});

        if (candidate) {
            throw ApiError.BadRequest(`Customer with ${email} already exist`);
        }

        const hashPassword = await bcrypt.hash(password, 3); //hashing password
        const activationLink = uuid.v4();

        const user = await UserModel.create({email, password: hashPassword});
        // await mailService.sendActivationMail(email, `${process.env.API_URL}/api/activate/${activationLink}`);

        const userDto = new UserDto(user); // replace unnecessary data to create a token.
        const tokens = tokenService.generateToken({...userDto});
        await tokenService.saveToken(userDto.id, tokens.refreshToken);

        return {
            ...tokens,
            user: userDto
        }
    }


    async activate(activationLink) {
        const user = await UserModel.findOne({activationLink});

        if (!user) {
            ApiError.BadRequest('Not correct link')
        }

        user.isActivated = true;
        await user.save();
    }

    async login(email, password) {
        const user = await UserModel.findOne({email});

        if (!user) {
            throw ApiError.BadRequest('Customer is not defined')
        }

        const isPassEquals = await bcrypt.compare(password, user.password);

        if (!isPassEquals) {
            throw ApiError.BadRequest('Wrong email or password')
        }

        const userDto = new UserDto(user);
        const tokens = tokenService.generateToken({...userDto});
        await tokenService.saveToken(userDto.id, tokens.refreshToken);

        return {
            ...tokens,
            user: userDto
        }
    }

    async logout(refreshToken) {
        return await tokenService.removeToken(refreshToken);
    }


    async refresh(refreshToken) {
        if (!refreshToken) {
            throw ApiError.UnauthorizedError();
        }

        const userData = tokenService.validateRefreshToken(refreshToken);
        const tokenFromDb = tokenService.findToken(refreshToken);

        if (!userData || !tokenFromDb) {
            throw ApiError.UnauthorizedError();
        }

        const user = await UserModel.findById(userData.id);
        const userDto = new UserDto(user);
        const tokens = tokenService.generateToken({...userDto});
        await tokenService.saveToken(userDto.id, tokens.refreshToken);

        return {...tokens, user: userDto}
    }

    async getAllUsers() {
        return UserModel.find();
    }
}

module.exports = new UserService();