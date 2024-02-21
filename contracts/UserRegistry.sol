pragma solidity ^0.8.0;

contract UserRegistry {
    struct User {
        string name;
        string email;
        uint256 phone;
        uint256 creditValue;
        string characterType;
        address userAddress;
    }

    mapping(address => User) public users;


    //注册信息 
    event UserRegistered(address indexed userAddress, string name, string email, uint256 phone, uint256 creditValue, string characterType);

    function registerUser(string memory name, string memory email, uint256 phone, uint256 creditValue, string memory characterType) public {
        require(bytes(name).length > 0, "Name is required");
        require(users[msg.sender].userAddress == address(0), "User already exists");

        users[msg.sender] = User(name, email, phone, creditValue, characterType, msg.sender);


        emit UserRegistered(msg.sender, name, email, phone, creditValue, characterType);
    }

    //删除用户
    event UserUnregistered(address indexed userAddress);

    function unregisterUser() public {
        require(users[msg.sender].userAddress == msg.sender, "User does not exist");

        delete users[msg.sender];

        emit UserUnregistered(msg.sender);
    }

    //更改用户信息
    event UserUpdated(address indexed userAddress, string name, string email, uint256 phone, uint256 creditValue, string characterType);

    function updateUser(address userAddress, string memory name, string memory email, uint256 phone, uint256 creditValue, string memory characterType) public {
        require(msg.sender == userAddress, "You are not authorized to update this user");

        User storage user = users[userAddress];
        user.name = name;
        user.email = email;
        user.phone = phone;
        user.creditValue = creditValue;
        user.characterType = characterType; 
        emit UserUpdated(userAddress, name, email, phone, creditValue, characterType);
    }

}
