const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("UserRegistry", function(){
    let userRegistry;
    const abi = new ethers.AbiCoder();
    let account;

    beforeEach(async function () {
        const validCharacterTypes = ["warrior", "mage", "rogue"];
        const UserRegistry = await ethers.getContractFactory("UserRegistry");
        userRegistry = await UserRegistry.deploy(validCharacterTypes);
        [account] = await ethers.getSigners();
        //await userRegistry.deployed();
    });

    describe("registerUser", function () {
        it("registers a new user", async function(){
            const name = "Alice";
            const email = "alice@example.com";
            const phone = 1234567890;
            const creditValue = 100;
            const characterTypes = ["warrior"];
            const message = ethers.keccak256(
                abi.encode(
                    ["address", "string", "string", "uint256", "uint256", "string[]"],
                    [account.address, name, email, phone, creditValue, characterTypes]
                )
            );
            const signature = await ethers.provider.send("eth_sign", [account.address, message]);
            await userRegistry.registerUser(name, email, phone, creditValue, characterTypes, signature);

            const message2 = ethers.keccak256(abi.encode(
                ["address"],
                [account.address]
            ));
            const signature2 = await ethers.provider.send("eth_sign", [account.address, message2]);

            const user = await userRegistry.getUser(account.address, signature2, false);
            expect(user.name).to.equal(name);
            expect(user.email).to.equal(email);
            expect(user.phone).to.equal(phone);
            expect(user.creditValue).to.equal(creditValue);
            expect(user.characterTypes).to.deep.equal(characterTypes);
        });

        it("reverts if name is empty", async function(){
            const email = "alice@example.com";
            const phone = 1234567890;
            const creditValue = 100;
            const characterTypes = ["warrior"];
            const message = ethers.keccak256(
                abi.encode(
                    ["address", "string", "string", "uint256", "uint256", "string[]"],
                [account.address, "", email, phone, creditValue, characterTypes]
                )
            );
            const signature = await ethers.provider.send("eth_sign", [account.address, message]);
            await expect(
                userRegistry.registerUser("", email, phone, creditValue, characterTypes, signature)
            ).to.be.revertedWith("Name is required");
        });

        it("reverts if email is empty", async function(){
            const name = "Alice";
            const phone = 1234567890;
            const creditValue = 100;
            const characterTypes = ["warrior"];
            const message = ethers.keccak256(
                abi.encode(
                    ["address", "string", "string", "uint256", "uint256", "string[]"],
                    [account.address, name, "", phone, creditValue, characterTypes]
                )
            );
            const signature = await ethers.provider.send("eth_sign", [account.address, message]);
            await expect(
                userRegistry.registerUser(name, "", phone, creditValue, characterTypes, signature)
            ).to.be.revertedWith("Email is required");
        });

        it("reverts if phone is zero", async function(){
            const name = "Alice";
            const email = "alice@example.com";
            const creditValue = 100;
            const characterTypes = ["warrior"];
            const message = ethers.keccak256(
                abi.encode(
                    ["address", "string", "string", "uint256", "uint256", "string[]"],
                    [account.address, name, email, 0, creditValue, characterTypes]
                )
            );
            const signature = await ethers.provider.send("eth_sign", [account.address, message]);
            await expect(
                userRegistry.registerUser(name, email, 0, creditValue, characterTypes, signature)
            ).to.be.revertedWith("Phone number is required");
        });

        it("reverts if creditValue is zero", async function(){
            const name = "Alice";
            const email = "alice@example.com";
            const phone = 1234567890;
            const characterTypes = ["warrior"];
            const message = ethers.keccak256(
                abi.encode(
                    ["address", "string", "string", "uint256", "uint256", "string[]"],
                    [account.address, name, email, phone, 0, characterTypes]
                ) 
            );
            const signature = await ethers.provider.send("eth_sign", [account.address, message]);
            await expect(
                userRegistry.registerUser(name, email, phone, 0, characterTypes, signature)
            ).to.be.revertedWith("Credit value is required");
        });

        it("reverts if characterTypes is empty", async function(){
            const name = "Alice";
            const email = "alice@example.com";
            const phone = 1234567890;
            const creditValue = 100;
            const message = ethers.keccak256(
                abi.encode(
                    ["address", "string", "string", "uint256", "uint256", "string[]"],
                    [account.address, name, email, phone, creditValue, []]
                )  
            );
            const signature = await ethers.provider.send("eth_sign", [account.address, message]);
            await expect(
                userRegistry.registerUser(name, email, phone, creditValue, [], signature)
            ).to.be.revertedWith("At least one character type is required");
        });

        it("reverts if characterTypes contains invalid types", async function(){
            const name = "Alice";
            const email = "alice@example.com";
            const phone = 1234567890;
            const creditValue = 100;
            const characterTypes = ["warrior", "invalid"];
            const message = ethers.keccak256(
                abi.encode(
                    ["address", "string", "string", "uint256", "uint256", "string[]"],
                    [account.address, name, email, phone, creditValue, characterTypes]
                )               
            );
            const signature = await ethers.provider.send("eth_sign", [account.address, message]);
            await expect(
                userRegistry.registerUser(name, email, phone, creditValue, characterTypes, signature)
            ).to.be.revertedWith("Invalid character types");
        });

        it("reverts if signature is invalid", async function(){
            const name = "Alice";
            const email = "alice@example.com";
            const phone = 1234567890;
            const creditValue = 100;
            const characterTypes = ["warrior"];
            const message = ethers.keccak256(
                abi.encode(
                    ["address", "string", "string", "uint256", "uint256", "string[]"],
                    [account.address, name, email, phone, creditValue, characterTypes]
                )
            );
            const signature = await ethers.provider.send("eth_sign", [account.address, message]);
            await expect(
                userRegistry.registerUser(name, email, phone, creditValue, characterTypes, signature.substring(0, signature.length - 2) + "ff")
            ).to.be.revertedWith("Invalid signature");
        });
    });

    describe("unregisterUser", function(){
        it("unregisters an existing user", async function(){
            const name = "Alice";
            const email = "alice@example.com";
            const phone = 1234567890;
            const creditValue = 100;
            const characterTypes = ["warrior"];
            const message = ethers.keccak256(
                abi.encode(
                    ["address", "string", "string", "uint256", "uint256", "string[]"],
                    [account.address, name, email, phone, creditValue, characterTypes]
                )
            );

            const signature = await ethers.provider.send("eth_sign", [account.address, message]);

            await userRegistry.registerUser(name, email, phone, creditValue, characterTypes, signature);

            console.log(await userRegistry.validUserAddress(account.address));

            const message2 = ethers.keccak256(abi.encode(
                ["address"],
                [account.address]
            ));

            const signature2 = await ethers.provider.send("eth_sign", [account.address, message2]);

            await userRegistry.unregisterUser(signature2);

            console.log(await userRegistry.validUserAddress(account.address));
        });

        it("reverts if user does not exist", async function(){
            const name = "Alice";
            const email = "alice@example.com";
            const phone = 1234567890;
            const creditValue = 100;
            const characterTypes = ["warrior"];
            const message = ethers.keccak256(
                abi.encode(
                    ["address", "string", "string", "uint256", "uint256", "string[]"],
                    [account.address, name, email, phone, creditValue, characterTypes]
                )
            );

            const signature = await ethers.provider.send("eth_sign", [account.address, message]);
            await expect(
                userRegistry.unregisterUser(signature)
            ).to.be.revertedWith("User does not exist");
        });

        it("reverts if signature is invalid", async function(){
            const name = "Alice";
            const email = "alice@example.com";
            const phone = 1234567890;
            const creditValue = 100;
            const characterTypes = ["warrior"];
            const message = ethers.keccak256(
                abi.encode(
                    ["address", "string", "string", "uint256", "uint256", "string[]"],
                    [account.address, name, email, phone, creditValue, characterTypes]
                )
            );
            const signature = await ethers.provider.send("eth_sign", [account.address, message]);
            await userRegistry.registerUser(name, email, phone, creditValue, characterTypes, signature);
            await expect(
                userRegistry.unregisterUser(signature.substring(0, signature.length - 2) + "ff")
            ).to.be.revertedWith("Invalid signature");
        });
    });

    describe("updateUser", function () {
        it("updates an existing user", async function(){
            const name = "Alice";
            const email = "alice@example.com";
            const phone = 1234567890;
            const creditValue = 100;
            const characterTypes = ["warrior"];
            const message = ethers.keccak256(
                abi.encode(
                    ["address", "string", "string", "uint256", "uint256", "string[]"],
                    [account.address, name, email, phone, creditValue, characterTypes]
                )
            );
            const signature = await ethers.provider.send("eth_sign", [account.address, message]);
            await userRegistry.registerUser(name, email, phone, creditValue, characterTypes, signature);
            const newName = "Bob";
            const newEmail = "bob@example.com";
            const newPhone = 9876543210;
            const newCreditValue = 200;
            const newCharacterTypes = ["mage"];
            const newMessage = ethers.keccak256(
                abi.encode(
                    ["address", "string", "string", "uint256", "uint256", "string[]"],
                    [account.address, newName, newEmail, newPhone, newCreditValue, newCharacterTypes]
                )
            );
            const newSignature = await ethers.provider.send("eth_sign", [account.address, newMessage]);
            await userRegistry.updateUser(newSignature, newName, newEmail, newPhone, newCreditValue, newCharacterTypes);

            const message2 = ethers.keccak256(abi.encode(
                ["address"],
                [account.address]
            ));
            const signature2 = await ethers.provider.send("eth_sign", [account.address, message2]);

            const user = await userRegistry.getUser(account.address, signature2, false);
            expect(user.name).to.equal(newName);
            expect(user.email).to.equal(newEmail);
            expect(user.phone).to.equal(newPhone);
            expect(user.creditValue).to.equal(newCreditValue);
            expect(user.characterTypes).to.deep.equal(newCharacterTypes);
        });

        it("reverts if user does not exist", async function(){
            const name = "Alice";
            const email = "alice@example.com";
            const phone = 1234567890;
            const creditValue = 100;
            const characterTypes = ["warrior"];
            const message = ethers.keccak256(
                abi.encode(
                    ["address", "string", "string", "uint256", "uint256", "string[]"],
                    [account.address, name, email, phone, creditValue, characterTypes]
                )
            );

            const signature = await ethers.provider.send("eth_sign", [account.address, message]);
            await expect(
                userRegistry.updateUser(signature, "Bob", "bob@example.com", 9876543210, 200, ["mage"])
            ).to.be.revertedWith("User does not exist");
        });

        it("reverts if characterTypes contains invalid types", async function(){
            const name = "Alice";
            const email = "alice@example.com";
            const phone = 1234567890;
            const creditValue = 100;
            const characterTypes = ["warrior"];
            const message = ethers.keccak256(
                abi.encode(
                    ["address", "string", "string", "uint256", "uint256", "string[]"],
                    [account.address, name, email, phone, creditValue, characterTypes]
                )
            );
            const signature = await ethers.provider.send("eth_sign", [account.address, message]);
            await userRegistry.registerUser(name, email, phone, creditValue, characterTypes, signature);
            const newCharacterTypes = ["warrior", "invalid"];
            const newMessage = ethers.keccak256(
                abi.encode(
                    ["address", "string", "string", "uint256", "uint256", "string[]"],
                    [account.address, name, email, phone, creditValue, newCharacterTypes]
                )               
            );
            const newSignature = await ethers.provider.send("eth_sign", [account.address, newMessage]);
            await expect(
                userRegistry.updateUser(newSignature, "", "", 0, 0, newCharacterTypes)
            ).to.be.revertedWith("Invalid character types");
        });

        it("reverts if signature is invalid", async function(){
            const name = "Alice";
            const email = "alice@example.com";
            const phone = 1234567890;
            const creditValue = 100;
            const characterTypes = ["warrior"];
            const message = ethers.keccak256(
                abi.encode(
                    ["address", "string", "string", "uint256", "uint256", "string[]"],
                    [account.address, name, email, phone, creditValue, characterTypes]
                )
            );
            const signature = await ethers.provider.send("eth_sign", [account.address, message]);
            await userRegistry.registerUser(name, email, phone, creditValue, characterTypes, signature);
            const newName = "Bob";
            const newEmail = "bob@example.com";
            const newPhone = 9876543210;
            const newCreditValue = 200;
            const newCharacterTypes = ["mage"];
            const newMessage = ethers.keccak256(
                abi.encode(
                    ["address", "string", "string", "uint256", "uint256", "string[]"],
                    [account.address, newName, newEmail, newPhone, newCreditValue, newCharacterTypes]
                )              
            );
            //const newSignature = await ethers.provider.send("eth_sign", [account.address, newMessage]);
            await expect(
                userRegistry.updateUser(signature.substring(0, signature.length - 2) + "ff", newName, newEmail, newPhone, newCreditValue, newCharacterTypes)
            ).to.be.revertedWith("Invalid signature");
        });
    });

    describe("getUser", function () {
        it("returns a user", async function(){
            const name = "Alice";
            const email = "alice@example.com";
            const phone = 1234567890;
            const creditValue = 100;
            const characterTypes = ["warrior"];
            const message = ethers.keccak256(
                abi.encode(
                    ["address", "string", "string", "uint256", "uint256", "string[]"],
                    [account.address, name, email, phone, creditValue, characterTypes]
                )               
            );
            const signature = await ethers.provider.send("eth_sign", [account.address, message]);
            await userRegistry.registerUser(name, email, phone, creditValue, characterTypes, signature);

            const message2 = ethers.keccak256(abi.encode(
                ["address"],
                [account.address]
            ));

            const signature2 = await ethers.provider.send("eth_sign", [account.address, message2]);

            const user = await userRegistry.getUser(account.address, signature2, false);
            expect(user.name).to.equal(name);
            expect(user.email).to.equal(email);
            expect(BigInt(user.phone)).to.equal(phone);
            expect(BigInt(user.creditValue)).to.equal(creditValue);
            expect(user.characterTypes).to.deep.equal(characterTypes);

            const user2 = await userRegistry.getUser(account.address, signature2, true);
            expect(user2.email).to.equal("");
            expect(BigInt(user2.phone)).to.equal(BigInt(999999999));
        });

        it("reverts if user does not exist", async function(){
            const message2 = ethers.keccak256(abi.encode(
                ["address"],
                [account.address]
            ));

            const signature2 = await ethers.provider.send("eth_sign", [account.address, message2]);            
            await expect(
                userRegistry.getUser(account.address, signature2, false)
            ).to.be.revertedWith("User does not exist");
        });
    });

    // Add more test cases for other functions
});