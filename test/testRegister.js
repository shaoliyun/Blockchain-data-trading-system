const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");


describe("UserRegistry", function(){
    // let userRegistry;
    // let owner;
    // let user1;
    // let user2;

    const validCharacterTypes = ["type1", "type2", "type3"];


    async function deployTokenFixture() {
        // Get the ContractFactory and Signers here.
        const UserRegistry = await ethers.getContractFactory("UserRegistry");
        const hardhatUserRegistry = await UserRegistry.deploy(validCharacterTypes);
    
        // Fixtures can return anything you consider useful for your tests
        return {UserRegistry, hardhatUserRegistry};
    }

    describe("registerUser", function(){
        it("should register a new user", async function(){
            const name = "Alice";
            const email = "alice@example.com";
            const phone = 1234567890;
            const creditValue = 100;
            const characterTypes = ["type1", "type2"];
            const passwordHash = await ethers.keccak256(ethers.toUtf8Bytes("password"));


            const {hardhatUserRegistry} = await loadFixture(deployTokenFixture);

            await expect(hardhatUserRegistry.registerUser(name, email, phone, creditValue, characterTypes, passwordHash))
                .to.emit(hardhatUserRegistry, "UserRegistered")
                .withArgs(1, name, email, phone, creditValue, characterTypes);
            
            const user = await hardhatUserRegistry.getUser(1, passwordHash);
            expect(user.name).to.equal(name);
            expect(user.email).to.equal(email);
            expect(user.phone).to.equal(phone);
            expect(user.creditValue).to.equal(creditValue);
            expect(user.characterTypes).to.deep.equal(characterTypes);
        });

        it("should not register a new user with invalid character types", async function(){
            const name = "Bob";
            const email = "bob@example.com";
            const phone = 2345678901;
            const creditValue = 200;
            const characterTypes = ["type1", "invalid"];
            const passwordHash = await ethers.keccak256(ethers.toUtf8Bytes("password"));

            const {hardhatUserRegistry} = await loadFixture(deployTokenFixture);

            await expect(hardhatUserRegistry.registerUser(name, email, phone, creditValue, characterTypes, passwordHash))
                .to.be.revertedWith("Invalid character types");
        });

        it("should not register a new user with missing information", async function(){
            const name = "";
            const email = "carol@example.com";
            const phone = 3456789012;
            const creditValue = 300;
            const characterTypes = ["type2"];
            const passwordHash = await ethers.keccak256(ethers.toUtf8Bytes("password"));

            const {hardhatUserRegistry} = await loadFixture(deployTokenFixture);

            await expect(hardhatUserRegistry.registerUser(name, email, phone, creditValue, characterTypes, passwordHash))
                .to.be.revertedWith("Name is required");

            const name2 = "David";
            const email2 = "";
            const phone2 = 4567890123;
            const creditValue2 = 400;
            const characterTypes2 = ["type3"];
            const passwordHash2 = await ethers.keccak256(ethers.toUtf8Bytes("password"));

            await expect(hardhatUserRegistry.registerUser(name2, email2, phone2, creditValue2, characterTypes2, passwordHash2))
                .to.be.revertedWith("Email is required");

            const name3 = "Eve";
            const email3 = "eve@example.com";
            const phone3 = 5678901234;
            const creditValue3 = 0;
            const characterTypes3 = ["type1", "type2", "type3"];
            const passwordHash3 = await ethers.keccak256(ethers.toUtf8Bytes("password"));

            await expect(hardhatUserRegistry.registerUser(name3, email3, phone3, creditValue3, characterTypes3, passwordHash3))
                .to.be.revertedWith("Credit value is required");
        });
    });

    describe("unregisterUser", function(){
        beforeEach(async function () {
            const name = "Alice";
            const email = "alice@example.com";
            const phone = 1234567890;
            const creditValue = 100;
            const characterTypes = ["type1", "type2"];
            const passwordHash = await ethers.keccak256(ethers.toUtf8Bytes("password"));

            const {hardhatUserRegistry} = await loadFixture(deployTokenFixture);

            await hardhatUserRegistry.registerUser(name, email, phone, creditValue, characterTypes, passwordHash);
        });

        it("should unregister an existing user", async function(){
            const name = "Alice";
            const email = "alice@example.com";
            const phone = 1234567890;
            const creditValue = 100;
            const characterTypes = ["type1", "type2"];
            const passwordHash = await ethers.keccak256(ethers.toUtf8Bytes("password"));

            const {hardhatUserRegistry} = await loadFixture(deployTokenFixture);

            await hardhatUserRegistry.registerUser(name, email, phone, creditValue, characterTypes, passwordHash);

            await expect(hardhatUserRegistry.unregisterUser(1, passwordHash))
                .to.emit(hardhatUserRegistry, "UserUnregistered")
                .withArgs(1);

            await expect(hardhatUserRegistry.getUser(1, passwordHash)).to.be.revertedWith("User does not exist");
        });

        it("should not unregister a non-existing user", async function(){
            const name = "Alice";
            const email = "alice@example.com";
            const phone = 1234567890;
            const creditValue = 100;
            const characterTypes = ["type1", "type2"];
            const passwordHash = await ethers.keccak256(ethers.toUtf8Bytes("password"));

            const {hardhatUserRegistry} = await loadFixture(deployTokenFixture);

            await hardhatUserRegistry.registerUser(name, email, phone, creditValue, characterTypes, passwordHash);

            await expect(hardhatUserRegistry.unregisterUser(2, passwordHash)).to.be.revertedWith("User does not exist");
        });

        it("should not unregister an existing user with invalid password", async function(){

            const name = "Alice";
            const email = "alice@example.com";
            const phone = 1234567890;
            const creditValue = 100;
            const characterTypes = ["type1", "type2"];
            const passwordHash0 = await ethers.keccak256(ethers.toUtf8Bytes("password"));
            const passwordHash = await ethers.keccak256(ethers.toUtf8Bytes("invalid"));

            const {hardhatUserRegistry} = await loadFixture(deployTokenFixture);

            await hardhatUserRegistry.registerUser(name, email, phone, creditValue, characterTypes, passwordHash0);

            await expect(hardhatUserRegistry.unregisterUser(1, passwordHash)).to.be.revertedWith("Invalid password");
        });
    });

    describe("updateUser", function(){

        it("should update an existing user", async function(){
            const name = "Alice";
            const email = "alice@example.com";
            const phone = 1234567890;
            const creditValue = 100;
            const characterTypes = ["type1", "type2"];
            const passwordHash0 = await ethers.keccak256(ethers.toUtf8Bytes("password"));

            const newName = "Alice Smith";
            const newEmail = "alice.smith@example.com";
            const newPhone = 2345678901;
            const newCreditValue = 200;
            const newCharacterTypes = ["type2", "type3"];
            const passwordHash = await ethers.keccak256(ethers.toUtf8Bytes("password"));

            const {hardhatUserRegistry} = await loadFixture(deployTokenFixture);

            await hardhatUserRegistry.registerUser(name, email, phone, creditValue, characterTypes, passwordHash0);

            await expect(hardhatUserRegistry.updateUser(1, passwordHash, newName, newEmail, newPhone, newCreditValue, newCharacterTypes))
                .to.emit(hardhatUserRegistry, "UserUpdated")
                .withArgs(1, newName, newEmail, newPhone, newCreditValue, newCharacterTypes);

            const user = await hardhatUserRegistry.getUser(1, passwordHash);
            expect(user.name).to.equal(newName);
            expect(user.email).to.equal(newEmail);
            expect(user.phone).to.equal(newPhone);
            expect(user.creditValue).to.equal(newCreditValue);
            expect(user.characterTypes).to.deep.equal(newCharacterTypes);
        });

        it("should not update a non-existing user", async function(){
            const name = "Alice";
            const email = "alice@example.com";
            const phone = 1234567890;
            const creditValue = 100;
            const characterTypes = ["type1", "type2"];
            const passwordHash = await ethers.keccak256(ethers.toUtf8Bytes("password"));

            const {hardhatUserRegistry} = await loadFixture(deployTokenFixture);
            await hardhatUserRegistry.registerUser(name, email, phone, creditValue, characterTypes, passwordHash);

            await expect(hardhatUserRegistry.updateUser(2, passwordHash, "name", "email", 1234567890, 100, ["type1"]))
                .to.be.revertedWith("User does not exist");
        });

        it("should not update an existing user with invalid password", async function(){
            const name = "Alice";
            const email = "alice@example.com";
            const phone = 1234567890;
            const creditValue = 100;
            const characterTypes = ["type1", "type2"];
            const passwordHash0 = await ethers.keccak256(ethers.toUtf8Bytes("password"));
            const passwordHash = await ethers.keccak256(ethers.toUtf8Bytes("invalid"));

            const {hardhatUserRegistry} = await loadFixture(deployTokenFixture);
            await hardhatUserRegistry.registerUser(name, email, phone, creditValue, characterTypes, passwordHash0);

            await expect(hardhatUserRegistry.updateUser(1, passwordHash, "name", "email", 1234567890, 100, ["type1"]))
                .to.be.revertedWith("Invalid password");
        });

        it("should not update an existing user with invalid character types", async function(){
            const name = "Alice";
            const email = "alice@example.com";
            const phone = 1234567890;
            const creditValue = 100;
            const characterTypes = ["type1", "type2"];
            const passwordHash = await ethers.keccak256(ethers.toUtf8Bytes("password"));

            const {hardhatUserRegistry} = await loadFixture(deployTokenFixture);
            await hardhatUserRegistry.registerUser(name, email, phone, creditValue, characterTypes, passwordHash);

            await expect(hardhatUserRegistry.updateUser(1, passwordHash, "", "", 0, 0, ["type1", "invalid"]))
                .to.be.revertedWith("Invalid character types");
        });
    });
});