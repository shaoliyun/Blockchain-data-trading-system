pragma solidity ^0.8.0;

//该合约用于双方公钥管理和数据交易
//还没测试debug完！！

contract realData{
    mapping(address => bytes32) public publicKeys;
    mapping(address => bytes32) private privateKeys;
    mapping(address => bool) public keyExist;

    using ECDSA for bytes32;

    //密钥生成，公私钥返回给调用者，并更新至智能合约存储
    function generateKeyPair() public returns (bytes32, bytes32){

        bytes32 privateKey = keccak256(abi.encodePacked(msg.sender, block.timestamp));
        bytes32 publicKey = privateKey.toPublicKey();

        publicKeys[msg.sender] = publicKey;
        secretKeys[msg.sender] = privateKey;
        keyExist[msg.sender] = true;

        return (privateKey, publicKey);
    }
    

    //发起交易请求
    event TransactionRequest(address sender, address receiver, uint256 codeNumber, uint256 amount, bytes signature);

    function requestTransaction(address receiver, uint256 codeNumber, uint256 amount) public {
        //哈希信息以便签名
        bytes32 message = keccak256(abi.encodePacked(receiver, msg.sender, codeNumber, amount));
        //签名
        privateKey = privateKeys[msg.sender];
        bytes memory signature = message.sign(privateKey);

        emit TransactionRequest(msg.sender, receiver, codeNumber, amount, signature);
    }
    

    //交易请求确认
    //这里数据加密使用对称加密，先发送各种值、加密数据哈希值和签名，并同步发送加密后数据
    //发送数据考虑使用ISPF文件（？）存储,不在智能合约上操作
    event TransactionConfirmation(address sender, address receiver, uint256 codeNumber, uint256 amount, bytes32 dataHash, bytes signature);

    function confirmTransaction(address requestSender, address requestReceiver, uint256 codeNumber, uint256 amount, bytes requestSenderSignature, bytes32 dataHash) public {
        //验证签名
        require(requestReceiver == msg.sender, "not the receiver");

        bytes32 message = keccak256(abi.encodePacked(requestReceiver, requestSender, codeNumber, amount));
        bool isValid = (message.recover() == publicKeys[requestSender]);
        require(isValid, "signature not valid");

        //上链请求确认信息，将加密数据的哈希值也上传，并加上数据拥有者的签名
        bytes32 message2 = keccak256(abi.encodePacked(requestReceiver, requestSender, codeNumber, amount, dataHash));
        bytes memory signature = message2.sign(privateKeys[msg.sender]);

        emit TransactionConfirmation(requestSender, requestReceiver, codeNumber, amount, dataHash, signature);
    }


    //确认收到加密后数据并付款
    //付款预计使用web3.js实现，不在智能合约上操作
    event ReceiveDataConfirmation(address requestSender, address requestReceiver, uint256 codeNumber, bytes signature);

    function confirmDataReceived(address requestSender, address requestReceiver, uint256 codeNumber, uint256 amount) public{
        require(requestSender == msg.sender, "not the requestSender");

        bytes32 message = keccak256(abi.encodePacked(requestSender, requestReceiver, codeNumber));
        bytes memory signature = message.sign(privateKeys[msg.sender]);

        emit ReceiveDataConfirmation(requestSender, requestReceiver, codeNumber, signature);
    }

    //传输用于解密数据的密钥，该密钥使用接收方的公钥进行加密
    event dataKeySent(address requestSender, address requestReceiver, uint256 codeNumber, string encryptedDataKey, bytes signature);

    function sendDataKey(address requestSender, address requestReceiver, uint256 codeNumber, string memory encryptedDataKey) public {
        require(requestReceiver == msg.sender, "not the data provider");

        bytes32 message = keccak256(abi.encodePacked(requestSender, requestReceiver, codeNumber, encryptedDataKey));
        bytes memory signature = message.sign(privateKeys[msg.sender]);

        emit dataKeySent(requestSender, requestReceiver, codeNumber, encryptedDataKey, signature);

    }

    //查询公钥
    function publicKeySearch(address addressAsk) public pure returns(bytes32){
        require(keyExist[addressAsk], "no key exist");

        return publicKeys[addressAsk];
    }

    //查询私钥
    function privateKeyAsk() public pure returns(bytes32){
        require(keyExist[msg.sender], "no key exist")
        
        return privateKeys[msg.sender];
    }

    //数据接收者对数据打分
    event Evaluation(address requestSender, address requestReceiver, uint8 score, bytes signature);

    function evaluate(address requestSender, uint256 requestReceiver, uint8 score) public {
        require(score >= 1 && score <= 5, "Invalid score");
        require(requestSender == msg.sender, "not the requestSender");

        bytes32 message = keccak256(abi.encodePacked(requestSender, requestReceiver, score));
        bytes memory signature = message.sign(privateKeys[msg.sender]);

        emit Evaluation(requestSender, requestReceiver, score, signature);
    }
    
}