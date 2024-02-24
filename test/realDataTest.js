const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("realData contract", function(){
    let realData;
    let owner;
    let user1;
    let user2;

    beforeEach(async function(){
        [owner, user1, user2] = await ethers.getSigners();

        const RealData = await ethers.getContractFactory("realData");
        realData = await RealData.deploy();
    });

    describe("uploadKeyPair", function(){
        it("should allow user to upload key pair", async function(){
            const privateKey = ethers.randomBytes(32);
            const publicKey = ethers.randomBytes(32);

            const tx = await realData.connect(owner).uploadKeyPair(privateKey, publicKey);

            expect(tx).to.emit(realData, "uploadKeyPair").withArgs(privateKey, publicKey);

            const hexString1 = Array.from(publicKey).map(b => b.toString(16).padStart(2, '0')).join('');
            const expectedPublicKey = '0x' + hexString1;

            const hexString2 = Array.from(privateKey).map(b => b.toString(16).padStart(2, '0')).join('');
            const expectedPrivateKey = '0x' + hexString2;

            expect(await realData.publicKeySearch(owner.address)).to.equal(expectedPublicKey);
            expect(await realData.privateKeyAsk()).to.equal(expectedPrivateKey);
            expect(await realData.keyExist(owner.address)).to.be.true;
        });
    });

    describe("requestTransaction", function(){
        it("should emit TransactionRequest event", async function(){
            const codeNumber = 123;
            const amount = 100;
            const signature = ethers.randomBytes(32);

            const tx = await realData.connect(user1).requestTransaction(user2.address, codeNumber, amount, signature);

            expect(tx).to.emit(realData, "TransactionRequest").withArgs(user1.address, user2.address, codeNumber, amount, signature);
        });
    });

    describe("confirmTransaction", function(){
        it("should emit TransactionConfirmation event", async function(){
            const codeNumber = 123;
            const amount = 100;
            const signature = ethers.randomBytes(32);
            const dataHash = ethers.randomBytes(32);

            await realData.connect(user1).requestTransaction(user2.address, codeNumber, amount, signature);

            const tx = await realData.connect(user2).confirmTransaction(user1.address, user2.address, codeNumber, amount, signature, dataHash);

            expect(tx).to.emit(realData, "TransactionConfirmation").withArgs(user1.address, user2.address, codeNumber, amount, dataHash, signature);
        });

        it("should revert if not called by the receiver", async function(){
            const codeNumber = 123;
            const amount = 100;
            const signature = ethers.randomBytes(32);
            const dataHash = ethers.randomBytes(32);

            await realData.connect(user1).requestTransaction(user2.address, codeNumber, amount, signature);

            await expect(realData.connect(user1).confirmTransaction(user1.address, user2.address, codeNumber, amount, signature, dataHash)).to.be.revertedWith("not the receiver");
        });
    });

    describe("confirmDataReceived", function(){
        it("should emit ReceiveDataConfirmation event", async function(){
            const codeNumber = 123;
            const signature = ethers.randomBytes(32);

            await realData.connect(user1).requestTransaction(user2.address, codeNumber, 100, signature);
            await realData.connect(user2).confirmTransaction(user1.address, user2.address, codeNumber, 100, signature, ethers.randomBytes(32));

            const tx = await realData.connect(user1).confirmDataReceived(user1.address, user2.address, codeNumber, signature);

            expect(tx).to.emit(realData, "ReceiveDataConfirmation").withArgs(user1.address, user2.address, codeNumber, signature);
        });

        it("should revert if not called by the request sender", async function(){
            const codeNumber = 123;
            const signature = ethers.randomBytes(32);

            await realData.connect(user1).requestTransaction(user2.address, codeNumber, 100, signature);
            await realData.connect(user2).confirmTransaction(user1.address, user2.address, codeNumber, 100, signature, ethers.randomBytes(32));

            await expect(realData.connect(user2).confirmDataReceived(user1.address, user2.address, codeNumber, signature)).to.be.revertedWith("not the requestSender");
        });
    });

    describe("sendDataKey", function(){
        it("should emit dataKeySent event", async function(){
            const codeNumber = 123;
            const encryptedDataKey = "encryptedDataKey";
            const signature = ethers.randomBytes(32);

            await realData.connect(user1).requestTransaction(user2.address, codeNumber, 100, signature);
            await realData.connect(user2).confirmTransaction(user1.address, user2.address, codeNumber, 100, signature, ethers.randomBytes(32));

            const tx = await realData.connect(user2).sendDataKey(user1.address, user2.address, codeNumber, encryptedDataKey, signature);

            expect(tx).to.emit(realData, "dataKeySent").withArgs(user1.address, user2.address, codeNumber, encryptedDataKey, signature);
        });

        it("should revert if not called by the data provider", async function(){
            const codeNumber = 123;
            const encryptedDataKey = "encryptedDataKey";
            const signature = ethers.randomBytes(32);

            await realData.connect(user1).requestTransaction(user2.address, codeNumber, 100, signature);
            await realData.connect(user2).confirmTransaction(user1.address, user2.address, codeNumber, 100, signature, ethers.randomBytes(32));

            await expect(realData.connect(user1).sendDataKey(user1.address, user2.address, codeNumber, encryptedDataKey, signature)).to.be.revertedWith("not the data provider");
        });
    });

    describe("publicKeySearch", function(){
        it("should return the public key of the given address", async function(){
            const privateKey = ethers.randomBytes(32);
            const publicKey = ethers.randomBytes(32);

            await realData.connect(user1).uploadKeyPair(privateKey, publicKey);

            const hexString = Array.from(publicKey).map(b => b.toString(16).padStart(2, '0')).join('');
            const expectedPublicKey = '0x' + hexString;

            expect(await realData.publicKeySearch(user1.address)).to.equal(expectedPublicKey);
        });

        it("should revert if the key does not exist", async function(){
            await expect(realData.publicKeySearch(user1.address)).to.be.revertedWith("no key exist");
        });
    });

    describe("privateKeyAsk", function(){
        it("should return the private key of the caller", async function(){
            const privateKey = ethers.randomBytes(32);
            const publicKey = ethers.randomBytes(32);

            await realData.connect(owner).uploadKeyPair(privateKey, publicKey);

            const hexString = Array.from(privateKey).map(b => b.toString(16).padStart(2, '0')).join('');
            const expectedPrivateKey = '0x' + hexString;

            expect(await realData.connect(owner).privateKeyAsk()).to.equal(expectedPrivateKey);
        });

        it("should revert if the key does not exist", async function(){
            await expect(realData.connect(user1).privateKeyAsk()).to.be.revertedWith("no key exist");
        });
    });

    describe("evaluate", function(){
        it("should emit Evaluation event", async function(){
            const codeNumber = 123;
            const score = 4;
            const signature = ethers.randomBytes(32);

            await realData.connect(user1).requestTransaction(user2.address, codeNumber, 100, signature);

            const tx = await realData.connect(user1).evaluate(user1.address, user2.address, score, signature);

            expect(tx).to.emit(realData, "Evaluation").withArgs(user1.address, user2.address, score, signature);
        });

        it("should revert if the score is invalid", async function(){
            const codeNumber = 123;
            const score = 6;
            const signature = ethers.randomBytes(32);

            await realData.connect(user1).requestTransaction(user2.address, codeNumber, 100, signature);

            await expect(realData.connect(user1).evaluate(user1.address, user2.address, score, signature)).to.be.revertedWith("Invalid score");
        });

        it("should revert if not called by the request sender", async function(){
            const codeNumber = 123;
            const score = 4;
            const signature = ethers.randomBytes(32);

            await realData.connect(user1).requestTransaction(user2.address, codeNumber, 100, signature);

            await expect(realData.connect(user2).evaluate(user1.address, user2.address, score, signature)).to.be.revertedWith("not the requestSender");
        });
    });
});