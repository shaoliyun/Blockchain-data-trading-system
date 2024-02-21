pragma solidity ^0.8.0;

contract UserRegistry {
    struct User {
        string name;
        string email;
        uint256 phone;
        uint256 creditValue;
        string[] characterTypes;
        bytes32 passwordHash;
    }

    mapping(uint256 => User) private users;
    mapping(uint256 => bool) public validUserId;
    mapping(string => bool) public validCharacterTypes;

    uint256 private nextUserId = 1;

    event UserRegistered(uint256 userId, string name, string email, uint256 phone, uint256 creditValue, string[] characterTypes);
    event UserUnregistered(uint256 userId);
    event UserUpdated(uint256 userId, string name, string email, uint256 phone, uint256 creditValue, string[] characterTypes);

    constructor(string[] memory _validCharacterTypes) {
        for (uint256 i = 0; i < _validCharacterTypes.length; i++) {
            validCharacterTypes[_validCharacterTypes[i]] = true;
        }
    }

    function registerUser(string memory name, string memory email, uint256 phone, uint256 creditValue, string[] memory characterTypes, bytes32 passwordHash) public {
        require(bytes(name).length > 0, "Name is required");
        require(bytes(email).length > 0, "Email is required");
        require(phone > 0, "Phone number is required");
        require(creditValue > 0, "Credit value is required");
        require(characterTypes.length > 0, "At least one character type is required");
        require(validateCharacterTypes(characterTypes), "Invalid character types");

        users[nextUserId] = User(name, email, phone, creditValue, characterTypes, passwordHash);

        emit UserRegistered(nextUserId, name, email, phone, creditValue, characterTypes);

        validUserId[nextUserId] = true;
        nextUserId++;
    }

    function unregisterUser(uint256 userId, bytes32 passwordHash) public {
        require(validUserId[userId], "User does not exist");
        require(validatePassword(userId, passwordHash), "Invalid password");

        delete users[userId];
        validUserId[userId] = false;

        emit UserUnregistered(userId);
    }

    function updateUser(uint256 userId, bytes32 passwordHash, string memory name, string memory email, uint256 phone, uint256 creditValue, string[] memory characterTypes) public {
        require(validUserId[userId], "User does not exist");
        require(validatePassword(userId, passwordHash), "Invalid password");
        require(validateCharacterTypes(characterTypes), "Invalid character types");

        User storage user = users[userId];
        if (bytes(name).length > 0) {
            user.name = name;
        }
        if (bytes(email).length > 0) {
            user.email = email;
        }
        if (phone > 0) {
            user.phone = phone;
        }
        if (creditValue > 0) {
            user.creditValue = creditValue;
        }
        if (characterTypes.length > 0) {
            user.characterTypes = characterTypes;
        }

        emit UserUpdated(userId, user.name, user.email, user.phone, user.creditValue, user.characterTypes);
    }

    function validatePassword(uint256 userId, bytes32 passwordHash) private view returns (bool) {
        return users[userId].passwordHash == passwordHash;
    }

    function validateCharacterTypes(string[] memory characterTypes) private view returns (bool) {
        for (uint256 i = 0; i < characterTypes.length; i++) {
            if (!validCharacterTypes[characterTypes[i]]) {
                return false;
            }
        }
        return true;
    }

    function getUser(uint256 userId, bytes32 passwordHash) public view returns (User memory) {
        require(validUserId[userId], "User does not exist");
        require(validatePassword(userId, passwordHash), "Invalid password");

        User memory user = users[userId];
        delete user.passwordHash;
        return user;
    }
}