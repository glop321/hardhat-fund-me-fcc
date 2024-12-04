const {deployments, ethers, getNamedAccounts} = require("hardhat")
const {assert, expect} = require("chai")

describe("FundMe", async function () {

    let fundMe, deployer, mockV3Aggregator
    const sendValue = ethers.parseEther("1")

    beforeEach(async function () {
        //deploy fund me contract
        deployer = (await getNamedAccounts()).deployer
        await deployments.fixture(["all"])
        fundMe = await ethers.getContract("FundMe", deployer)
        mockV3Aggregator = await ethers.getContract("MockV3Aggregator", deployer)
    })

    describe("constructor", async function () {
        it("sets the aggregator addresses correctly", async function () {
            const response = await fundMe.priceFeed
            assert.equal(response.address, mockV3Aggregator.address)
        })
    })

    describe("fund", async function () {
        it("Fails if you don't send enough ETH", async function () {
            await expect(fundMe.fund()).to.be.revertedWith(
               "You need to spend more ETH!")
            })
        it("updated the amount funded data estructure", async function () {
            await fundMe.fund({value: sendValue})
            const response = await fundMe.addressToAmountFunded(deployer)
            assert.equal(sendValue.toString(), response.toString())
        })
        it("Adds funder to the funder array", async function () {
            await fundMe.fund({value: sendValue})
            const response = await fundMe.funders(0)
            assert.equal(response, deployer)
        })
    })

    describe("Withdraw", function () {
        beforeEach("fund the contract", async function () {
            await fundMe.fund({value: sendValue})
        })
        it("Withdraw ETH from a single founder", async function () {
            //Arrange
            const startingFundMeBalance = await ethers.provider.getBalance(fundMe)
            const startingDeployerBalance = await ethers.provider.getBalance(deployer)
            //Act
            const transactionResponse = await fundMe.withdraw()
            const transactionReceipt = await transactionResponse.wait(1)
            const {gasUsed, gasPrice} = transactionReceipt
            const gasCost = gasUsed*gasPrice

            const endingFundMeBalance = await ethers.provider.getBalance(fundMe)
            const endingDeployerBalance = await ethers.provider.getBalance(deployer)
            //Assert
            assert.equal(endingDeployerBalance + gasCost, startingFundMeBalance + startingDeployerBalance)
            assert.equal(endingFundMeBalance, 0)
        })
        it("Allows us to withdraw with multiple funders", async function () {
            //Arrange
            const accounts = await ethers.getSigners()
            for (let i=1; i<6; i++){
                const fundMeConnectAccount = await fundMe.connect(accounts[i])
                await fundMeConnectAccount.fund({value: sendValue})
            }
            const startingFundMeBalance = await ethers.provider.getBalance(fundMe)
            //Act
            const transactionResponse = await fundMe.withdraw()
            const transactionReceipt = await transactionResponse.wait(1)
            const endingFundMeBalance = await ethers.provider.getBalance(fundMe)
            //Assert
            assert.equal(endingFundMeBalance.toString(), "0")
            
            //Make sure that the founders are reset properly
            await expect(fundMe.funders(0)).to.be.reverted

            for(let i = 1; i < 6;  i++){
                assert.equal(
                    await fundMe.addressToAmountFunded(accounts[i].address),
                    0
                )
            }
        })
        it("only allows to the owner to wirhdraw", async function () {
            const accounts = await ethers.getSigners();
            const attaker = accounts[1];
            const fundMeConnectAttaker = fundMe.connect(attaker)
            expect(fundMeConnectAttaker.withdraw()).to.be.reverted
        })
    })

})