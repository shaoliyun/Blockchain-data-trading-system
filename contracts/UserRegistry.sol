contract UserRegistry {
    struct User {
        string name;
        string email;
        uint256 phone;
        uint256 creditValue;
        string[] characterTypes;
    }

    mapping(address => User) private users;
    mapping(address => bool) public validUserAddress;
    mapping(string => bool) public validCharacterTypes;

    event UserRegistered(address userAddress, string name, string email, uint256 phone, uint256 creditValue, string[] characterTypes);
    event UserUnregistered(address userAddress);
    event UserUpdated(address userAddress, string name, string email, uint256 phone, uint256 creditValue, string[] characterTypes);

    constructor(string[] memory _validCharacterTypes) {
        for (uint256 i = 0; i < _validCharacterTypes.length; i++) {
            validCharacterTypes[_validCharacterTypes[i]] = true;
        }
    }

    function registerUser(string memory name, string memory email, uint256 phone, uint256 creditValue, string[] memory characterTypes, bytes memory signature) public {
        require(bytes(name).length > 0, "Name is required");
        require(bytes(email).length > 0, "Email is required");
        require(phone > 0, "Phone number is required");
        require(creditValue > 0, "Credit value is required");
        require(characterTypes.length > 0, "At least one character type is required");
        require(validateCharacterTypes(characterTypes), "Invalid character types");

        bytes32 message = prefixed(keccak256(abi.encode(msg.sender, name, email, phone, creditValue, characterTypes)));

        require(recoverSigner(message, signature) == msg.sender, "Invalid signature");

        users[msg.sender] = User(name, email, phone, creditValue, characterTypes);

        emit UserRegistered(msg.sender, name, email, phone, creditValue, characterTypes);

        validUserAddress[msg.sender] = true;
    }

    function unregisterUser(bytes memory signature) public {
        require(validUserAddress[msg.sender], "User does not exist");

        bytes32 message = prefixed(keccak256(abi.encode(msg.sender)));
        require(recoverSigner(message, signature) == msg.sender, "Invalid signature");

        delete users[msg.sender];
        validUserAddress[msg.sender] = false;

        emit UserUnregistered(msg.sender);
    }

    function updateUser(bytes memory signature, string memory name, string memory email, uint256 phone, uint256 creditValue, string[] memory characterTypes) public {
        require(validUserAddress[msg.sender], "User does not exist");
        require(validateCharacterTypes(characterTypes), "Invalid character types");

        bytes32 message = prefixed(keccak256(abi.encode(msg.sender, name, email, phone, creditValue, characterTypes)));

        require(recoverSigner(message, signature) == msg.sender, "Invalid signature");

        User storage user = users[msg.sender];
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

        emit UserUpdated(msg.sender, user.name, user.email, user.phone, user.creditValue, user.characterTypes);
    }

    function validateCharacterTypes(string[] memory characterTypes) private view returns (bool) {
        for (uint256 i = 0; i < characterTypes.length; i++) {
            if (!validCharacterTypes[characterTypes[i]]) {
                return false;
            }
        }
        return true;
    }

    //获取用户信息，用于信息重置时查询原信息，或查询信誉度、角色
    function getUser(address userAddress, bytes memory signature, bool secretMask) public view returns (User memory) {
        require(validUserAddress[userAddress], "User does not exist");
        require(validUserAddress[msg.sender], "asker does not exist");

        bytes32 message = prefixed(keccak256(abi.encode(msg.sender)));
        require(recoverSigner(message, signature) == msg.sender, "Invalid signature");

        User memory user = users[userAddress];

        if(secretMask){
            user.email = "";
            user.phone = 999999999;
        }
        return user;
    }

    // Taken from https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/cryptography/ECDSA.sol
    function recoverSigner(bytes32 message, bytes memory sig) internal pure returns (address) {
        require(sig.length == 65, "Invalid signature length");

        bytes32 r;
        bytes32 s;
        uint8 v;

        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }

        if (v < 27) {
            v += 27;
        }

        require(v == 27 || v == 28, "Invalid signature");

        return ecrecover(message, v, r, s);
    }

    // Taken from https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/cryptography/ECDSA.sol
    function prefixed(bytes32 hash) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
    }
}
